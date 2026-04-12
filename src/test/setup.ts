import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

const mockUser = {
  uid: 'vitest-test-uid',
  isAnonymous: true,
  email: null as string | null,
  displayName: null as string | null,
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: typeof mockUser | null) => void) => {
    queueMicrotask(() => cb(mockUser));
    return vi.fn();
  }),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: mockUser })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  linkWithCredential: vi.fn(),
  EmailAuthProvider: { credential: vi.fn(() => ({})) },
  updateProfile: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] as { ref: unknown }[] })),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => false,
      data: () => undefined,
    }),
  ),
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));
