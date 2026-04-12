import { useQueryClient } from '@tanstack/react-query';
import { Copy, LogOut, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import { clearActiveGroupFromProfile, leaveSquad } from '@/firebase/groups';
import { useSquadBoard } from '@/hooks/useSquadBoard';
import { useStore } from '@/store/useStore';
import { currentWeekId } from '@/utils/weekId';

import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function Squad() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const groupId = user?.activeGroupId ?? null;
  const uid = auth.currentUser?.uid;

  const { data, isLoading, isError, error, refetch } = useSquadBoard(groupId);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const weekLabel = currentWeekId();

  const onLeave = useCallback(async () => {
    if (!uid || !groupId || !user) return;
    setLeaving(true);
    const res = await leaveSquad(uid, groupId);
    setLeaving(false);
    if (res.error) return;
    setUser({ ...user, activeGroupId: null });
    await queryClient.invalidateQueries({ queryKey: ['squad-board'] });
  }, [uid, groupId, user, setUser, queryClient]);

  const onClearStale = useCallback(async () => {
    if (!uid || !user) return;
    await clearActiveGroupFromProfile(uid);
    setUser({ ...user, activeGroupId: null });
    await queryClient.invalidateQueries({ queryKey: ['squad-board'] });
  }, [uid, user, setUser, queryClient]);

  const copyCode = useCallback(() => {
    const code = data?.group?.inviteCode;
    if (!code) return;
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.group?.inviteCode]);

  if (!groupId) {
    return (
      <Layout>
        <div className="w-full pt-2 pb-8 space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--teal) 18%, transparent)',
              }}
            >
              <Users size={24} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <h1
                className="font-bold"
                style={{
                  fontSize: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                }}
              >
                Squads
              </h1>
              <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                Race your friends on weekly XP. New scores each ISO week ({weekLabel}).
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-[var(--radius-card)] border space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              Create a squad and share the invite code, or join someone else&apos;s with
              theirs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button fullWidth onClick={() => navigate('/squad/create')}>
                Create a squad
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate('/squad/join')}
              >
                Join with code
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full pt-2 pb-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--font-heading)',
                color: 'var(--text-primary)',
              }}
            >
              {data?.group?.name ?? 'Your squad'}
            </h1>
            <p style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>
              Weekly XP · {weekLabel}
            </p>
          </div>
          <Button variant="ghost" onClick={() => void onLeave()} disabled={leaving}>
            <span className="flex items-center gap-2">
              <LogOut size={18} />
              {leaving ? 'Leaving…' : 'Leave squad'}
            </span>
          </Button>
        </div>

        {isLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading squad…</p>}

        {isError && (
          <div
            className="p-5 rounded-[var(--radius-card)] border space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)' }}>
              {error instanceof Error ? error.message : 'Could not load this squad.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void refetch()}>Try again</Button>
              <Button variant="secondary" onClick={() => void onClearStale()}>
                Clear squad from profile
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && !data?.group && (
          <div
            className="p-5 rounded-[var(--radius-card)] border space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)' }}>
              This squad no longer exists or you don&apos;t have access. Clear it from
              your profile to join another.
            </p>
            <Button onClick={() => void onClearStale()}>Clear squad from profile</Button>
          </div>
        )}

        {!isLoading && !isError && data?.group && (
          <>
            <div
              className="p-5 rounded-[var(--radius-card)] border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <div
                  className="text-xs uppercase tracking-wide font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Invite code
                </div>
                <div
                  className="font-mono text-2xl font-bold tracking-widest"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {data.group.inviteCode}
                </div>
              </div>
              <Button variant="secondary" onClick={copyCode}>
                <span className="flex items-center gap-2">
                  <Copy size={18} />
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </Button>
            </div>

            <div
              className="rounded-[var(--radius-card)] border overflow-hidden"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="px-4 py-3 border-b flex justify-between text-sm font-medium"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Learner</span>
                <span>Week XP</span>
              </div>
              <ul className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {data.members.map((m, i) => (
                  <li
                    key={m.uid}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor:
                        m.uid === uid
                          ? 'color-mix(in srgb, var(--teal) 8%, transparent)'
                          : undefined,
                    }}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className="tabular-nums font-semibold w-6 shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="truncate font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {m.displayName}
                        {m.uid === uid && (
                          <span style={{ color: 'var(--teal)' }}> · you</span>
                        )}
                      </span>
                    </span>
                    <span
                      className="font-semibold tabular-nums shrink-0"
                      style={{ color: 'var(--xp-gold)' }}
                    >
                      {m.weekId === weekLabel ? m.weeklyXp : 0}
                    </span>
                  </li>
                ))}
              </ul>
              {data.members.length === 0 && (
                <p className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                  No members yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
