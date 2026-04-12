import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { LEVEL_COUNT } from '../data/levels';
import type { LevelStats } from '../types';

export interface GameSessionRecord {
  id: string;
  at: number;
  totalScore: number;
  accuracyPct: number;
  bestStreak: number;
  speedBonusTotal: number;
  durationMs: number;
  levelScores: number[];
}

const MAX_KEPT = 50;
const MIGRATION_KEY = 'prompTetris_migrated_to_firestore_v1';
const LEGACY_SESSIONS_KEY = 'prompTetris_sessions';
const LEGACY_MAX_ANSWER_KEY = 'prompTetris_maxAnswerLevelUnlocked';

function sessionsCol(uid: string) {
  return collection(db, 'users', uid, 'sessions');
}

function settingsDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'app');
}

function sessionDoc(uid: string, sessionId: string) {
  return doc(db, 'users', uid, 'sessions', sessionId);
}

function stripId(s: GameSessionRecord): Omit<GameSessionRecord, 'id'> {
  const { id: _id, ...rest } = s;
  return rest;
}

let migrationPromise: Promise<void> | null = null;

/** One-time copy from legacy localStorage into Firestore for this uid. */
async function migrateLocalToCloudOnce(uid: string): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(MIGRATION_KEY) === '1') return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const raw = localStorage.getItem(LEGACY_SESSIONS_KEY);
      const maxRaw = localStorage.getItem(LEGACY_MAX_ANSWER_KEY);
      if (!raw && !maxRaw) {
        localStorage.setItem(MIGRATION_KEY, '1');
        return;
      }
      try {
        if (raw) {
          const sessions = JSON.parse(raw) as GameSessionRecord[];
          if (Array.isArray(sessions) && sessions.length > 0) {
            const batch = writeBatch(db);
            for (const s of sessions) {
              if (!s?.id) continue;
              batch.set(sessionDoc(uid, s.id), stripId(s));
            }
            await batch.commit();
          }
        }
        if (maxRaw) {
          const n = parseInt(maxRaw, 10);
          if (!Number.isNaN(n)) {
            const merged = Math.min(LEVEL_COUNT, Math.max(1, n));
            await setDoc(
              settingsDoc(uid),
              { maxAnswerLevelUnlocked: merged },
              { merge: true },
            );
          }
        }
      } finally {
        localStorage.removeItem(LEGACY_SESSIONS_KEY);
        localStorage.removeItem(LEGACY_MAX_ANSWER_KEY);
        localStorage.setItem(MIGRATION_KEY, '1');
      }
    })();
  }
  await migrationPromise;
}

export async function loadSessions(uid: string): Promise<GameSessionRecord[]> {
  await migrateLocalToCloudOnce(uid);
  const q = query(sessionsCol(uid), orderBy('at', 'desc'), limit(MAX_KEPT));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      at: typeof data.at === 'number' ? data.at : 0,
      totalScore: data.totalScore ?? 0,
      accuracyPct: data.accuracyPct ?? 0,
      bestStreak: data.bestStreak ?? 0,
      speedBonusTotal: data.speedBonusTotal ?? 0,
      durationMs: data.durationMs ?? 0,
      levelScores: Array.isArray(data.levelScores) ? data.levelScores : [],
    };
  });
}

function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function recordSession(
  uid: string,
  stats: LevelStats[],
  totalTimeMs: number,
): Promise<GameSessionRecord> {
  await migrateLocalToCloudOnce(uid);
  const totalScore = stats.reduce((s, l) => s + l.score, 0);
  const totalCorrect = stats.reduce((s, l) => s + l.correctCount, 0);
  const totalBlocks = stats.reduce((s, l) => s + l.totalCount, 0);
  const accuracyPct =
    totalBlocks > 0 ? Math.round((totalCorrect / totalBlocks) * 100) : 0;
  const bestStreak = Math.max(0, ...stats.map((s) => s.bestStreak));
  const speedBonusTotal = stats.reduce((s, l) => s + l.speedBonus, 0);

  const row: GameSessionRecord = {
    id: newSessionId(),
    at: Date.now(),
    totalScore,
    accuracyPct,
    bestStreak,
    speedBonusTotal,
    durationMs: totalTimeMs,
    levelScores: stats.map((s) => s.score),
  };

  await setDoc(sessionDoc(uid, row.id), stripId(row));

  const all = await loadSessions(uid);
  if (all.length > MAX_KEPT) {
    const drop = all.slice(MAX_KEPT);
    const batch = writeBatch(db);
    for (const r of drop) {
      batch.delete(sessionDoc(uid, r.id));
    }
    await batch.commit();
  }

  return row;
}

export async function clearSessions(uid: string): Promise<void> {
  const snap = await getDocs(sessionsCol(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function getBestTotalScore(uid: string): Promise<number> {
  const s = await loadSessions(uid);
  return s.reduce((m, r) => Math.max(m, r.totalScore), 0);
}

export async function getLastRunTotalScore(uid: string): Promise<number> {
  const s = await loadSessions(uid);
  return s.length > 0 ? s[0].totalScore : 0;
}

export async function getMaxAnswerLevelUnlocked(uid: string): Promise<number> {
  await migrateLocalToCloudOnce(uid);
  const snap = await getDoc(settingsDoc(uid));
  if (snap.exists()) {
    const n = snap.data()?.maxAnswerLevelUnlocked;
    if (typeof n === 'number' && !Number.isNaN(n)) {
      return Math.min(LEVEL_COUNT, Math.max(1, n));
    }
  }
  const sessions = await loadSessions(uid);
  const fallback = sessions.some((s) => s.levelScores.length >= LEVEL_COUNT)
    ? LEVEL_COUNT
    : 1;
  await setDoc(settingsDoc(uid), { maxAnswerLevelUnlocked: fallback }, { merge: true });
  return fallback;
}

export async function updateMaxAnswerLevelUnlocked(
  uid: string,
  completedLevelIndex: number,
): Promise<void> {
  await migrateLocalToCloudOnce(uid);
  const completedLevelNumber = completedLevelIndex + 1;
  const snap = await getDoc(settingsDoc(uid));
  const prev =
    snap.exists() && typeof snap.data()?.maxAnswerLevelUnlocked === 'number'
      ? snap.data()!.maxAnswerLevelUnlocked
      : 1;
  const next = Math.min(LEVEL_COUNT, Math.max(prev, completedLevelNumber));
  await setDoc(settingsDoc(uid), { maxAnswerLevelUnlocked: next }, { merge: true });
}
