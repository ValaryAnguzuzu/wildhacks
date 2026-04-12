import { create } from 'zustand';

import type { CategoryProgress } from '@/types/lesson';

export type CelebrationEvent =
  | { type: 'xpFloat'; amount: number; position: { x: number; y: number } }
  | { type: 'streakMilestone'; days: number }
  | { type: 'perfectLesson' }
  | { type: 'worldComplete'; world: number; categoryId: string }
  | { type: 'firstLoginOfDay'; streak: number }
  | { type: 'streakBroken' }
  | { type: 'streakFreezeOffer'; restoreTo: number };

export type SessionSlice = {
  lessonId: string | null;
  categoryId: string | null;
  phase: 'concept' | 'quiz' | 'result';
  choiceMade: string | null;
  correct: boolean | null;
  startTime: number | null;
  xpEarned: number;
};

export type ProfileUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  xp: number;
  streak: number;
  hearts: number;
  lastPlayed: import('firebase/firestore').Timestamp | null;
  netWorth: number;
  skillLevel: string | null;
  activeCategory: string | null;
  /** Learning squad (weekly XP race with friends). */
  activeGroupId: string | null;
  streakFreezes: number;
  /** Set when a long absence breaks a streak so a freeze can restore the prior value. */
  recoverableStreak?: number | null;
};

type State = {
  user: ProfileUser | null;
  progress: Record<string, CategoryProgress>;
  skipNextUserFlush: boolean;
  session: SessionSlice;
  celebrationQueue: CelebrationEvent[];
  setUser: (user: ProfileUser | null) => void;
  setProgress: (categoryId: string, data: CategoryProgress) => void;
  setSession: (fields: Partial<SessionSlice>) => void;
  resetSession: () => void;
  pushCelebration: (event: CelebrationEvent) => void;
  popCelebration: () => void;
  markSkipNextUserFlush: () => void;
};

const emptySession = (): SessionSlice => ({
  lessonId: null,
  categoryId: null,
  phase: 'concept',
  choiceMade: null,
  correct: null,
  startTime: null,
  xpEarned: 0,
});

export const useStore = create<State>((set) => ({
  user: null,
  progress: {},
  skipNextUserFlush: false,
  session: emptySession(),
  celebrationQueue: [],
  setUser: (user) => set({ user }),
  setProgress: (categoryId, data) =>
    set((s) => ({ progress: { ...s.progress, [categoryId]: data } })),
  setSession: (fields) => set((s) => ({ session: { ...s.session, ...fields } })),
  resetSession: () => set({ session: emptySession() }),
  pushCelebration: (event) =>
    set((s) => ({ celebrationQueue: [...s.celebrationQueue, event] })),
  popCelebration: () => set((s) => ({ celebrationQueue: s.celebrationQueue.slice(1) })),
  markSkipNextUserFlush: () => set({ skipNextUserFlush: true }),
}));
