/** One-line definitions for concept tags used in lessons. */
export const CONCEPT_DICTIONARY: Record<string, string> = {
  'stock-market-basics':
    'Public markets where you buy small ownership slices of real companies.',
  'risk-and-time-horizon':
    'How much volatility you can tolerate depends on when you need the money.',
  'index-funds': 'Cheap, diversified baskets that track a whole market segment.',
  'dollar-cost-averaging':
    'Investing on a schedule so you buy sometimes high, sometimes low, on average.',
  diversification: 'Spreading money across many assets so one failure does not sink you.',
  'budget-mindset': 'A budget is a plan that reduces money anxiety through clarity.',
  '503020-rule': 'A simple needs / wants / savings split to start balancing cash flow.',
  'emergency-fund': 'Cash buffer for real surprises so you avoid expensive debt.',
  'subscription-audit':
    'Reviewing recurring charges so small fees do not stack silently.',
  'sinking-funds':
    'Saving monthly for predictable big bills so they never feel like crises.',
  'marginal-tax-brackets':
    'Higher rates apply only to dollars inside that bracket, not your whole income.',
  'withholding-basics':
    'Paycheck withholding is an estimate; tax time reconciles the real bill.',
  'credits-vs-deductions':
    'Credits cut tax owed directly; deductions shrink taxable income.',
  'employer-match':
    'Free money tied to your retirement contributions — capture it first.',
  'estimated-taxes':
    'Quarterly payments so self-employed income does not create April shocks.',
  'rent-vs-buy': 'Buying builds equity but costs liquidity; renting buys flexibility.',
  'piti-payment':
    'Principal, interest, taxes, insurance — the core mortgage payment bundle.',
  'home-equity':
    'Value minus mortgage balance; not spendable until you sell or borrow carefully.',
  'reits-basics': 'Stock-like funds that own real estate without you fixing leaks.',
  'closing-costs': 'Fees beyond the down payment due when a home purchase closes.',
};

export function getConceptLine(tag: string): string {
  return CONCEPT_DICTIONARY[tag] ?? 'A money idea you have unlocked on your path.';
}
