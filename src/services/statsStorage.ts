import { LevelStats } from '../types';

const SESSIONS_KEY = 'prompTetris_sessions';

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
