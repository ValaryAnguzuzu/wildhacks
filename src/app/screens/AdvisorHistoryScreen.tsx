import { useQuery } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { detectVerdict } from '@/components/advisor/DecisionCard';
import { auth } from '@/firebase/config';
import { type AdvisorHistoryEntry, getAdvisorHistory } from '@/firebase/firestore';

import { Button } from '../components/Button';

function verdictBadge(verdict: AdvisorHistoryEntry['verdict'], response: string) {
  const v = verdict ?? detectVerdict(response);
  if (v === 'yes')
    return {
      label: 'Go for it',
      color: 'var(--correct)',
      bg: 'color-mix(in srgb, var(--correct) 18%, transparent)',
    };
  if (v === 'no')
    return {
      label: 'Not right now',
      color: 'var(--wrong)',
      bg: 'color-mix(in srgb, var(--wrong) 15%, transparent)',
    };
  if (v === 'conditional')
    return {
      label: 'With conditions',
      color: '#b45309',
      bg: 'color-mix(in srgb, #f59e0b 18%, transparent)',
    };
  return { label: 'Advice', color: 'var(--text-secondary)', bg: 'var(--border-subtle)' };
}

function formatSavedAt(ts: Timestamp | undefined) {
  if (!ts || typeof ts.toDate !== 'function') return 'Unknown date';
  return ts.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SnapshotMini({ s }: { s: AdvisorHistoryEntry['snapshot'] }) {
  return (
    <div
      className="text-xs mt-3 p-3 rounded-lg border space-y-1"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
        Snapshot at save
      </div>
      <div>
        Checking ${s.checking.toLocaleString()} · Savings ${s.savings.toLocaleString()}
      </div>
      <div>Cash ${s.cash.toLocaleString()}</div>
      <div>
        Credit ${s.creditCardBalance.toLocaleString()} / $
        {s.creditCardLimit.toLocaleString()}
      </div>
      <div>
        Income ${s.monthlyIncome.toLocaleString()} · Expenses $
        {s.monthlyExpenses.toLocaleString()}
      </div>
    </div>
  );
}

export function AdvisorHistoryScreen() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['advisor-history', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data: rows, error } = await getAdvisorHistory(uid);
      if (error) throw new Error(error);
      return rows;
    },
    enabled: Boolean(uid),
  });

  const rows = data ?? [];

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col">
      <header
        className="shrink-0 border-b px-3 pt-[max(env(safe-area-inset-top),10px)] pb-3"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            className="shrink-0 px-2 py-2 text-sm font-medium"
            style={{ color: 'var(--teal)' }}
            onClick={() => navigate('/advisor')}
          >
            ←
          </button>
          <h1
            className="flex-1 text-center font-bold truncate pr-8"
            style={{ fontSize: 'var(--font-subheading)', color: 'var(--text-primary)' }}
          >
            Past advice
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full pb-10">
        {!uid ? (
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to see saved advice.</p>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>Could not load history.</p>
            <Button onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            When you save advice from a decision card in chat, it will show up here.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => {
              const badge = verdictBadge(row.verdict, row.advisorResponse);
              const isOpen = expanded[row.id] ?? false;
              const lines = row.advisorResponse.split('\n');
              const truncated = lines.slice(0, 2).join('\n').trim();
              const hasMore = row.advisorResponse.trim().length > truncated.length;

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-[var(--radius-card)] border p-4"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  <p
                    className="font-medium mb-2"
                    style={{ color: 'var(--text-primary)', fontSize: 'var(--font-body)' }}
                  >
                    {row.userQuestion}
                  </p>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-semibold mb-2"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <p
                    className={`whitespace-pre-line text-sm leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {isOpen ? row.advisorResponse : `${truncated}${hasMore ? '…' : ''}`}
                  </p>
                  {hasMore ? (
                    <button
                      type="button"
                      className="mt-2 flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--teal)' }}
                      onClick={() => setExpanded((e) => ({ ...e, [row.id]: !isOpen }))}
                    >
                      {isOpen ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Read full advice <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  ) : null}
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Saved {formatSavedAt(row.savedAt)}
                  </p>
                  <SnapshotMini s={row.snapshot} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
