import { type CategoryAllocation, emptyAllocation, sumAllocation } from './gameCategories';

/** Scripted FinSim: 3 monthly allocation rounds. */
export const FIN_SIM_ROUND_COUNT = 3;

export const FIN_SIM_MAX_DEBT = 4500;

export interface FinSimResources {
  savings: number;
  debt: number;
  investing: number;
}

export type FinSimStep =
  | { kind: 'narration'; text: string }
  | { kind: 'income'; label: string; amount: number }
  | {
      kind: 'allocate';
      id: string;
      scenario: string;
      timerSec: number;
      /** Paycheck dollars to split across the 5 categories (must sum exactly). */
      pool: number;
      eval: RoundEvalConfig;
    };

export interface RoundEvalConfig {
  /** Below this in Needs → penalty to debt (late / essentials). */
  needsFloor: number;
  needsPenalty: number;
  /** Minimum debt payment is max(flat, ceil(debt × fraction)). */
  minDebtFlat: number;
  minDebtFractionOfDebt: number;
  /** If payment below minimum, charge this fraction of **pre-payment** debt as interest. */
  interestIfUnderMinDebt: number;
  /** Applied to existing investing balance before adding this month’s Investing allocation. */
  investingCompoundMonthly: number;
}

export interface FinSimRound {
  month: number;
  title: string;
  aiIntro: string;
  steps: FinSimStep[];
}

export function evaluateAllocation(
  pool: number,
  alloc: CategoryAllocation,
  res: FinSimResources,
  cfg: RoundEvalConfig,
): {
  next: FinSimResources;
  headline: string;
  detail: string;
  good: boolean;
  scoreDelta: number;
} {
  const sum = sumAllocation(alloc);
  if (Math.abs(sum - pool) > 0.5) {
    return {
      next: res,
      headline: 'Allocation incomplete',
      detail: `Every dollar must be assigned. You allocated ${sum} of ${pool}.`,
      good: false,
      scoreDelta: -30,
    };
  }

  const startingDebt = res.debt;
  const minDebtPay = Math.max(
    cfg.minDebtFlat,
    Math.ceil(startingDebt * cfg.minDebtFractionOfDebt),
  );
  const needsOk = alloc.needs >= cfg.needsFloor;
  const debtOk = alloc.debt >= minDebtPay;

  let debt = Math.max(0, startingDebt - alloc.debt);
  const lines: string[] = [];

  if (needsOk) {
    lines.push(`Essentials covered (Needs ≥ $${cfg.needsFloor}).`);
  } else {
    debt += cfg.needsPenalty;
    lines.push(
      `Needs underfunded (below $${cfg.needsFloor}) → +$${cfg.needsPenalty} in late/penalty fees (added to debt).`,
    );
  }

  if (!debtOk) {
    const interest = Math.max(1, Math.round(startingDebt * cfg.interestIfUnderMinDebt));
    debt += interest;
    lines.push(
      `Debt payment below minimum (~$${minDebtPay}) → +$${interest} interest on the balance.`,
    );
  } else {
    lines.push(`Debt minimum (~$${minDebtPay}) met — no extra interest this cycle.`);
  }

  const wantsHigh = alloc.wants > pool * 0.42;
  if (wantsHigh) {
    lines.push(
      'Heavy spending on Wants leaves little room for stability — future months get tighter.',
    );
  }

  const invCompound = 1 + cfg.investingCompoundMonthly;
  const investing = Math.round(res.investing * invCompound) + alloc.investing;
  const savings = res.savings + alloc.savings;

  const next: FinSimResources = {
    savings,
    debt,
    investing,
  };

  const good = needsOk && debtOk && !wantsHigh;
  const scoreDelta = good ? 95 : needsOk && debtOk ? 55 : 25;

  const headline = good
    ? 'Solid month — tradeoffs worked'
    : !needsOk || !debtOk
      ? 'Consequences hit your ledger'
      : 'Okay, but Wants crowded the plan';

  const detail = lines.join(' ');

  return { next, headline, detail, good, scoreDelta };
}

export const FINSIM_SCENARIO: FinSimRound[] = [
  {
    month: 1,
    title: 'Baseline budget',
    aiIntro:
      'You get one paycheck this month. Split every dollar across Needs, Debt, Savings, Investing, and Wants — then see what the math does.',
    steps: [
      {
        kind: 'narration',
        text: 'No trivia — just allocation. Essentials fight debt, savings, and “fun” for the same pool.',
      },
      { kind: 'income', label: 'Paycheck (after tax)', amount: 2000 },
      {
        kind: 'allocate',
        id: 'm1',
        scenario:
          'Drag your attention across five columns (use +/−). Assign the full $2,000 — unassigned dollars are not allowed.',
        timerSec: 90,
        pool: 2000,
        eval: {
          needsFloor: 920,
          needsPenalty: 75,
          minDebtFlat: 25,
          minDebtFractionOfDebt: 0.04,
          interestIfUnderMinDebt: 0.045,
          investingCompoundMonthly: 0.004,
        },
      },
    ],
  },
  {
    month: 2,
    title: 'Tighter month',
    aiIntro:
      'Same income — but your debt and expectations don’t stand still. Minimum payments and essentials creep.',
    steps: [
      { kind: 'narration', text: 'Subscriptions, rent rhythm, and the card statement all want their cut.' },
      { kind: 'income', label: 'Paycheck (after tax)', amount: 2000 },
      {
        kind: 'allocate',
        id: 'm2',
        scenario:
          'Allocate all $2,000 again. If Debt gets too little, interest stacks. If Needs slip, fees appear.',
        timerSec: 85,
        pool: 2000,
        eval: {
          needsFloor: 980,
          needsPenalty: 85,
          minDebtFlat: 35,
          minDebtFractionOfDebt: 0.045,
          interestIfUnderMinDebt: 0.05,
          investingCompoundMonthly: 0.004,
        },
      },
    ],
  },
  {
    month: 3,
    title: 'The squeeze',
    aiIntro:
      'Last month of this run. Savings and Investing only pay off if debt and essentials stay honest.',
    steps: [
      { kind: 'narration', text: 'One more paycheck — make the five-way split count.' },
      { kind: 'income', label: 'Paycheck (after tax)', amount: 2150 },
      {
        kind: 'allocate',
        id: 'm3',
        scenario:
          'Allocate the full $2,150 across all five categories. Investing grows slowly; Wants feel good now but do not fix debt.',
        timerSec: 80,
        pool: 2150,
        eval: {
          needsFloor: 1000,
          needsPenalty: 95,
          minDebtFlat: 40,
          minDebtFractionOfDebt: 0.05,
          interestIfUnderMinDebt: 0.055,
          investingCompoundMonthly: 0.005,
        },
      },
    ],
  },
];

export function finSimResourcesLose(r: FinSimResources): boolean {
  return r.debt >= FIN_SIM_MAX_DEBT;
}

export { emptyAllocation, sumAllocation };
export type { CategoryAllocation };
