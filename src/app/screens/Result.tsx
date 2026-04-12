import { animate, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getConceptLine } from '@/content/conceptDictionary';
import type { Lesson } from '@/types/lesson';

import { Button } from '../components/Button';

type ResultState = {
  xp: number;
  correct: boolean;
  perfect: boolean;
  lesson: Lesson;
  practiceReplay?: boolean;
  syncIssue?: boolean;
  lifeReportAvailable?: boolean;
};

export function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;
  const [conceptOpen, setConceptOpen] = useState(false);
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (!state?.perfect) return;
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 65,
        origin: { y: 0.55 },
        colors: ['#FFB800', '#34D399'],
      });
    });
  }, [state?.perfect]);

  useEffect(() => {
    if (!state) return;
    const c = animate(0, state.xp, {
      duration: 0.8,
      onUpdate: (v) => setDisplayXp(Math.round(v)),
    });
    return () => c.stop();
  }, [state]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <p style={{ color: 'var(--text-secondary)' }}>No result to show.</p>
        <Button className="ml-4" onClick={() => navigate('/home')}>
          Home
        </Button>
      </div>
    );
  }

  const { correct, perfect, lesson, practiceReplay, syncIssue, lifeReportAvailable } =
    state;
  const tag = lesson.scenario.conceptTag;

  return (
    <div className="min-h-screen px-6 py-10 flex flex-col items-center justify-center bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-8 rounded-[var(--radius-card)] border text-center"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: correct ? 'var(--correct)' : 'var(--wrong)',
        }}
      >
        {perfect && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-2"
          >
            ⭐
          </motion.div>
        )}
        <h1
          className="mb-2"
          style={{
            fontSize: 'var(--font-display)',
            fontWeight: 'var(--font-weight-bold)',
            color: perfect
              ? 'var(--xp-gold)'
              : correct
                ? 'var(--correct)'
                : 'var(--wrong)',
          }}
        >
          {perfect ? 'Perfect!' : correct ? 'Nice work' : 'Good effort'}
        </h1>
        <p
          className="mb-6"
          style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}
        >
          {practiceReplay
            ? 'Practice round — XP for this lesson was already counted.'
            : correct
              ? perfect
                ? 'First try, full marks.'
                : 'You got there — review builds mastery.'
              : (lesson.scenario.feedback[lesson.scenario.correct] ??
                'Keep practicing — consistency wins.')}
        </p>
        {syncIssue && (
          <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Progress was saved on this device; sign in again when you&apos;re online to
            sync.
          </p>
        )}
        <div className="mb-6 font-bold text-3xl" style={{ color: 'var(--xp-gold)' }}>
          {practiceReplay ? '0' : displayXp} XP
        </div>
        <button
          type="button"
          onClick={() => setConceptOpen(true)}
          className="mb-6 text-sm underline"
          style={{ color: 'var(--teal)' }}
        >
          Concept: {tag.replace(/-/g, ' ')}
        </button>
        <Button fullWidth onClick={() => navigate(`/learn/${lesson.categoryId}`)}>
          Continue
        </Button>
        {lifeReportAvailable && (
          <button
            type="button"
            className="mt-4 w-full text-sm underline"
            style={{ color: 'var(--teal)' }}
            onClick={() => navigate('/report')}
          >
            View your life report
          </button>
        )}
      </motion.div>

      {conceptOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setConceptOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="max-w-sm w-full p-6 rounded-[var(--radius-card)] border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-body)' }}>
              {getConceptLine(tag)}
            </p>
            <Button className="mt-4" fullWidth onClick={() => setConceptOpen(false)}>
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
