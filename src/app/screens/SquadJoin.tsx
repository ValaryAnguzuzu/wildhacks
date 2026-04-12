import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import { joinSquadByInviteCode } from '@/firebase/groups';
import { useStore } from '@/store/useStore';

import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function SquadJoin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;

  const submit = async () => {
    if (!uid || !user) return;
    setBusy(true);
    setErr(null);
    const res = await joinSquadByInviteCode(uid, user.displayName, code);
    setBusy(false);
    if (res.error || !res.data) {
      setErr(res.error ?? 'Could not join');
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
          Join a squad
        </h1>
        <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Paste the invite code your friend shared (letters and numbers, no spaces
          needed).
        </p>
        <label className="block space-y-2">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Invite code
          </span>
          <input
            className="w-full px-4 py-3 rounded-[var(--radius-button)] border bg-[var(--surface-elevated)] font-mono tracking-widest uppercase"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect="off"
          />
        </label>
        {err && (
          <p className="text-sm" style={{ color: 'var(--wrong)' }}>
            {err}
          </p>
        )}
        <Button
          fullWidth
          disabled={busy || code.replace(/\s/g, '').length < 4}
          onClick={() => void submit()}
        >
          {busy ? 'Joining…' : 'Join squad'}
        </Button>
      </div>
    </Layout>
  );
}
