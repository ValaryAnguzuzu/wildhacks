import type { Scenario } from './gameState';

/** Hardcoded fallbacks used only when GPT scenario generation fails. */
export const FALLBACK_SCENARIOS: [Scenario, Scenario, Scenario] = [
  {
    description:
      'You just got paid. Rent is due, and your mechanic texts about brake work that cannot wait. Decide how to split this paycheck before life charges the rest to a card.',
    income: 2000,
    fixedExpenses: 800,
    event: { type: 'emergency', cost: 400 },
  },
  {
    description:
      'Another month, another deposit. Groceries are locked in, but a shiny new phone deal keeps popping up in your feed. Allocate before temptation wins by default.',
    income: 2200,
    fixedExpenses: 300,
    event: { type: 'temptation', cost: 600 },
  },
  {
    description:
      'Bills are steady and you have a small window to build cushion—or lean into a timed investment offer. Choose where this paycheck lands before the month closes.',
    income: 2500,
    fixedExpenses: 700,
    event: { type: 'opportunity', cost: 500 },
  },
];
