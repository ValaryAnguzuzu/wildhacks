import type { User } from 'firebase/auth';
import {
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { auth } from '../config/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { displayName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (next) => {
      if (!next) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error('[auth] Anonymous sign-in failed', e);
          setLoading(false);
        }
        return;
      }
      setUser(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const trimmedEmail = email.trim();
      const cred = EmailAuthProvider.credential(trimmedEmail, password);
      try {
        if (auth.currentUser?.isAnonymous) {
          await linkWithCredential(auth.currentUser, cred);
        } else {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        }
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'auth/email-already-in-use' && auth.currentUser?.isAnonymous) {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } else {
          throw e;
        }
      }
      const name = displayName.trim();
      if (name && auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: name });
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await signInAnonymously(auth);
  }, []);

  const updateProfile = useCallback(async (patch: { displayName?: string }) => {
    if (!auth.currentUser || patch.displayName === undefined) return;
    await firebaseUpdateProfile(auth.currentUser, {
      displayName: patch.displayName,
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithEmail, signOut, updateProfile }),
    [user, loading, signInWithEmail, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { User };
