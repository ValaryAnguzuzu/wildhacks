import { LEVEL_COUNT } from '../data/levels';
import { LevelStats } from '../types';

const SESSIONS_KEY = 'prompTetris_sessions';
const MAX_ANSWER_LEVEL_KEY = 'prompTetris_maxAnswerLevelUnlocked';

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

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadSessions(): GameSessionRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GameSessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordSession(
  stats: LevelStats[],
  totalTimeMs: number,
): GameSessionRecord {
  const totalScore = stats.reduce((s, l) => s + l.score, 0);
  const totalCorrect = stats.reduce((s, l) => s + l.correctCount, 0);
  const totalBlocks = stats.reduce((s, l) => s + l.totalCount, 0);
  const accuracyPct =
    totalBlocks > 0 ? Math.round((totalCorrect / totalBlocks) * 100) : 0;
  const bestStreak = Math.max(0, ...stats.map((s) => s.bestStreak));
  const speedBonusTotal = stats.reduce((s, l) => s + l.speedBonus, 0);

  const row: GameSessionRecord = {
    id: uid(),
    at: Date.now(),
    totalScore,
    accuracyPct,
    bestStreak,
    speedBonusTotal,
    durationMs: totalTimeMs,
    levelScores: stats.map((s) => s.score),
  };

  const prev = loadSessions();
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([row, ...prev].slice(0, 50)));
  return row;
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

export function getBestTotalScore(): number {
  const s = loadSessions();
  return s.reduce((m, r) => Math.max(m, r.totalScore), 0);
}

/** Most recent completed run total score (for “beat your last run”). */
export function getLastRunTotalScore(): number {
  const s = loadSessions();
  return s.length > 0 ? s[0].totalScore : 0;
}

/** Highest level number (1…LEVEL_COUNT) whose answer guide is readable. Level 1 is always at least visible for new players. */
export function getMaxAnswerLevelUnlocked(): number {
  if (typeof localStorage === 'undefined') return 1;
  const raw = localStorage.getItem(MAX_ANSWER_LEVEL_KEY);
  if (!raw) {
    const migrated = loadSessions().some((s) => s.levelScores.length >= LEVEL_COUNT)
      ? LEVEL_COUNT
      : 1;
    localStorage.setItem(MAX_ANSWER_LEVEL_KEY, String(migrated));
    return migrated;
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(LEVEL_COUNT, Math.max(1, n));
}

/** Call when the player finishes a level (0-based index) in Play mode. */
export function updateMaxAnswerLevelUnlocked(completedLevelIndex: number): void {
  if (typeof localStorage === 'undefined') return;
  const completedLevelNumber = completedLevelIndex + 1;
  const prev = getMaxAnswerLevelUnlocked();
  const next = Math.min(LEVEL_COUNT, Math.max(prev, completedLevelNumber));
  localStorage.setItem(MAX_ANSWER_LEVEL_KEY, String(next));
}
