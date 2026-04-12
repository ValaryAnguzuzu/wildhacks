import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'prompTetris_user';

export interface AuthUser {
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string, password: string, displayName: string) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<AuthUser, 'displayName'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') return null;
    const u = o as Record<string, unknown>;
    if (typeof u.email !== 'string' || typeof u.displayName !== 'string') return null;
    return { email: u.email, displayName: u.displayName };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  const signIn = useCallback((email: string, _password: string, displayName: string) => {
    const next: AuthUser = {
      email: email.trim(),
      displayName: displayName.trim() || email.split('@')[0] || 'Player',
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((patch: Partial<Pick<AuthUser, 'displayName'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut, updateProfile }),
    [user, signIn, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
