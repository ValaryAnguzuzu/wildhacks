import { useCallback, useEffect, useRef, useState } from 'react';

import { LEVELS } from '../data/levels';
import {
  BlockData,
  BlockPhaseInternal,
  FeedbackData,
  LevelData,
  LevelStats,
  PlacedBlock,
} from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildFeedback(
  block: BlockData,
  placedColId: string,
  isCorrect: boolean,
  level: LevelData,
): FeedbackData {
  if (block.isDistractor) {
    return {
      correct: false,
      headline: '⚠  Distractor detected!',
      detail: block.description,
    };
  }
  if (isCorrect) {
    return {
      correct: true,
      headline: '✓  Correct!',
      detail: block.description,
    };
  }
  const correctCol = level.columns.find((c) => c.id === block.correctColumn);
  const wrongCol = level.columns.find((c) => c.id === placedColId);
  return {
    correct: false,
    headline: `✗  "${block.name}" belongs in "${correctCol?.label ?? block.correctColumn}"`,
    detail: `You placed it in "${wrongCol?.label ?? placedColId}". ${block.description}`,
  };
}

// ─── internal mutable game state (avoids stale-closure issues in setTimeout) ──

interface InternalState {
  blockQueue: BlockData[];
  currentBlock: BlockData | null;
  placedBlocks: PlacedBlock[];
  selectedColumn: number;
  timeLeft: number;
  phase: BlockPhaseInternal;
  isFlipped: boolean;
  feedback: FeedbackData | null;
  hintColumn: number | null;
  hintsLeft: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  totalCount: number;
  levelStartTime: number;
}

// ─── public return type ────────────────────────────────────────────────────────

