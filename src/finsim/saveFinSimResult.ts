import { doc, setDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { GameState } from './gameState';

/**
 * Persists a completed FinSim run for signed-in (non-anonymous) users.
 * Safe to no-op callers: callers must check auth before invoking.
 */
export async function saveFinSimResult(uid: string, state: GameState): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await setDoc(doc(db, 'users', uid, 'finsimResults', id), {
    finishedAt: Date.now(),
    round: state.round,
    balance: state.balance,
    savings: state.savings,
    debt: state.debt,
    history: state.history,
  });
}
