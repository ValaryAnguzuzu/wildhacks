import { useQuery } from '@tanstack/react-query';

import { getSquadGroup, getSquadMembers } from '@/firebase/groups';
import type { SquadGroup, SquadMember } from '@/types/group';

export type SquadBoard = {
  group: SquadGroup | null;
  members: SquadMember[];
};

export function useSquadBoard(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ['squad-board', groupId ?? ''],
    queryFn: async (): Promise<SquadBoard> => {
      if (!groupId) return { group: null, members: [] };
      const [g, m] = await Promise.all([
        getSquadGroup(groupId),
        getSquadMembers(groupId),
      ]);
      if (g.error) throw new Error(g.error);
      if (m.error) throw new Error(m.error);
      return { group: g.data, members: m.data };
    },
    enabled: Boolean(groupId),
    staleTime: 30_000,
  });
}
