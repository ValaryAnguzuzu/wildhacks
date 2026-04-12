import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import type { SquadGroup, SquadMember } from '@/types/group';
import { currentWeekId } from '@/utils/weekId';

import { db } from './config';
import { updateUser } from './firestore';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toError(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export function generateInviteCode(length = 6): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return s;
}

function normalizeInviteCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export async function createSquad(
  uid: string,
  displayName: string | null,
  name: string,
): Promise<{
  data: { groupId: string; inviteCode: string } | null;
  error: string | null;
}> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Name is required' };

  try {
    const uSnap = await getDoc(doc(db, 'users', uid));
    const prevGroup = uSnap.data()?.activeGroupId as string | undefined;
    if (typeof prevGroup === 'string' && prevGroup.length > 0) {
      await leaveSquad(uid, prevGroup);
    }
    let inviteCode = '';
    let attempts = 0;
    let codeOk = false;
    const groupRef = doc(collection(db, 'groups'));

    while (attempts < 12 && !codeOk) {
      attempts += 1;
      inviteCode = generateInviteCode(6);
      const invSnap = await getDoc(doc(db, 'invites', inviteCode));
      if (!invSnap.exists()) codeOk = true;
    }
    if (!codeOk) return { data: null, error: 'Could not generate invite code' };

    await setDoc(groupRef, {
      name: trimmed,
      createdBy: uid,
      createdAt: serverTimestamp(),
      inviteCode,
      memberUids: [uid],
    });

    await setDoc(doc(db, 'invites', inviteCode), {
      groupId: groupRef.id,
      groupName: trimmed,
      createdBy: uid,
    });

    const wk = currentWeekId();
    await setDoc(doc(db, 'groups', groupRef.id, 'members', uid), {
      displayName: displayName ?? 'Learner',
      joinedAt: serverTimestamp(),
      weeklyXp: 0,
      weekId: wk,
    });

    await updateUser(uid, { activeGroupId: groupRef.id });

    return { data: { groupId: groupRef.id, inviteCode }, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function joinSquadByInviteCode(
  uid: string,
  displayName: string | null,
  rawCode: string,
): Promise<{ data: { groupId: string } | null; error: string | null }> {
  const code = normalizeInviteCode(rawCode);
  if (code.length < 4) return { data: null, error: 'Enter a valid invite code' };

  try {
    const invSnap = await getDoc(doc(db, 'invites', code));
    if (!invSnap.exists()) return { data: null, error: 'No squad found for that code' };

    const groupId = String(invSnap.data().groupId ?? '');
    if (!groupId) return { data: null, error: 'Invalid invite' };

    const uSnap = await getDoc(doc(db, 'users', uid));
    const prevGroup = uSnap.data()?.activeGroupId as string | undefined;
    if (typeof prevGroup === 'string' && prevGroup.length > 0 && prevGroup !== groupId) {
      await leaveSquad(uid, prevGroup);
    }

    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    if (!groupSnap.exists()) return { data: null, error: 'That squad no longer exists' };

    const memberUids = (groupSnap.data().memberUids as string[] | undefined) ?? [];
    if (memberUids.includes(uid)) {
      await updateUser(uid, { activeGroupId: groupId });
      return { data: { groupId }, error: null };
    }

    await updateDoc(doc(db, 'groups', groupId), {
      memberUids: arrayUnion(uid),
    });

    const wk = currentWeekId();
    await setDoc(doc(db, 'groups', groupId, 'members', uid), {
      displayName: displayName ?? 'Learner',
      joinedAt: serverTimestamp(),
      weeklyXp: 0,
      weekId: wk,
    });

    await updateUser(uid, { activeGroupId: groupId });

    return { data: { groupId }, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

/** Clear `activeGroupId` when the group doc is missing or rules block access. */
export async function clearActiveGroupFromProfile(uid: string): Promise<void> {
  await updateUser(uid, { activeGroupId: null });
}

export async function leaveSquad(
  uid: string,
  groupId: string,
): Promise<{ data: true | null; error: string | null }> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      await updateUser(uid, { activeGroupId: null });
      return { data: true, error: null };
    }

    const memberUids = (groupSnap.data().memberUids as string[] | undefined) ?? [];
    if (memberUids.includes(uid)) {
      await updateDoc(groupRef, { memberUids: arrayRemove(uid) });
    }

    await deleteDoc(doc(db, 'groups', groupId, 'members', uid)).catch(() => {});
    await updateUser(uid, { activeGroupId: null });

    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function getSquadGroup(
  groupId: string,
): Promise<{ data: SquadGroup | null; error: string | null }> {
  try {
    const snap = await getDoc(doc(db, 'groups', groupId));
    if (!snap.exists()) return { data: null, error: null };
    const d = snap.data();
    return {
      data: {
        id: snap.id,
        name: String(d.name ?? 'Squad'),
        createdBy: String(d.createdBy ?? ''),
        inviteCode: String(d.inviteCode ?? ''),
        memberUids: Array.isArray(d.memberUids) ? d.memberUids.map(String) : [],
        createdAt: d.createdAt ?? null,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

export async function getSquadMembers(
  groupId: string,
  max = 50,
): Promise<{ data: SquadMember[]; error: string | null }> {
  try {
    const q = query(
      collection(db, 'groups', groupId, 'members'),
      orderBy('weeklyXp', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    const rows: SquadMember[] = snap.docs.map((d) => {
      const x = d.data();
      return {
        uid: d.id,
        displayName: String(x.displayName ?? 'Learner'),
        joinedAt: x.joinedAt ?? null,
        weeklyXp: typeof x.weeklyXp === 'number' ? x.weeklyXp : 0,
        weekId: String(x.weekId ?? ''),
      };
    });
    return { data: rows, error: null };
  } catch (e) {
    return { data: [], error: toError(e) };
  }
}

/** Add lesson XP to this ISO week's running total for the member doc. No-op if not in squad. */
export async function incrementSquadWeeklyXp(
  uid: string,
  groupId: string,
  xpDelta: number,
): Promise<void> {
  if (xpDelta <= 0 || !groupId) return;

  try {
    const mref = doc(db, 'groups', groupId, 'members', uid);
    const snap = await getDoc(mref);
    const wk = currentWeekId();

    if (!snap.exists()) return;

    const prevWeek = String(snap.data().weekId ?? '');
    if (prevWeek !== wk) {
      await updateDoc(mref, { weeklyXp: xpDelta, weekId: wk });
    } else {
      await updateDoc(mref, { weeklyXp: increment(xpDelta) });
    }
  } catch {
    // offline / permission — ignore
  }
}
