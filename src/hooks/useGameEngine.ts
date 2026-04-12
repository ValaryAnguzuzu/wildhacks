import { useCallback, useEffect, useRef, useState } from 'react';

import { LEVELS } from '../data/levels';
import {
  BlockData,
  BlockPhaseInternal,
  DISMISS_PLACEMENT_ID,
  FeedbackData,
  LevelData,
  LevelStats,
  PASS_PLACEMENT_ID,
  PlacedBlock,
} from '../types';
import { getAdaptiveTimerSeconds } from '../utilities/adaptiveTimer';

// ─── scoring / tension constants ─────────────────────────────────────────────

const SCORE_BASE = 55;
const WRONG_SCORE_PENALTY = 38;
const WRONG_TIME_PENALTY_SEC = 5;
const SPEED_BONUS_MAX = 48;
const MIN_TIMER_SEC = 2;

/** Start the falling block centered over the board (middle column index). */
function defaultSelectedColumn(numCols: number): number {
  if (numCols <= 1) return 0;
  return Math.floor(numCols / 2);
}

function streakMultiplier(streakAfterCorrect: number): number {
  if (streakAfterCorrect >= 5) return 3;
  if (streakAfterCorrect >= 3) return 2;
  return 1;
}

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
  wrongTimePenaltySec: number,
): FeedbackData {
  if (block.isDistractor) {
    return {
      correct: false,
      headline: '✗ Distractor — not a valid lane',
      detail: `${block.description} Streak lost. Next timer −${wrongTimePenaltySec}s.`,
      lostTimeSec: wrongTimePenaltySec,
    };
  }
  if (isCorrect) {
    return {
      correct: true,
      headline: '✓ Correct!',
      detail: block.description,
    };
  }
  const correctCol = level.columns.find((c) => c.id === block.correctColumn);
  const wrongCol = level.columns.find((c) => c.id === placedColId);
  return {
    correct: false,
    headline: `✗ Belongs in “${correctCol?.label ?? block.correctColumn}”`,
    detail: `You placed it in “${wrongCol?.label ?? placedColId}”. ${block.description} Streak lost. Next timer −${wrongTimePenaltySec}s.`,
    lostTimeSec: wrongTimePenaltySec,
  };
}

function buildFeedbackPassUnknown(
  block: BlockData,
  level: LevelData,
  wrongTimePenaltySec: number,
): FeedbackData {
  if (block.isDistractor) {
    return {
      correct: false,
      headline: '✗ “I don’t know” — should have dismissed',
      detail: `${block.description} Streak lost. Next timer −${wrongTimePenaltySec}s.`,
      lostTimeSec: wrongTimePenaltySec,
    };
  }
  const correctCol = level.columns.find((c) => c.id === block.correctColumn);
  return {
    correct: false,
    headline: '✗ I don’t know — counted as incorrect',
    detail: `Correct lane was “${correctCol?.label ?? block.correctColumn}”. ${block.description} Streak lost. Next timer −${wrongTimePenaltySec}s.`,
    lostTimeSec: wrongTimePenaltySec,
  };
}

// ─── internal mutable game state ─────────────────────────────────────────────

interface InternalState {
  blockQueue: BlockData[];
  currentBlock: BlockData | null;
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
  correctCount: number;
  totalCount: number;
  levelStartTime: number;
  speedBonusTotal: number;
  pendingWrongTimePenalty: number;
  isPaused: boolean;
  /** Set when `phase === 'countdown'` — 3, 2, 1, then "go". */
  countdownDisplay: number | 'go' | null;
}

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
  correctCount: number;
  totalCount: number;
  speedBonusTotal: number;
  isPaused: boolean;
  /** 3, 2, 1, or "go" while pre-round countdown is running; null otherwise. */
  countdownDisplay: number | 'go' | null;
  comboTier: 'none' | 'combo' | 'mega';
  moveLeft: () => void;
  moveRight: () => void;
  moveTo: (col: number) => void;
  drop: (col?: number) => void;
  flip: () => void;
  useHint: () => void;
  pause: () => void;
  resume: () => void;
  dismissDistractor: () => void;
  /** Non-distractor: surrender the block as a miss (same penalties as wrong placement). */
  passDontKnow: () => void;
  /** Distractor: “I don’t know — skip” counts as a miss (dismiss is the correct action). */
  skipDistractorAsMiss: () => void;
  getStats: () => LevelStats;
  /** After reading lane instructions — runs 3…2…1…GO then starts the round timer. */
  acknowledgeLevelIntro: () => void;
}

