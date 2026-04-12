import { motion } from 'motion/react';
import { useEffect } from 'react';

import { patchUser, updateUser } from '@/firebase/firestore';
import { type CelebrationEvent, useStore } from '@/store/useStore';

const CATEGORY_CONFETTI: Record<string, string[]> = {
  investing: ['#0D9488', '#34D399'],
  budgeting: ['#F59E0B', '#FBBF24'],
  taxes: ['#6366F1', '#818CF8'],
  realEstate: ['#F43F5E', '#FB7185'],
};

function StreakFreezeModal({
  event,
  onDone,
}: {
  event: CelebrationEvent & { type: 'streakFreezeOffer' };
  onDone: () => void;
}) {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const confirm = async () => {
    if (!user) {
      onDone();
      return;
    }
    const nextFreezes = Math.max(0, user.streakFreezes - 1);
    const { error } = await patchUser(user.uid, {
      streak: event.restoreTo,
      streakFreezes: nextFreezes,
    });
    if (!error) {
      await updateUser(user.uid, { recoverableStreak: null });
      setUser({
        ...user,
        streak: event.restoreTo,
        streakFreezes: nextFreezes,
        recoverableStreak: null,
      });
    }
    onDone();
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full p-6 rounded-[var(--radius-card)] border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
      >
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Use your streak freeze?
        </h3>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Restore your streak to {event.restoreTo} days. You have {user.streakFreezes}{' '}
          freeze
          {user.streakFreezes === 1 ? '' : 's'} left.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 rounded-[var(--radius-button)] font-medium"
            style={{ backgroundColor: 'var(--teal)', color: 'white' }}
            onClick={() => void confirm()}
          >
            Confirm
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-[var(--radius-button)] border border-[var(--border-subtle)]"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onDone}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CelebrationManager() {
  const queue = useStore((s) => s.celebrationQueue);
  const pop = useStore((s) => s.popCelebration);
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    if (
      current.type === 'streakMilestone' ||
      current.type === 'streakBroken' ||
      current.type === 'firstLoginOfDay' ||
      current.type === 'perfectLesson'
    ) {
      const ms =
        current.type === 'streakMilestone'
          ? 2500
          : current.type === 'streakBroken'
            ? 3000
            : current.type === 'firstLoginOfDay'
              ? 2000
              : 3000;
      const t = setTimeout(() => pop(), ms);
      return () => clearTimeout(t);
    }
  }, [current, pop]);

  useEffect(() => {
    if (current?.type === 'worldComplete') {
      const colors = CATEGORY_CONFETTI[current.categoryId] ?? CATEGORY_CONFETTI.investing;
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 }, colors });
      });
    }
    if (current?.type === 'perfectLesson') {
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 55,
          origin: { y: 0.55 },
          colors: ['#FFB800', '#34D399'],
        });
      });
    }
  }, [current]);

  if (!current) return null;

  if (current.type === 'xpFloat') {
    return (
      <motion.div
        className="fixed z-[200] pointer-events-none font-bold text-xl"
        style={{
          left: current.position.x,
          top: current.position.y,
          color: 'var(--xp-gold)',
        }}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -48 }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={() => pop()}
      >
        +{current.amount} XP
      </motion.div>
    );
  }

  if (current.type === 'streakMilestone') {
    return (
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-[var(--radius-card)] shadow-lg"
        style={{ backgroundColor: 'var(--xp-gold)', color: '#1a1a1a' }}
      >
        <span className="font-semibold">{current.days} day streak!</span>
      </motion.div>
    );
  }

  if (current.type === 'streakBroken') {
    return (
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm max-w-sm text-center"
      >
        Your streak reset. Start a new one today.
      </motion.div>
    );
  }

  if (current.type === 'firstLoginOfDay') {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-[200] px-4 pt-14 pb-3 flex justify-center"
      >
        <div
          className="px-5 py-3 rounded-b-[var(--radius-card)] border border-t-0 max-w-md w-full text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-body)' }}>
            Day {current.streak}. You&apos;re building something real.
          </p>
        </div>
      </motion.div>
    );
  }

  if (current.type === 'perfectLesson') {
    return (
      <motion.button
        type="button"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => pop()}
      >
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.15, 1] }}
          className="text-6xl mb-4"
        >
          ✨
        </motion.div>
        <p
          className="font-bold mb-6"
          style={{ fontSize: 'var(--font-display)', color: 'var(--xp-gold)' }}
        >
          Perfect!
        </p>
      </motion.button>
    );
  }

  if (current.type === 'worldComplete') {
    const colors = CATEGORY_CONFETTI[current.categoryId] ?? CATEGORY_CONFETTI.investing;

    const share = async () => {
      const text = `I finished World ${current.world} on FinLife!`;
      try {
        if (navigator.share) await navigator.share({ title: 'FinLife', text });
        else await navigator.clipboard.writeText(text);
      } catch {
        /* ignore */
      }
    };

    return (
      <motion.button
        type="button"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/75 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => pop()}
      >
        <motion.div
          className="pointer-events-auto max-w-md w-full p-8 rounded-[var(--radius-card)] text-center border"
          style={{ backgroundColor: 'var(--surface)', borderColor: colors[0] }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors[0] }}>
            World {current.world} complete!
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Nice work — the next path is open.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="px-5 py-2 rounded-[var(--radius-button)] font-semibold text-white"
              style={{ backgroundColor: colors[0] }}
              onClick={() => pop()}
            >
              Keep going
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-[var(--radius-button)] border border-[var(--border-subtle)]"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => void share()}
            >
              Share
            </button>
          </div>
        </motion.div>
      </motion.button>
    );
  }

  if (current.type === 'streakFreezeOffer') {
    return <StreakFreezeModal event={current} onDone={() => pop()} />;
  }

  return null;
}
