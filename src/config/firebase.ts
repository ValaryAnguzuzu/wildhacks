import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function assertFirebaseEnv(c: FirebaseOptions): void {
  const required: (keyof FirebaseOptions)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];
  const missing = required.filter((key) => !c[key]);
  if (missing.length > 0) {
    throw new Error(
      `[firebase] Missing env: ${missing.join(', ')}. Copy .env.example to .env and set VITE_FIREBASE_* (see Firebase console → Project settings).`,
    );
  }
}

assertFirebaseEnv(firebaseConfig);

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/** Resolved async so Analytics only loads in supported environments (e.g. browser). */
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!firebaseConfig.measurementId) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((ok) =>
      ok ? getAnalytics(app) : null,
    );
  }
  return analyticsPromise;
}
