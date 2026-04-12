import { useQuery } from '@tanstack/react-query';
import { animate, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import { getRecentSessions } from '@/firebase/firestore';
import { translateNetWorth } from '@/utils/gameLogic';

import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function Report() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sessions', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data: rows, error } = await getRecentSessions(uid, 80);
      if (error) throw new Error(error);
      return rows;
    },
    enabled: Boolean(uid),
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    let xp = 0;
    const concepts = new Set<string>();
    let bestXp = 0;
    let bestId = '';
    rows.forEach((r) => {
      const x = typeof r.xpEarned === 'number' ? r.xpEarned : 0;
      xp += x;
      if (x > bestXp) {
        bestXp = x;
        bestId = String(r.lessonId ?? '');
      }
      const t = r.conceptTag;
      if (typeof t === 'string') concepts.add(t);
    });
    const delta = rows.reduce((acc, r) => {
      const x = typeof r.netWorthDelta === 'number' ? r.netWorthDelta : 0;
      return acc + x;
    }, 0);
    return {
      totalXp: xp,
      conceptCount: concepts.size,
      delta,
      bestLesson: bestId,
    };
  }, [data]);

  const [displayXp, setDisplayXp] = useState(0);
  const [displayConcepts, setDisplayConcepts] = useState(0);

  useEffect(() => {
    if (!data) return;
    const ax = animate(0, stats.totalXp, {
      duration: 0.9,
      onUpdate: (v) => setDisplayXp(Math.round(v)),
    });
    const ac = animate(0, stats.conceptCount, {
      duration: 0.9,
      onUpdate: (v) => setDisplayConcepts(Math.round(v)),
    });
    return () => {
      ax.stop();
      ac.stop();
    };
  }, [data, stats.totalXp, stats.conceptCount]);

  if (isLoading) {
    return (
      <Layout>
        <div className="px-6 py-8 space-y-4 max-w-lg mx-auto">
          <div className="h-10 w-3/4 rounded-lg bg-indigo-500/10 animate-pulse" />
          <div className="h-32 w-full rounded-[var(--radius-card)] bg-indigo-500/10 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="px-6 py-12 max-w-md mx-auto text-center">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Something went wrong
          </p>
          <Button onClick={() => void refetch()}>Try again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-6 md:px-0 py-8 max-w-lg mx-auto">
        <h1
          className="mb-6"
          style={{
            fontSize: 'var(--font-display)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}
        >
          Life report
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[var(--radius-card)] border mb-6"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--xp-gold)' }}>
                {displayXp}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-caption)',
                  color: 'var(--text-secondary)',
                }}
              >
                XP (recent sessions)
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--teal)' }}>
                {displayConcepts}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-caption)',
                  color: 'var(--text-secondary)',
                }}
              >
                Concepts
              </div>
            </div>
          </div>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            {stats.delta === 0 ? (
              <>
                No net-worth change was recorded for these sessions (older runs may not
                have deltas).
              </>
            ) : (
              <>
                Simulated net worth moved about {translateNetWorth(stats.delta)} (
                {stats.delta >= 0 ? '+' : ''}
                {stats.delta.toLocaleString()}).
              </>
            )}
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Best decision: session with highest XP
            {stats.bestLesson ? ` (${stats.bestLesson})` : ''}.
          </p>
        </motion.div>
        <Button fullWidth onClick={() => navigate('/home')}>
          Keep going
        </Button>
      </div>
    </Layout>
  );
}
