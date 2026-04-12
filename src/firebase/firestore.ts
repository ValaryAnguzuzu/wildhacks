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

import type { CategoryProgress, Lesson } from '@/types/lesson';
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

function normalizeLesson(raw: Lesson, lessonId?: string): Lesson {
  const resolvedId = raw.id ?? lessonId ?? raw.lessonId;
  return {
    ...raw,
    id: resolvedId,
    lessonId: raw.lessonId ?? resolvedId,
  };
}

async function loadLocalLessons(): Promise<Lesson[]> {
  if (localLessonsCache) return localLessonsCache;
  const mod = await import('@/content/lessons.json');
  const lessons = (mod.default as Lesson[]).map((lesson) =>
    normalizeLesson(lesson, lesson.id),
  );
  localLessonsCache = lessons;
  return lessons;
}

async function getLocalLessonsForCategory(categoryId: string): Promise<Lesson[]> {
  console.warn('[offline] Using local lesson cache');
  const allLessons = await loadLocalLessons();
  return allLessons
    .filter((lesson) => lesson.categoryId === categoryId)
    .sort((a, b) => a.world - b.world || a.order - b.order);
}

async function getLocalLesson(lessonId: string): Promise<Lesson | null> {
  console.warn('[offline] Using local lesson cache');
  const allLessons = await loadLocalLessons();
  return allLessons.find((lesson) => lesson.lessonId === lessonId) ?? null;
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
    return {
      data: {
        worldsUnlocked: d.worldsUnlocked ?? 1,
        lessonsComplete: d.lessonsComplete ?? [],
        conceptsUnlocked: d.conceptsUnlocked ?? [],
        xpEarned: d.xpEarned ?? 0,
        perfectLessons: d.perfectLessons ?? [],
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
    await setDoc(progressRef, defaultProgress() as unknown as Record<string, unknown>, {
      merge: true,
    });

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
      return { data: await getLocalLessonsForCategory(categoryId), error: null };
    }
    const remote = snap.docs.map((d) => normalizeLesson(d.data() as Lesson, d.id));
    return {
      data: remote.sort((a, b) => a.world - b.world || a.order - b.order),
      error: null,
    };
  } catch {
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
      return {
        data: normalizeLesson(snap.data() as Lesson, snap.id),
        error: null,
      };
    }
    const local = await getLocalLesson(lessonId);
    return { data: local, error: null };
  } catch {
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
