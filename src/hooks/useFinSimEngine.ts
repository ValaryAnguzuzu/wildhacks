import { useCallback, useEffect, useRef, useState } from 'react';

import {
  evaluateAllocation,
  FIN_SIM_ROUND_COUNT,
  FINSIM_SCENARIO,
  type FinSimResources,
  finSimResourcesLose,
  type FinSimRound,
  type FinSimStep,
} from '@/content/finSimScenario';
import type { LevelStats } from '@/types/lesson';
import {
  type CategoryAllocation,
  emptyAllocation,
  sumAllocation,
} from '@/utils/gameLogic';

export type FinSimUiPhase = 'roundIntro' | 'step' | 'feedback' | 'gameWon' | 'gameLost';

function cloneRes(r: FinSimResources): FinSimResources {
  return { savings: r.savings, debt: r.debt, investing: r.investing };
}

function equalSplit(pool: number): CategoryAllocation {
  const a = emptyAllocation();
  const ids = ['needs', 'debt', 'savings', 'investing', 'wants'] as const;
  const base = Math.floor(pool / 5);
  const rem = pool - base * 5;
  ids.forEach((id, i) => {
    a[id] = base + (i < rem ? 1 : 0);
  });
  return a;
}

export interface UseFinSimEngineReturn {
  phase: FinSimUiPhase;
  roundIndex: number;
  stepIndex: number;
  currentRound: FinSimRound | null;
  currentStep: FinSimStep | null;
  resources: FinSimResources;
  allocationDraft: CategoryAllocation;
  score: number;
  streak: number;
  bestStreak: number;
  timeLeft: number;
  timerMax: number;
  feedback: { headline: string; detail: string; good: boolean; lost: boolean } | null;
  goodDecisions: number;
  totalDecisions: number;
  acknowledgeRoundIntro: () => void;
  continueStep: () => void;
  adjustCategory: (id: keyof CategoryAllocation, delta: number) => void;
  splitPoolEvenly: () => void;
  submitAllocation: () => void;
  dismissFeedback: () => void;
  getRunStats: () => LevelStats[];
}

