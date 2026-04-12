import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { CategoryProgress, Lesson } from '@/types/lesson';

import {
  calculateXP,
  checkStreakUpdate,
  checkWorldUnlock,
  getLessonStatus,
  shouldShowLifeReport,
  translateNetWorth,
  updateNetWorth,
} from './gameLogic';

const scenario: Lesson['scenario'] = {
  situation: '',
  choices: [{ id: 'A', text: '' }],
  correct: 'A',
  feedback: {},
  lesson: '',
  conceptTag: 't',
};

function L(partial: Pick<Lesson, 'id' | 'world' | 'order'>): Lesson {
  return {
    lessonId: partial.id,
    categoryId: 'x',
    title: '',
    concept: '',
    takeaway: '',
    scenario,
    ...partial,
  };
}

describe('calculateXP', () => {
  test('wrong gives 0', () => {
    expect(calculateXP(false, true, 5)).toBe(0);
  });
  test('first try base 10 plus streak cap', () => {
    expect(calculateXP(true, true, 0)).toBe(10);
    expect(calculateXP(true, true, 10)).toBe(35);
  });
  test('retry gives 5 plus streak', () => {
    expect(calculateXP(true, false, 0)).toBe(5);
  });
});

describe('checkStreakUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-12T15:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('no last played starts at least 1', () => {
    const r = checkStreakUpdate(null, 0);
    expect(r.newStreak).toBeGreaterThanOrEqual(1);
  });

  test('same calendar day keeps streak', () => {
    const r = checkStreakUpdate(new Date('2026-04-12T08:00:00'), 4);
    expect(r.newStreak).toBe(4);
    expect(r.streakBroken).toBe(false);
  });

  test('yesterday increments streak', () => {
    const r = checkStreakUpdate(new Date('2026-04-11T10:00:00'), 4);
    expect(r.newStreak).toBe(5);
    expect(r.streakBroken).toBe(false);
  });

  test('gap of 2+ days resets and may break', () => {
    const r = checkStreakUpdate(new Date('2026-04-09T10:00:00'), 6);
    expect(r.newStreak).toBe(1);
    expect(r.streakBroken).toBe(true);
  });
});

describe('checkWorldUnlock', () => {
  const lessons: Lesson[] = [
    L({ id: 'a', world: 1, order: 1 }),
    L({ id: 'b', world: 1, order: 2 }),
    L({ id: 'c', world: 2, order: 1 }),
  ];

  test('unlocks world 2 when world 1 complete', () => {
    const r = checkWorldUnlock(['a', 'b'], lessons, 1);
    expect(r.worldUnlocked).toBe(true);
    expect(r.newWorldNumber).toBe(2);
  });
});

describe('getLessonStatus', () => {
  const lessons: Lesson[] = [
    L({ id: 'a', world: 1, order: 1 }),
    L({ id: 'b', world: 1, order: 2 }),
  ];
  const p: CategoryProgress = {
    worldsUnlocked: 1,
    lessonsComplete: [],
    conceptsUnlocked: [],
    xpEarned: 0,
    perfectLessons: [],
  };

  test('all incomplete lessons available', () => {
    expect(getLessonStatus('a', p, lessons)).toBe('available');
    expect(getLessonStatus('b', p, lessons)).toBe('available');
  });
});

describe('shouldShowLifeReport', () => {
  test('every 5 sessions', () => {
    expect(shouldShowLifeReport(5)).toBe(true);
    expect(shouldShowLifeReport(4)).toBe(false);
  });
});

describe('translateNetWorth', () => {
  test('buckets', () => {
    expect(translateNetWorth(100)).toContain('dinner');
    expect(translateNetWorth(12000)).toContain('car');
  });
});

describe('updateNetWorth', () => {
  test('never below 1000', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    let v = 1000;
    for (let i = 0; i < 20; i++) v = updateNetWorth(v, false);
    expect(v).toBeGreaterThanOrEqual(1000);
    vi.restoreAllMocks();
  });
});
