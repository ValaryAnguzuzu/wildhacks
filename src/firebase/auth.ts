import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from './config';

const initialUserFields = (displayName: string | null, email: string | null) => ({
  displayName: displayName ?? '',
  email: email ?? '',
  xp: 0,
  streak: 0,
  hearts: 5,
  lastPlayed: null,
  netWorth: 10000,
  skillLevel: null,
  activeCategory: null,
  activeGroupId: null,
  streakFreezes: 0,
  createdAt: serverTimestamp(),
});

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ error: string | null }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), initialUserFields(displayName, email));
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sign up failed' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        initialUserFields(cred.user.displayName ?? 'Learner', cred.user.email),
      );
    }
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sign in failed' };
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const name = cred.user.displayName ?? 'Learner';
      await setDoc(ref, initialUserFields(name, cred.user.email));
    }
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Google sign-in failed' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sign out failed' };
  }
}
