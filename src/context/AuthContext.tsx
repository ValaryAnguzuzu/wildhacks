import { onAuthStateChanged, type User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { auth } from '@/firebase/config';
import { getProgress, getUser, updateUser } from '@/firebase/firestore';
import { useStore } from '@/store/useStore';
import type { CategoryProgress } from '@/types/lesson';
import { CATEGORY_ORDER } from '@/utils/categoryMeta';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function lastPlayedToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts || typeof ts.toDate !== 'function') return null;
  return ts.toDate();
}

function isDifferentCalendarDay(a: Date | null, b: Date): boolean {
  if (!a) return true;
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() !== y.getFullYear() ||
    x.getMonth() !== y.getMonth() ||
    x.getDate() !== y.getDate()
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUser = useStore((s) => s.setUser);
  const setProgress = useStore((s) => s.setProgress);
  const pushCelebration = useStore((s) => s.pushCelebration);
  const markSkip = useStore((s) => s.markSkipNextUserFlush);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        useStore.setState({ user: null, progress: {} });
        setLoading(false);
        return;
      }

      const { data: docData, error } = await getUser(fbUser.uid);
      if (error || !docData) {
        setLoading(false);
        return;
      }

      const lastPlayed = docData.lastPlayed as Timestamp | null | undefined;
      const lastDate = lastPlayedToDate(lastPlayed ?? null);
      const now = new Date();
      const streakNum = typeof docData.streak === 'number' ? docData.streak : 0;
      let hearts = typeof docData.hearts === 'number' ? docData.hearts : 5;
      let streak = streakNum;

      if (isDifferentCalendarDay(lastDate, now)) {
        hearts = 5;
        await updateUser(fbUser.uid, { hearts: 5 });
      }

      const diffMs = lastDate
        ? now.getTime() - lastDate.getTime()
        : Number.POSITIVE_INFINITY;
      const diffDays = lastDate ? Math.floor(diffMs / 86400000) : 999;
      if (diffDays >= 2 && streakNum > 0) {
        streak = 1;
        await updateUser(fbUser.uid, { streak: 1, recoverableStreak: streakNum });
        pushCelebration({ type: 'streakBroken' });
      }

      const prev = useStore.getState().user;
      const sameSession = prev?.uid === fbUser.uid;
      const docSkill = (docData.skillLevel as string) ?? null;
      const docCategory = (docData.activeCategory as string) ?? null;

      markSkip();
      setStoreUser({
        uid: fbUser.uid,
        displayName: (docData.displayName as string) ?? fbUser.displayName,
        email: (docData.email as string) ?? fbUser.email,
        xp: typeof docData.xp === 'number' ? docData.xp : 0,
        streak,
        hearts,
        lastPlayed: lastPlayed ?? null,
        netWorth: typeof docData.netWorth === 'number' ? docData.netWorth : 10000,
        skillLevel: docSkill ?? (sameSession ? prev.skillLevel : null) ?? null,
        activeCategory: docCategory ?? (sameSession ? prev.activeCategory : null) ?? null,
        activeGroupId:
          typeof docData.activeGroupId === 'string' && docData.activeGroupId.length > 0
            ? docData.activeGroupId
            : ((sameSession ? prev.activeGroupId : null) ?? null),
        streakFreezes:
          typeof docData.streakFreezes === 'number' ? docData.streakFreezes : 0,
        recoverableStreak:
          typeof docData.recoverableStreak === 'number'
            ? docData.recoverableStreak
            : null,
      });

      const progressEntries: Record<string, CategoryProgress> = {};
      await Promise.all(
        CATEGORY_ORDER.map(async (cid) => {
          const { data } = await getProgress(fbUser.uid, cid);
          progressEntries[cid] = data;
        }),
      );
      markSkip();
      Object.entries(progressEntries).forEach(([k, v]) => setProgress(k, v));

      if (lastDate && isDifferentCalendarDay(lastDate, now) && streak > 0) {
        pushCelebration({ type: 'firstLoginOfDay', streak });
      }

      setLoading(false);
    });
  }, [markSkip, pushCelebration, setProgress, setStoreUser]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4">
        <div className="h-10 w-48 rounded-lg bg-teal-500/10 animate-pulse" />
        <div className="h-32 w-full max-w-md rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse mx-auto" />
        <div className="h-48 w-full max-w-md rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse mx-auto" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
