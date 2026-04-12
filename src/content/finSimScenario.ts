import type { CategoryAllocation } from '@/utils/gameLogic';

export type FinSimResources = {
  savings: number;
  debt: number;
  investing: number;
};

export type FinSimAllocEvalRule = {
  minNeedsPct?: number;
  minSavingsPct?: number;
  goodBonus?: number;
  badPenalty?: number;
};

export type FinSimStep =
  | { kind: 'narration'; text: string }
  | { kind: 'income'; amount: number }
  | {
      kind: 'allocate';
      pool: number;
      timerSec: number;
      eval: FinSimAllocEvalRule;
    };

export type FinSimRound = {
  month: string;
  title: string;
  steps: FinSimStep[];
};

/** Lose when savings collapse or debt is overwhelming. */
export function finSimResourcesLose(r: FinSimResources): boolean {
  return r.savings < 0 || r.debt > 15_000;
}

export function evaluateAllocation(
  pool: number,
  alloc: CategoryAllocation,
  res: FinSimResources,
  rule: FinSimAllocEvalRule,
): {
  next: FinSimResources;
  headline: string;
  detail: string;
  good: boolean;
  scoreDelta: number;
} {
  const minN = rule.minNeedsPct ?? 35;
  const minS = rule.minSavingsPct ?? 10;
  const needsPct = pool > 0 ? (alloc.needs / pool) * 100 : 0;
  const savingsPct = pool > 0 ? (alloc.savings / pool) * 100 : 0;
  const good = needsPct >= minN && savingsPct >= minS;
  const scoreDelta = good ? (rule.goodBonus ?? 10) : (rule.badPenalty ?? -5);

  const next: FinSimResources = {
    savings: Math.round(res.savings + alloc.savings * 0.6 + (good ? 20 : -10)),
    debt: Math.max(0, Math.round(res.debt - alloc.debt * 0.25 + (good ? 0 : 15))),
    investing: Math.round(res.investing + alloc.investing * 0.15 + alloc.wants * 0.05),
  };

  return {
    next,
    headline: good ? 'Solid split' : 'Room to improve',
    detail: good
      ? 'You covered essentials and still saved — that compounds.'
      : 'Try giving needs and savings a bit more of the pool next time.',
    good,
    scoreDelta,
  };
}

/** Minimal playable scenario for FinSim (monthly allocate loop). */
export const FINSIM_SCENARIO: FinSimRound[] = [
  {
    month: 'Month 1',
    title: 'First paycheck',
    steps: [
      {
        kind: 'narration',
        text: 'You just got paid. Split this pool across needs, debt, savings, investing, and wants.',
      },
      {
        kind: 'allocate',
        pool: 100,
        timerSec: 45,
        eval: { minNeedsPct: 40, minSavingsPct: 10, goodBonus: 15, badPenalty: -5 },
      },
    ],
  },
  {
    month: 'Month 2',
    title: 'Tighter month',
    steps: [
      {
        kind: 'allocate',
        pool: 80,
        timerSec: 40,
        eval: { minNeedsPct: 35, minSavingsPct: 12, goodBonus: 20, badPenalty: -8 },
      },
    ],
  },
];

export const FIN_SIM_ROUND_COUNT = FINSIM_SCENARIO.length;
