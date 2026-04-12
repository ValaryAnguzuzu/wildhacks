import type { Timestamp } from 'firebase/firestore';

export type SquadGroup = {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  memberUids: string[];
  createdAt: Timestamp | null;
};

export type SquadMember = {
  uid: string;
  displayName: string;
  joinedAt: Timestamp | null;
  weeklyXp: number;
  weekId: string;
};