export interface GameEngineReturn {
  currentBlock: BlockData | null;
  blockQueue: BlockData[];
  placedBlocks: PlacedBlock[];
  selectedColumn: number;
  timeLeft: number;
  timerMax: number;
  phase: BlockPhaseInternal;
  isFlipped: boolean;
  feedback: FeedbackData | null;
  hintColumn: number | null;
  hintsLeft: number;
  score: number;
  streak: number;
  bestStreak: number;
  moveLeft: () => void;
  moveRight: () => void;
  moveTo: (col: number) => void;
  drop: (col?: number) => void;
  flip: () => void;
  useHint: () => void;
  getStats: () => LevelStats;
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useGameEngine(levelIndex: number): GameEngineReturn {
  const level = LEVELS[levelIndex];

  // All mutable game data lives here — always fresh, no stale-closure risk
  const s = useRef<InternalState>({
    blockQueue: [],
    currentBlock: null,
    placedBlocks: [],
    selectedColumn: 0,
    timeLeft: level.timerSeconds,
    phase: 'idle',
    isFlipped: false,
    feedback: null,
    hintColumn: null,
    hintsLeft: 3,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    totalCount: 0,
    levelStartTime: Date.now(),
  });

  // Single render trigger — reading state always goes through s.current
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  // Timer interval ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Forward-ref to avoid circular dep with startTimer ↔ drop
  const dropRef = useRef<((col?: number) => void) | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      s.current.timeLeft = Math.max(0, s.current.timeLeft - 1);
      if (s.current.timeLeft === 0) {
        stopTimer();
        dropRef.current?.(s.current.selectedColumn);
      } else {
        rerender();
      }
    }, 1000);
  }, [stopTimer, rerender]);

  // ── Initialize / reinitialize when level changes ──────────────────────────
  useEffect(() => {
    stopTimer();
    const shuffled = shuffle(level.blocks);
    s.current = {
      blockQueue: shuffled.slice(1),
      currentBlock: shuffled[0],
      placedBlocks: [],
      selectedColumn: 0,
      timeLeft: level.timerSeconds,
      phase: 'active',
      isFlipped: false,
      feedback: null,
      hintColumn: null,
      hintsLeft: 3,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      totalCount: 0,
      levelStartTime: Date.now(),
    };
    startTimer();
    rerender();
    return () => stopTimer();
  }, [levelIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── drop ──────────────────────────────────────────────────────────────────
  const drop = useCallback(
    (col?: number) => {
      if (s.current.phase !== 'active' || !s.current.currentBlock) return;

      stopTimer();
      const targetCol = col ?? s.current.selectedColumn;
      const column = level.columns[targetCol];
      s.current.phase = 'dropping';
      rerender();

      setTimeout(() => {
        const block = s.current.currentBlock!;
        const isCorrect = !block.isDistractor && block.correctColumn === column.id;
        const newStreak = isCorrect ? s.current.streak + 1 : 0;

        s.current.totalCount += 1;
        if (isCorrect) s.current.correctCount += 1;
        s.current.score = isCorrect
          ? s.current.score + 10 * Math.max(1, newStreak)
          : Math.max(0, s.current.score - 3);
        s.current.streak = newStreak;
        s.current.bestStreak = Math.max(s.current.bestStreak, newStreak);

        const fb = buildFeedback(block, column.id, isCorrect, level);
        s.current.placedBlocks = [
          ...s.current.placedBlocks,
          { block, columnId: column.id, correct: isCorrect, feedbackMsg: fb.detail },
        ];
        s.current.feedback = fb;
        s.current.hintColumn = null;
        s.current.isFlipped = false;
        s.current.phase = 'feedback';
        rerender();

        setTimeout(() => {
          const q = s.current.blockQueue;
          if (q.length === 0) {
            s.current.currentBlock = null;
            s.current.phase = 'levelComplete';
          } else {
            s.current.currentBlock = q[0];
            s.current.blockQueue = q.slice(1);
            s.current.selectedColumn = 0;
            s.current.timeLeft = level.timerSeconds;
            s.current.feedback = null;
            s.current.phase = 'active';
            startTimer();
          }
          rerender();
        }, 1800);
      }, 500);
    },
    [level, startTimer, stopTimer, rerender],
  );

  // Keep dropRef current so the timer auto-drop always calls the latest version
  useEffect(() => {
    dropRef.current = drop;
  }, [drop]);

  // ── movement ──────────────────────────────────────────────────────────────
  const moveLeft = useCallback(() => {
    if (s.current.phase !== 'active') return;
    s.current.selectedColumn = Math.max(0, s.current.selectedColumn - 1);
    rerender();
  }, [rerender]);

  const moveRight = useCallback(() => {
    if (s.current.phase !== 'active') return;
    s.current.selectedColumn = Math.min(
      level.columns.length - 1,
      s.current.selectedColumn + 1,
    );
    rerender();
  }, [level.columns.length, rerender]);

  const moveTo = useCallback(
    (col: number) => {
      if (s.current.phase !== 'active') return;
      s.current.selectedColumn = Math.max(
        0,
        Math.min(level.columns.length - 1, col),
      );
      rerender();
    },
    [level.columns.length, rerender],
  );

  // ── flip & hint ───────────────────────────────────────────────────────────
  const flip = useCallback(() => {
    if (s.current.phase !== 'active') return;
    s.current.isFlipped = !s.current.isFlipped;
    rerender();
  }, [rerender]);

  const useHint = useCallback(() => {
    if (
      s.current.phase !== 'active' ||
      !s.current.currentBlock ||
      s.current.hintsLeft <= 0
    )
      return;
    const block = s.current.currentBlock;
    const idx = level.columns.findIndex((c) => c.id === block.correctColumn);
    s.current.hintColumn = idx >= 0 ? idx : -1;
    s.current.hintsLeft -= 1;
    rerender();
  }, [level.columns, rerender]);

  // ── stats snapshot ────────────────────────────────────────────────────────
  const getStats = useCallback(
    (): LevelStats => ({
      levelId: level.id,
      score: s.current.score,
      correctCount: s.current.correctCount,
      totalCount: s.current.totalCount,
      bestStreak: s.current.bestStreak,
      timeTakenMs: Date.now() - s.current.levelStartTime,
    }),
    [level.id],
  );

  // Return snapshot of current mutable state
  const st = s.current;
  return {
    currentBlock: st.currentBlock,
    blockQueue: st.blockQueue,
    placedBlocks: st.placedBlocks,
    selectedColumn: st.selectedColumn,
    timeLeft: st.timeLeft,
    timerMax: level.timerSeconds,
    phase: st.phase,
    isFlipped: st.isFlipped,
    feedback: st.feedback,
    hintColumn: st.hintColumn,
    hintsLeft: st.hintsLeft,
    score: st.score,
    streak: st.streak,
    bestStreak: st.bestStreak,
    moveLeft,
    moveRight,
    moveTo,
    drop,
    flip,
    useHint,
    getStats,
  };
}
