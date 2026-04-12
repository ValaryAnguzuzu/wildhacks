import type { Lesson } from '@/types/lesson';

import budgeting from './budgeting.json';
import investing from './investing.json';
import realEstate from './realEstate.json';
import taxes from './taxes.json';

export const ALL_LESSONS: Lesson[] = [
  ...(investing as Lesson[]),
  ...(budgeting as Lesson[]),
  ...(taxes as Lesson[]),
  ...(realEstate as Lesson[]),
];

const byCategory = new Map<string, Lesson[]>();

export function getLocalLessonsForCategory(categoryId: string): Lesson[] {
  if (!byCategory.has(categoryId)) {
    const list = ALL_LESSONS.filter((l) => l.categoryId === categoryId).sort(
      (a, b) => a.world - b.world || a.order - b.order,
    );
    byCategory.set(categoryId, list);
  }
  return byCategory.get(categoryId)!;
}

export function getLocalLesson(lessonId: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === lessonId);
}

export const CATEGORY_IDS = ['investing', 'budgeting', 'taxes', 'realEstate'] as const;
