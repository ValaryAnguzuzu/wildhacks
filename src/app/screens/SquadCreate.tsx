import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import { createSquad } from '@/firebase/groups';
import { useStore } from '@/store/useStore';

import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function SquadCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;

  const submit = async () => {
    if (!uid || !user) return;
    setBusy(true);
    setErr(null);
    const res = await createSquad(uid, user.displayName, name);
    setBusy(false);
    if (res.error || !res.data) {
      setErr(res.error ?? 'Could not create squad');
      return;
    }
    setUser({ ...user, activeGroupId: res.data.groupId });
    await queryClient.invalidateQueries({ queryKey: ['squad-board'] });
    navigate('/squad');
  };

  return (
    <Layout>
      <div className="w-full pt-2 pb-8 max-w-md mx-auto space-y-6">
        <button
          type="button"
          className="text-sm font-medium"
          style={{ color: 'var(--teal)' }}
          onClick={() => navigate('/squad')}
        >
          ← Back
        </button>
        <h1
          className="font-bold"
          style={{
            fontSize: 'var(--font-heading)',
            color: 'var(--text-primary)',
          }}
        >
          Create a squad
        </h1>
        <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Name your group. You&apos;ll get an invite code to share — everyone&apos;s{' '}
          <strong>weekly XP</strong> from new lessons shows on the leaderboard.
        </p>
        <label className="block space-y-2">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Squad name
          </span>
          <input
            className="w-full px-4 py-3 rounded-[var(--radius-button)] border bg-[var(--surface-elevated)]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Room 4 finance crew"
            maxLength={80}
          />
        </label>
        {err && (
          <p className="text-sm" style={{ color: 'var(--wrong)' }}>
            {err}
          </p>
        )}
        <Button fullWidth disabled={busy || !name.trim()} onClick={() => void submit()}>
          {busy ? 'Creating…' : 'Create squad'}
        </Button>
      </div>
    </Layout>
  );
}
