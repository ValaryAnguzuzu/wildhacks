import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getLessonsForCategory } from '@/firebase/firestore';
import type { Lesson } from '@/types/lesson';
import { CATEGORY_ORDER, type CategoryId } from '@/utils/categoryMeta';

export function useCategoryLessonLists() {
  const results = useQueries({
    queries: CATEGORY_ORDER.map((categoryId) => ({
      queryKey: ['lessons', categoryId] as const,
      queryFn: async () => {
        const { data, error } = await getLessonsForCategory(categoryId);
        if (error) throw new Error(error);
        return data;
      },
      staleTime: Infinity,
    })),
  });

  const lessonsByCategory = useMemo(() => {
    const m = {} as Record<CategoryId, Lesson[] | undefined>;
    CATEGORY_ORDER.forEach((id, i) => {
      m[id] = results[i].data;
    });
    return m;
  }, [results[0]?.data, results[1]?.data, results[2]?.data, results[3]?.data]);

  const isLoading = results.some((r) => r.isPending);
  const isError = results.some((r) => r.isError);

  return { lessonsByCategory, isLoading, isError, results };
}
