import { useQuery } from '@tanstack/react-query';

import { getLesson } from '@/firebase/firestore';

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId] as const,
    queryFn: async () => {
      const { data, error } = await getLesson(lessonId!);
      if (error) throw new Error(error);
      if (!data) throw new Error('Lesson not found');
      return data;
    },
    enabled: Boolean(lessonId),
    staleTime: Infinity,
  });
}
