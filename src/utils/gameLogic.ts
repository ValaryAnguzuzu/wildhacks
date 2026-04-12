import type { CategoryProgress, Lesson } from '@/types/lesson';

export function calculateXP(
  correct: boolean,
  firstTry: boolean,
  streakDay: number,
): number {
  if (!correct) return 0;
  const base = firstTry ? 10 : 5;
  const bonus = Math.min(Math.max(0, streakDay) * 5, 25);
  return base + bonus;
}

export function checkStreakUpdate(
  lastPlayed: Date | null,
  currentStreak: number,
): { newStreak: number; streakBroken: boolean; previousStreak: number } {
  const previousStreak = currentStreak;
  const today = startOfDay(new Date());
  if (!lastPlayed) {
    return {
      newStreak: Math.max(1, currentStreak || 1),
      streakBroken: false,
      previousStreak,
    };
  }
  const last = startOfDay(lastPlayed);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays <= 0) {
    return { newStreak: currentStreak, streakBroken: false, previousStreak };
  }
  if (diffDays === 1) {
    return { newStreak: currentStreak + 1, streakBroken: false, previousStreak };
  }
  return { newStreak: 1, streakBroken: currentStreak > 0, previousStreak };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function checkWorldUnlock(
  lessonsComplete: string[],
  allLessons: Lesson[],
  worldsUnlocked: number,
): { worldUnlocked: boolean; newWorldNumber: number | null } {
  if (allLessons.length === 0) return { worldUnlocked: false, newWorldNumber: null };
  const maxWorld = Math.max(...allLessons.map((l) => l.world));
  const inWorld = allLessons.filter((l) => l.world === worldsUnlocked);
  if (inWorld.length === 0) return { worldUnlocked: false, newWorldNumber: null };
  const done = new Set(lessonsComplete);
  const allCurrentDone = inWorld.every((l) => done.has(l.id));
  if (!allCurrentDone) return { worldUnlocked: false, newWorldNumber: null };
  if (worldsUnlocked >= maxWorld) return { worldUnlocked: false, newWorldNumber: null };
  return { worldUnlocked: true, newWorldNumber: worldsUnlocked + 1 };
}

export function updateNetWorth(currentNetWorth: number, correct: boolean): number {
  const delta = correct ? randInt(200, 800) : -randInt(100, 400);
  return Math.max(1000, Math.round(currentNetWorth + delta));
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function translateNetWorth(delta: number): string {
  const a = Math.abs(delta);
  if (a < 500) return 'a few nice dinners';
  if (a < 1000) return 'a month of groceries';
  if (a < 2500) return 'a flight somewhere new';
  if (a < 5000) return 'a month of rent';
  if (a < 10000) return 'a solid emergency fund';
  return 'a used car, free and clear';
}

export type LessonStatus = 'complete' | 'perfect' | 'available' | 'locked';

export function getLessonStatus(
  lessonId: string,
  progress: CategoryProgress,
  allLessons: Lesson[],
): LessonStatus {
  const { lessonsComplete = [], perfectLessons = [] } = progress;
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) return 'locked';
  if (perfectLessons.includes(lessonId)) return 'perfect';
  if (lessonsComplete.includes(lessonId)) return 'complete';
  return 'available';
}

export type MarkLessonPayload = {
  perfect: boolean;
  xpEarned: number;
  conceptTag: string;
};

/** Merge lesson completion into local progress (mirrors server-side mark logic) when sync fails. */
export function mergeProgressAfterLessonComplete(
  prev: CategoryProgress,
  lessonId: string,
  payload: MarkLessonPayload,
  allLessons: Lesson[],
): {
  progress: CategoryProgress;
  worldUnlocked: boolean;
  newWorldNumber: number | null;
} {
  const lessonsComplete = [...new Set([...(prev.lessonsComplete ?? []), lessonId])];
  const conceptsUnlocked = [
    ...new Set([...(prev.conceptsUnlocked ?? []), payload.conceptTag]),
  ];
  const perfectLessons = payload.perfect
    ? [...new Set([...(prev.perfectLessons ?? []), lessonId])]
    : [...(prev.perfectLessons ?? [])];
  const worldsUnlockedBefore = prev.worldsUnlocked ?? 1;
  const { worldUnlocked, newWorldNumber } = checkWorldUnlock(
    lessonsComplete,
    allLessons,
    worldsUnlockedBefore,
  );
  const worldsUnlocked =
    worldUnlocked && newWorldNumber ? newWorldNumber : worldsUnlockedBefore;
  return {
    progress: {
      worldsUnlocked,
      lessonsComplete,
      conceptsUnlocked,
      perfectLessons,
      xpEarned: (prev.xpEarned ?? 0) + payload.xpEarned,
    },
    worldUnlocked,
    newWorldNumber,
  };
}

export function shouldShowLifeReport(sessionsCompleted: number): boolean {
  return sessionsCompleted > 0 && sessionsCompleted % 5 === 0;
}
