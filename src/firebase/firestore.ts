import {
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { CategoryProgress, Lesson, LessonScenario } from '@/types/lesson';
import { checkWorldUnlock, type MarkLessonPayload } from '@/utils/gameLogic';

import { db } from './config';

function toError(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

const defaultProgress = (): CategoryProgress => ({
  worldsUnlocked: 1,
  lessonsComplete: [],
  conceptsUnlocked: [],
  xpEarned: 0,
  perfectLessons: [],
});

let localLessonsCache: Lesson[] | null = null;

type LessonDoc = Partial<Lesson> & {
  scenario?: LessonScenario;
  questions?: unknown;
};

function resolveScenario(raw: LessonDoc): LessonScenario | null {
  if (raw.scenario && typeof raw.scenario === 'object') return raw.scenario;
  if (Array.isArray(raw.questions) && raw.questions.length > 0) {
    const first = raw.questions[0];
    if (first && typeof first === 'object') return first as LessonScenario;
  }
  return null;
}

/** Normalize Firestore / cache JSON into the app `Lesson` shape (doc id → lessonId). */
export function normalizeLesson(raw: unknown, docId: string): Lesson {
  const r = raw as LessonDoc;
  const scenario = resolveScenario(r);
  if (!scenario) {
    throw new Error(`Lesson document ${docId} is missing scenario or questions`);
  }
  const resolvedId = String(r.id ?? r.lessonId ?? docId);
  const questions = Array.isArray(r.questions)
    ? (r.questions as LessonScenario[])
    : undefined;
  return {
    id: resolvedId,
    lessonId: String(r.lessonId ?? r.id ?? docId),
    categoryId: String(r.categoryId ?? ''),
    world: Number(r.world ?? 0),
    order: Number(r.order ?? 0),
    title: String(r.title ?? ''),
    concept: String(r.concept ?? ''),
    takeaway: String(r.takeaway ?? ''),
    scenario,
    questions,
  };
}

async function loadLocalLessons(): Promise<Lesson[]> {
  if (localLessonsCache) return localLessonsCache;
  const mod = await import('@/content/lessons.json');
  const rows = mod.default as unknown[];
  const lessons = rows.map((row, i) => {
    const id = String((row as { id?: string }).id ?? i);
    return normalizeLesson(row, id);
  });
  localLessonsCache = lessons;
  return lessons;
}

async function getLocalLessonsForCategory(categoryId: string): Promise<Lesson[]> {
  const allLessons = await loadLocalLessons();
  return allLessons
    .filter((lesson) => lesson.categoryId === categoryId)
    .sort((a, b) => a.world - b.world || a.order - b.order);
}

async function getLocalLesson(lessonId: string): Promise<Lesson | null> {
  const allLessons = await loadLocalLessons();
  return (
    allLessons.find((lesson) => lesson.lessonId === lessonId || lesson.id === lessonId) ??
    null
  );
}

export async function getUser(
  uid: string,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { data: null, error: null };
    return { data: snap.data() as Record<string, unknown>, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function updateUser(
  uid: string,
  fields: Record<string, unknown>,
): Promise<{ data: true | null; error: string | null }> {
  try {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, fields, { merge: true });
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

/** Use for FieldValue.increment / serverTimestamp (requires existing user doc). */
export async function patchUser(
  uid: string,
  fields: Record<string, unknown>,
): Promise<{ data: true | null; error: string | null }> {
  try {
    await updateDoc(doc(db, 'users', uid), fields);
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function getProgress(
  uid: string,
  categoryId: string,
): Promise<{ data: CategoryProgress; error: string | null }> {
  try {
    const ref = doc(db, 'users', uid, 'progress', categoryId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { data: defaultProgress(), error: null };
    const d = snap.data() as Partial<CategoryProgress>;
    const asIdList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)) : [];
    return {
      data: {
        worldsUnlocked: d.worldsUnlocked ?? 1,
        lessonsComplete: asIdList(d.lessonsComplete),
        conceptsUnlocked: asIdList(d.conceptsUnlocked),
        xpEarned: d.xpEarned ?? 0,
        perfectLessons: asIdList(d.perfectLessons),
      },
      error: null,
    };
  } catch (e) {
    return { data: defaultProgress(), error: toError(e) };
  }
}

export async function updateProgress(
  uid: string,
  categoryId: string,
  fields: Partial<CategoryProgress>,
): Promise<{ data: true | null; error: string | null }> {
  try {
    const ref = doc(db, 'users', uid, 'progress', categoryId);
    await setDoc(ref, fields as Record<string, unknown>, { merge: true });
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export type { MarkLessonPayload };

export type MarkLessonResult = {
  progress: CategoryProgress;
  worldUnlocked: boolean;
  newWorldNumber: number | null;
};

export async function markLessonComplete(
  uid: string,
  categoryId: string,
  lessonId: string,
  payload: MarkLessonPayload,
  sessionMeta: {
    result: boolean;
    correctOnFirst: boolean;
    durationSeconds: number;
    netWorthDelta?: number;
  },
): Promise<{ data: MarkLessonResult | null; error: string | null }> {
  try {
    const { data: allLessons } = await getLessonsForCategory(categoryId);
    const progressRef = doc(db, 'users', uid, 'progress', categoryId);
    const existingProgress = await getDoc(progressRef);
    if (!existingProgress.exists()) {
      await setDoc(progressRef, defaultProgress() as unknown as Record<string, unknown>);
    }

    const patch: Record<string, unknown> = {
      lessonsComplete: arrayUnion(lessonId),
      conceptsUnlocked: arrayUnion(payload.conceptTag),
      xpEarned: increment(payload.xpEarned),
    };
    if (payload.perfect) {
      patch.perfectLessons = arrayUnion(lessonId);
    }
    await updateDoc(progressRef, patch);

    const snap = await getDoc(progressRef);
    const raw = snap.data() as CategoryProgress;
    const lessonsComplete = raw.lessonsComplete ?? [];
    const worldsUnlockedBefore = raw.worldsUnlocked ?? 1;
    const { worldUnlocked, newWorldNumber } = checkWorldUnlock(
      lessonsComplete,
      allLessons,
      worldsUnlockedBefore,
    );
    let worldsUnlocked = worldsUnlockedBefore;
    if (worldUnlocked && newWorldNumber) {
      worldsUnlocked = newWorldNumber;
      await updateDoc(progressRef, { worldsUnlocked });
    }

    const finalSnap = await getDoc(progressRef);
    const fd = finalSnap.data() as CategoryProgress;
    const progress: CategoryProgress = {
      worldsUnlocked: fd.worldsUnlocked ?? 1,
      lessonsComplete: fd.lessonsComplete ?? [],
      conceptsUnlocked: fd.conceptsUnlocked ?? [],
      xpEarned: fd.xpEarned ?? 0,
      perfectLessons: fd.perfectLessons ?? [],
    };

    const sessionWrite = await writeSession(uid, {
      categoryId,
      lessonId,
      result: sessionMeta.result,
      xpEarned: payload.xpEarned,
      correctOnFirst: sessionMeta.correctOnFirst,
      durationSeconds: sessionMeta.durationSeconds,
      conceptTag: payload.conceptTag,
      netWorthDelta: sessionMeta.netWorthDelta,
    });
    if (sessionWrite.error) {
      console.warn('[markLessonComplete] session log failed:', sessionWrite.error);
    }

    return {
      data: {
        progress,
        worldUnlocked,
        newWorldNumber,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function getLessonsForCategory(
  categoryId: string,
): Promise<{ data: Lesson[]; error: string | null }> {
  try {
    const q = query(
      collection(db, 'content', 'lessons', 'items'),
      where('categoryId', '==', categoryId),
      orderBy('world', 'asc'),
      orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      console.warn('[offline] Using local lesson cache');
      return { data: await getLocalLessonsForCategory(categoryId), error: null };
    }
    const remote: Lesson[] = [];
    for (const d of snap.docs) {
      try {
        remote.push(normalizeLesson(d.data(), d.id));
      } catch (e) {
        console.warn('[getLessonsForCategory] skip invalid doc', d.id, e);
      }
    }
    if (remote.length === 0) {
      console.warn('[offline] Using local lesson cache');
      return { data: await getLocalLessonsForCategory(categoryId), error: null };
    }
    return {
      data: remote.sort((a, b) => a.world - b.world || a.order - b.order),
      error: null,
    };
  } catch {
    console.warn('[offline] Using local lesson cache');
    return { data: await getLocalLessonsForCategory(categoryId), error: null };
  }
}

export async function getLesson(
  lessonId: string,
): Promise<{ data: Lesson | null; error: string | null }> {
  try {
    const ref = doc(db, 'content', 'lessons', 'items', lessonId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      try {
        return {
          data: normalizeLesson(snap.data(), snap.id),
          error: null,
        };
      } catch (e) {
        console.warn('[getLesson] invalid Firestore doc, trying cache', lessonId, e);
        console.warn('[offline] Using local lesson cache');
        const local = await getLocalLesson(lessonId);
        return { data: local, error: null };
      }
    }
    console.warn('[offline] Using local lesson cache');
    const local = await getLocalLesson(lessonId);
    return { data: local, error: null };
  } catch {
    console.warn('[offline] Using local lesson cache');
    const local = await getLocalLesson(lessonId);
    return { data: local, error: null };
  }
}

export async function writeSession(
  uid: string,
  fields: {
    categoryId: string;
    lessonId: string;
    result: boolean;
    xpEarned: number;
    correctOnFirst: boolean;
    durationSeconds: number;
    conceptTag?: string;
    netWorthDelta?: number;
  },
): Promise<{ data: true | null; error: string | null }> {
  try {
    const ref = doc(collection(db, 'users', uid, 'sessions'));
    await setDoc(ref, {
      ...fields,
      createdAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function getSessionCount(
  uid: string,
): Promise<{ data: number; error: string | null }> {
  try {
    const c = collection(db, 'users', uid, 'sessions');
    const agg = await getCountFromServer(query(c));
    return { data: agg.data().count, error: null };
  } catch (e) {
    return { data: 0, error: toError(e) };
  }
}

export async function getRecentSessions(
  uid: string,
  max = 5,
): Promise<{
  data: Array<Record<string, unknown> & { id: string }>;
  error: string | null;
}> {
  try {
    const q = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<
      Record<string, unknown> & { id: string }
    >;
    return { data: rows, error: null };
  } catch (e) {
    return { data: [], error: toError(e) };
  }
}

export async function getUserSessionsSample(
  uid: string,
  max = 100,
): Promise<{
  data: Array<Record<string, unknown> & { id: string }>;
  error: string | null;
}> {
  try {
    const q = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<
      Record<string, unknown> & { id: string }
    >;
    return { data: rows, error: null };
  } catch (e) {
    return { data: [], error: toError(e) };
  }
}

export async function decrementHearts(
  uid: string,
): Promise<{ data: true | null; error: string | null }> {
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { hearts: increment(-1) });
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}