export function useFinSimEngine(): UseFinSimEngineReturn {
  const [phase, setPhase] = useState<FinSimUiPhase>('roundIntro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [resources, setResources] = useState<FinSimResources>({
    savings: 280,
    debt: 520,
    investing: 75,
  });
  const [allocationDraft, setAllocationDraft] =
    useState<CategoryAllocation>(emptyAllocation);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [goodDecisions, setGoodDecisions] = useState(0);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [feedback, setFeedback] = useState<{
    headline: string;
    detail: string;
    good: boolean;
    lost: boolean;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const splitAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutFiredRef = useRef(false);
  const timerArmedRef = useRef(false);

  const currentRound = FINSIM_SCENARIO[roundIndex] ?? null;
  const currentStep = currentRound?.steps[stepIndex] ?? null;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const timerMax = currentStep?.kind === 'allocate' ? currentStep.timerSec : 0;

  const startDecisionTimer = useCallback(
    (sec: number) => {
      stopTimer();
      timeoutFiredRef.current = false;
      timerArmedRef.current = false;
      setTimeLeft(sec);
      queueMicrotask(() => {
        timerArmedRef.current = true;
      });
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
    },
    [stopTimer],
  );

  useEffect(() => {
    timeoutFiredRef.current = false;
    timerArmedRef.current = false;
  }, [roundIndex, stepIndex]);

  useEffect(() => {
    if (phase === 'step' && currentStep?.kind === 'allocate') {
      setAllocationDraft(emptyAllocation());
    }
  }, [phase, currentStep, roundIndex, stepIndex]);

  const bumpDecisionStats = useCallback((good: boolean, scoreDelta: number) => {
    setScore((s) => s + scoreDelta);
    setTotalDecisions((n) => n + 1);
    setGoodDecisions((g) => g + (good ? 1 : 0));
    if (good) {
      setStreak((st) => {
        const n = st + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
  }, []);

  const advanceLinear = useCallback(() => {
    const round = FINSIM_SCENARIO[roundIndex];
    if (!round) return;
    const next = stepIndex + 1;
    if (next >= round.steps.length) {
      if (roundIndex + 1 >= FIN_SIM_ROUND_COUNT) {
        setPhase('gameWon');
        stopTimer();
      } else {
        setRoundIndex((i) => i + 1);
        setStepIndex(0);
        setPhase('roundIntro');
        stopTimer();
      }
      return;
    }
    setStepIndex(next);
  }, [roundIndex, stepIndex, stopTimer]);

  const applyEvalResult = useCallback(
    (
      next: FinSimResources,
      headline: string,
      detail: string,
      good: boolean,
      scoreDelta: number,
    ) => {
      setResources(next);
      bumpDecisionStats(good, scoreDelta);
      const lost = finSimResourcesLose(next);
      setFeedback({ headline, detail, good, lost });
      setPhase('feedback');
      stopTimer();
    },
    [bumpDecisionStats, stopTimer],
  );

  const runAllocationEval = useCallback(
    (alloc: CategoryAllocation) => {
      if (!currentStep || currentStep.kind !== 'allocate') return;
      const pool = currentStep.pool;
      const out = evaluateAllocation(pool, alloc, cloneRes(resources), currentStep.eval);
      applyEvalResult(out.next, out.headline, out.detail, out.good, out.scoreDelta);
    },
    [applyEvalResult, currentStep, resources],
  );

  const submitAllocation = useCallback(() => {
    if (phase !== 'step' || !currentStep || currentStep.kind !== 'allocate') return;
    const pool = currentStep.pool;
    if (sumAllocation(allocationDraft) !== pool) return;
    runAllocationEval(allocationDraft);
  }, [allocationDraft, currentStep, phase, runAllocationEval]);

  const adjustCategory = useCallback(
    (id: keyof CategoryAllocation, delta: number) => {
      if (phase !== 'step' || !currentStep || currentStep.kind !== 'allocate') return;
      const pool = currentStep.pool;
      setAllocationDraft((d: CategoryAllocation) => {
        const next = { ...d };
        const sumOthers = sumAllocation(d) - d[id];
        const cap = Math.max(0, pool - sumOthers);
        next[id] = Math.max(0, Math.min(d[id] + delta, cap));
        return next;
      });
    },
    [currentStep, phase],
  );

  const splitPoolEvenly = useCallback(() => {
    if (phase !== 'step' || !currentStep || currentStep.kind !== 'allocate') return;
    // Animated fill: slowly move dollars into each category so the player sees
    // the distribution and can adjust — more playful than an instant set.
    const target = equalSplit(currentStep.pool);
    // clear any previous animation
    if (splitAnimRef.current) {
      clearInterval(splitAnimRef.current);
      splitAnimRef.current = null;
    }

    setAllocationDraft((prev: CategoryAllocation) => {
      const bucketIds = ['needs', 'debt', 'savings', 'investing', 'wants'] as const;
      const same = bucketIds.every((k) => prev[k] === target[k]);
      if (same) return prev;
      const current: CategoryAllocation = { ...prev };

      splitAnimRef.current = setInterval(() => {
        let done = true;
        for (const id of bucketIds) {
          if (current[id] < target[id]) {
            current[id] += 1;
            done = false;
            break;
          }
          if (current[id] > target[id]) {
            current[id] -= 1;
            done = false;
            break;
          }
        }
        setAllocationDraft({ ...current });
        if (done && splitAnimRef.current) {
          clearInterval(splitAnimRef.current);
          splitAnimRef.current = null;
        }
      }, 80);

      return prev;
    });
  }, [currentStep, phase]);

  // ensure animation timer is cleared when phase or step changes or on unmount
  useEffect(() => {
    return () => {
      if (splitAnimRef.current) {
        clearInterval(splitAnimRef.current);
        splitAnimRef.current = null;
      }
    };
  }, [roundIndex, stepIndex, phase]);

  useEffect(() => {
    if (phase !== 'step' || !currentStep || currentStep.kind !== 'allocate') {
      stopTimer();
      setTimeLeft(0);
      return;
    }
    startDecisionTimer(currentStep.timerSec);
  }, [phase, currentStep, roundIndex, stepIndex, startDecisionTimer, stopTimer]);

  useEffect(() => {
    if (phase !== 'step' || !currentStep || currentStep.kind !== 'allocate') return;
    if (timeLeft !== 0) return;
    if (!timerArmedRef.current) return;
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    const pool = currentStep.pool;
    const fallback = equalSplit(pool);
    setAllocationDraft(fallback);
    runAllocationEval(fallback);
  }, [currentStep, phase, runAllocationEval, timeLeft]);

  const acknowledgeRoundIntro = useCallback(() => {
    setPhase('step');
    setStepIndex(0);
  }, []);

  const continueStep = useCallback(() => {
    if (phase !== 'step' || !currentRound || !currentStep) return;
    if (currentStep.kind === 'narration') {
      advanceLinear();
      return;
    }
    if (currentStep.kind === 'income') {
      advanceLinear();
    }
  }, [advanceLinear, currentRound, currentStep, phase]);

  const dismissFeedback = useCallback(() => {
    if (phase !== 'feedback' || !feedback) return;
    const wasLost = feedback.lost;
    setFeedback(null);
    if (wasLost) {
      setPhase('gameLost');
      stopTimer();
      return;
    }
    const round = FINSIM_SCENARIO[roundIndex];
    if (!round) return;
    const next = stepIndex + 1;
    if (next >= round.steps.length) {
      if (roundIndex + 1 >= FIN_SIM_ROUND_COUNT) {
        setPhase('gameWon');
        stopTimer();
      } else {
        setRoundIndex((i) => i + 1);
        setStepIndex(0);
        setPhase('roundIntro');
        stopTimer();
      }
      return;
    }
    setStepIndex(next);
    setPhase('step');
  }, [feedback, phase, roundIndex, stepIndex, stopTimer]);

  const getRunStats = useCallback((): LevelStats[] => {
    const n = FIN_SIM_ROUND_COUNT;
    const base = Math.floor(Math.max(0, score) / n);
    const rem = Math.max(0, score) - base * n;
    return FINSIM_SCENARIO.map((round: FinSimRound, i: number) => ({
      levelId: round.month,
      score: base + (i === n - 1 ? rem : 0),
      correctCount: i === 0 ? goodDecisions : 0,
      totalCount: i === 0 ? Math.max(1, totalDecisions) : 0,
      bestStreak,
      speedBonus: 0,
      timeTakenMs: 0,
    }));
  }, [bestStreak, goodDecisions, score, totalDecisions]);

  return {
    phase,
    roundIndex,
    stepIndex,
    currentRound,
    currentStep,
    resources,
    allocationDraft,
    score,
    streak,
    bestStreak,
    timeLeft,
    timerMax,
    feedback,
    goodDecisions,
    totalDecisions,
    acknowledgeRoundIntro,
    continueStep,
    adjustCategory,
    splitPoolEvenly,
    submitAllocation,
    dismissFeedback,
    getRunStats,
  };
}
