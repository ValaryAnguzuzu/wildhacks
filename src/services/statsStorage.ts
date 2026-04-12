import { auth } from '../config/firebase';
import type { LevelStats } from '../types';

import type { GameSessionRecord } from './statsFirestore';
import * as remote from './statsFirestore';

export type { GameSessionRecord };

function userId(): string | null {
  return auth.currentUser?.uid ?? null;
}

/** Completed runs (newest first), synced to Firestore for the signed-in user. */
export async function loadSessions(): Promise<GameSessionRecord[]> {
  const id = userId();
  if (!id) return [];
  return remote.loadSessions(id);
}

export async function recordSession(
  stats: LevelStats[],
  totalTimeMs: number,
): Promise<GameSessionRecord | null> {
  const id = userId();
  if (!id) {
    console.warn('[stats] No user — session not saved. Wait for sign-in.');
    return null;
  }
  return remote.recordSession(id, stats, totalTimeMs);
}

export async function clearSessions(): Promise<void> {
  const id = userId();
  if (!id) return;
  await remote.clearSessions(id);
}

export async function getBestTotalScore(): Promise<number> {
  const id = userId();
  if (!id) return 0;
  return remote.getBestTotalScore(id);
}

export async function getLastRunTotalScore(): Promise<number> {
  const id = userId();
  if (!id) return 0;
  return remote.getLastRunTotalScore(id);
}

export async function getMaxAnswerLevelUnlocked(): Promise<number> {
  const id = userId();
  if (!id) return 1;
  return remote.getMaxAnswerLevelUnlocked(id);
}

export async function updateMaxAnswerLevelUnlocked(completedLevelIndex: number): Promise<void> {
  const id = userId();
  if (!id) return;
  await remote.updateMaxAnswerLevelUnlocked(id, completedLevelIndex);
}