export function useGameEngine(levelIndex: number): GameEngineReturn {
  const level = LEVELS[levelIndex];

  const s = useRef<InternalState>({
    blockQueue: [],
    currentBlock: null,
    placedBlocks: [],
    selectedColumn: defaultSelectedColumn(level.columns.length),
    timeLeft: level.timerSeconds,
    timerMax: level.timerSeconds,
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
    speedBonusTotal: 0,
    pendingWrongTimePenalty: 0,
    isPaused: false,
    countdownDisplay: null,
  });

  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropRef = useRef<((col?: number) => void) | null>(null);
  const countdownTimeoutsRef = useRef<number[]>([]);

  const clearCountdown = useCallback(() => {
    countdownTimeoutsRef.current.forEach((id) => clearTimeout(id));
    countdownTimeoutsRef.current = [];
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (s.current.isPaused) return;
    timerRef.current = setInterval(() => {
      if (s.current.isPaused) return;
      s.current.timeLeft = Math.max(0, s.current.timeLeft - 1);
      if (s.current.timeLeft === 0) {
        stopTimer();
        dropRef.current?.(s.current.selectedColumn);
      } else {
        rerender();
      }
    }, 1000);
  }, [stopTimer, rerender]);

  const acknowledgeLevelIntro = useCallback(() => {
    if (s.current.phase !== 'levelIntro') return;
    clearCountdown();
    s.current.phase = 'countdown';
    const tickMs = 780;
    const goMs = 620;
    const showStep = (index: number) => {
      if (index < 3) {
        s.current.countdownDisplay = ([3, 2, 1] as const)[index];
        rerender();
        const id = window.setTimeout(() => showStep(index + 1), tickMs);
        countdownTimeoutsRef.current.push(id);
      } else {
        s.current.countdownDisplay = 'go';
        rerender();
        const id = window.setTimeout(() => {
          s.current.phase = 'active';
          s.current.countdownDisplay = null;
          s.current.levelStartTime = Date.now();
          startTimer();
          rerender();
        }, goMs);
        countdownTimeoutsRef.current.push(id);
      }
    };
    showStep(0);
  }, [clearCountdown, rerender, startTimer]);

  const advanceAfterFeedback = useCallback(() => {
    const q = s.current.blockQueue;
    if (q.length === 0) {
      s.current.currentBlock = null;
      s.current.phase = 'levelComplete';
    } else {
      s.current.currentBlock = q[0];
      s.current.blockQueue = q.slice(1);
      s.current.selectedColumn = defaultSelectedColumn(level.columns.length);
      const streakForAdaptive = s.current.streak;
      let nextMax = getAdaptiveTimerSeconds(level.timerSeconds, streakForAdaptive);
      if (s.current.pendingWrongTimePenalty > 0) {
        nextMax = Math.max(MIN_TIMER_SEC, nextMax - s.current.pendingWrongTimePenalty);
        s.current.pendingWrongTimePenalty = 0;
      }
      s.current.timerMax = nextMax;
      s.current.timeLeft = nextMax;
      s.current.feedback = null;
      s.current.phase = 'active';
      startTimer();
    }
    rerender();
  }, [level.timerSeconds, startTimer, rerender]);

  const finishFeedbackWindow = useCallback(() => {
    setTimeout(advanceAfterFeedback, 1800);
  }, [advanceAfterFeedback]);

  useEffect(() => {
    stopTimer();
    clearCountdown();
    const shuffled = shuffle(level.blocks);
    s.current = {
      blockQueue: shuffled.slice(1),
      currentBlock: shuffled[0],
      placedBlocks: [],
      selectedColumn: defaultSelectedColumn(level.columns.length),
      timeLeft: level.timerSeconds,
      timerMax: level.timerSeconds,
      phase: 'levelIntro',
      isFlipped: false,
      feedback: null,
      hintColumn: null,
      hintsLeft: 3,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      totalCount: 0,
      levelStartTime: 0,
      speedBonusTotal: 0,
      pendingWrongTimePenalty: 0,
      isPaused: false,
      countdownDisplay: null,
    };
    rerender();
    return () => {
      stopTimer();
      clearCountdown();
    };
  }, [levelIndex, level.timerSeconds, clearCountdown, stopTimer, rerender]);

  const applyCorrect = (timeLeftSnap: number, timerMaxSnap: number) => {
    const newStreak = s.current.streak + 1;
    const mult = streakMultiplier(newStreak);
    const lineScore = SCORE_BASE * mult;
    const speedBonus =
      timerMaxSnap > 0 ? Math.round((timeLeftSnap / timerMaxSnap) * SPEED_BONUS_MAX) : 0;
    s.current.speedBonusTotal += speedBonus;
    s.current.score += lineScore + speedBonus;
    s.current.streak = newStreak;
    s.current.bestStreak = Math.max(s.current.bestStreak, newStreak);
    s.current.correctCount += 1;
  };

  const applyWrong = () => {
    s.current.streak = 0;
    s.current.score = Math.max(0, s.current.score - WRONG_SCORE_PENALTY);
    s.current.pendingWrongTimePenalty = WRONG_TIME_PENALTY_SEC;
  };

  const drop = useCallback(
    (col?: number) => {
      if (s.current.isPaused || s.current.phase !== 'active' || !s.current.currentBlock)
        return;

      stopTimer();
      const targetCol = col ?? s.current.selectedColumn;
      const column = level.columns[targetCol];
      const block = s.current.currentBlock;
      const timeSnap = s.current.timeLeft;
      const maxSnap = s.current.timerMax;

      s.current.phase = 'dropping';
      rerender();

      setTimeout(() => {
        const isCorrect = !block.isDistractor && block.correctColumn === column.id;

        s.current.totalCount += 1;
        if (isCorrect) {
          applyCorrect(timeSnap, maxSnap);
        } else {
          applyWrong();
        }

        const fb = buildFeedback(
          block,
          column.id,
          isCorrect,
          level,
          WRONG_TIME_PENALTY_SEC,
        );
        s.current.placedBlocks = [
          ...s.current.placedBlocks,
          {
            block,
            columnId: column.id,
            correct: isCorrect,
            feedbackMsg: fb.detail,
          },
        ];
        s.current.feedback = fb;
        s.current.hintColumn = null;
        s.current.isFlipped = false;
        s.current.phase = 'feedback';
        rerender();

        finishFeedbackWindow();
      }, 500);
    },
    [level, stopTimer, rerender, finishFeedbackWindow],
  );

  const dismissDistractor = useCallback(() => {
    if (
      s.current.isPaused ||
      s.current.phase !== 'active' ||
      !s.current.currentBlock?.isDistractor
    )
      return;

    stopTimer();
    const block = s.current.currentBlock;
    const timeSnap = s.current.timeLeft;
    const maxSnap = s.current.timerMax;

    s.current.phase = 'dropping';
    rerender();

    setTimeout(() => {
      s.current.totalCount += 1;
      applyCorrect(timeSnap, maxSnap);

      const fb: FeedbackData = {
        correct: true,
        headline: '✓ Distractor cleared — not a lane fit',
        detail: block.description,
      };
      s.current.placedBlocks = [
        ...s.current.placedBlocks,
        {
          block,
          columnId: DISMISS_PLACEMENT_ID,
          correct: true,
          feedbackMsg: fb.detail,
        },
      ];
      s.current.feedback = fb;
      s.current.hintColumn = null;
      s.current.isFlipped = false;
      s.current.phase = 'feedback';
      rerender();

      finishFeedbackWindow();
    }, 500);
  }, [stopTimer, rerender, finishFeedbackWindow]);

  const passDontKnow = useCallback(() => {
    if (s.current.isPaused || s.current.phase !== 'active' || !s.current.currentBlock)
      return;
    const block = s.current.currentBlock;
    if (block.isDistractor) return;

    stopTimer();

    s.current.phase = 'dropping';
    rerender();

    setTimeout(() => {
      s.current.totalCount += 1;
      applyWrong();

      const fb = buildFeedbackPassUnknown(block, level, WRONG_TIME_PENALTY_SEC);
      s.current.placedBlocks = [
        ...s.current.placedBlocks,
        {
          block,
          columnId: PASS_PLACEMENT_ID,
          correct: false,
          feedbackMsg: fb.detail,
        },
      ];
      s.current.feedback = fb;
      s.current.hintColumn = null;
      s.current.isFlipped = false;
      s.current.phase = 'feedback';
      rerender();

      finishFeedbackWindow();
    }, 500);
  }, [level, stopTimer, rerender, finishFeedbackWindow]);

  const skipDistractorAsMiss = useCallback(() => {
    if (
      s.current.isPaused ||
      s.current.phase !== 'active' ||
      !s.current.currentBlock?.isDistractor
    )
      return;

    stopTimer();
    const block = s.current.currentBlock;

    s.current.phase = 'dropping';
    rerender();

    setTimeout(() => {
      s.current.totalCount += 1;
      applyWrong();

      const fb = buildFeedbackPassUnknown(block, level, WRONG_TIME_PENALTY_SEC);
      s.current.placedBlocks = [
        ...s.current.placedBlocks,
        {
          block,
          columnId: PASS_PLACEMENT_ID,
          correct: false,
          feedbackMsg: fb.detail,
        },
      ];
      s.current.feedback = fb;
      s.current.hintColumn = null;
      s.current.isFlipped = false;
      s.current.phase = 'feedback';
      rerender();

      finishFeedbackWindow();
    }, 500);
  }, [level, stopTimer, rerender, finishFeedbackWindow]);

  useEffect(() => {
    dropRef.current = drop;
  }, [drop]);

  const moveLeft = useCallback(() => {
    if (s.current.isPaused || s.current.phase !== 'active') return;
    s.current.selectedColumn = Math.max(0, s.current.selectedColumn - 1);
    rerender();
  }, [rerender]);

  const moveRight = useCallback(() => {
    if (s.current.isPaused || s.current.phase !== 'active') return;
    s.current.selectedColumn = Math.min(
      level.columns.length - 1,
      s.current.selectedColumn + 1,
    );
    rerender();
  }, [level.columns.length, rerender]);

  const moveTo = useCallback(
    (col: number) => {
      if (s.current.isPaused || s.current.phase !== 'active') return;
      s.current.selectedColumn = Math.max(0, Math.min(level.columns.length - 1, col));
      rerender();
    },
    [level.columns.length, rerender],
  );

  const flip = useCallback(() => {
    if (s.current.isPaused || s.current.phase !== 'active') return;
    s.current.isFlipped = !s.current.isFlipped;
    rerender();
  }, [rerender]);

  const useHint = useCallback(() => {
    if (
      s.current.isPaused ||
      s.current.phase !== 'active' ||
      !s.current.currentBlock ||
      s.current.currentBlock.isDistractor ||
      s.current.hintsLeft <= 0
    )
      return;
    const block = s.current.currentBlock;
    const idx = level.columns.findIndex((c) => c.id === block.correctColumn);
    s.current.hintColumn = idx >= 0 ? idx : null;
    s.current.hintsLeft -= 1;
    rerender();
  }, [level.columns, rerender]);

  const pause = useCallback(() => {
    if (s.current.phase !== 'active' && s.current.phase !== 'dropping') return;
    s.current.isPaused = true;
    stopTimer();
    rerender();
  }, [stopTimer, rerender]);

  const resume = useCallback(() => {
    if (!s.current.isPaused) return;
    s.current.isPaused = false;
    if (s.current.phase === 'active') startTimer();
    rerender();
  }, [startTimer, rerender]);

  const getStats = useCallback(
    (): LevelStats => ({
      levelId: level.id,
      score: s.current.score,
      correctCount: s.current.correctCount,
      totalCount: s.current.totalCount,
      bestStreak: s.current.bestStreak,
      speedBonus: s.current.speedBonusTotal,
      timeTakenMs:
        s.current.levelStartTime > 0 ? Date.now() - s.current.levelStartTime : 0,
    }),
    [level.id],
  );

  const st = s.current;
  const comboTier: 'none' | 'combo' | 'mega' =
    st.streak >= 5 ? 'mega' : st.streak >= 3 ? 'combo' : 'none';

  return {
    currentBlock: st.currentBlock,
    blockQueue: st.blockQueue,
    placedBlocks: st.placedBlocks,
    selectedColumn: st.selectedColumn,
    timeLeft: st.timeLeft,
    timerMax: st.timerMax,
    phase: st.phase,
    isFlipped: st.isFlipped,
    feedback: st.feedback,
    hintColumn: st.hintColumn,
    hintsLeft: st.hintsLeft,
    score: st.score,
    streak: st.streak,
    bestStreak: st.bestStreak,
    correctCount: st.correctCount,
    totalCount: st.totalCount,
    speedBonusTotal: st.speedBonusTotal,
    isPaused: st.isPaused,
    countdownDisplay: st.countdownDisplay,
    comboTier,
    moveLeft,
    moveRight,
    moveTo,
    drop,
    flip,
    useHint,
    pause,
    resume,
    dismissDistractor,
    passDontKnow,
    skipDistractorAsMiss,
    getStats,
    acknowledgeLevelIntro,
  };
}
