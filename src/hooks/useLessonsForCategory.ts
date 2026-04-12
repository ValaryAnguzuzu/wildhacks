import { useQuery } from '@tanstack/react-query';

import { getLessonsForCategory } from '@/firebase/firestore';

export function useLessonsForCategory(categoryId: string | null | undefined) {
  return useQuery({
    queryKey: ['lessons', categoryId],
    queryFn: async () => {
      const { data, error } = await getLessonsForCategory(categoryId!);
      if (error) throw new Error(error);
      return data;
    },
    enabled: Boolean(categoryId),
    staleTime: Infinity,
  });
}
