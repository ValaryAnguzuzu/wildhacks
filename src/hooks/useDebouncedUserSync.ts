import { useEffect, useRef } from 'react';

import { updateUser } from '@/firebase/firestore';
import { useStore } from '@/store/useStore';

/** Debounced sync of profile fields to Firestore (500ms), skipping the initial hydration write. */
export function useDebouncedUserSync() {
  const user = useStore((s) => s.user);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primed = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      primed.current = false;
      return;
    }
    if (!primed.current) {
      primed.current = true;
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const u = useStore.getState().user;
      if (!u?.uid) return;
      void updateUser(u.uid, {
        xp: u.xp,
        streak: u.streak,
        hearts: u.hearts,
        netWorth: u.netWorth,
        skillLevel: u.skillLevel,
        activeCategory: u.activeCategory,
        streakFreezes: u.streakFreezes,
        displayName: u.displayName ?? '',
        email: u.email ?? '',
        recoverableStreak: u.recoverableStreak ?? null,
      });
    }, 500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user]);
}
