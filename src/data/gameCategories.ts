/**
 * MVP: up to 5 categories — structure for strategy, tradeoffs, and clear consequences.
 * Colors tuned for dark UI: distinct hues, strong legibility.
 * @see docs/new-vision-doc.md
 */

export const CATEGORY_IDS = ['needs', 'debt', 'savings', 'investing', 'wants'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface GameCategory {
  id: CategoryId;
  label: string;
  emoji: string;
  hint: string;
  /** Accent for cards & UI (Needs=blue, Debt=red, …) */
  color: string;
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'needs',
    label: 'Needs',
    emoji: '🏠',
    hint: 'Rent, groceries, utilities, insurance',
    color: '#0ea5e9',
  },
  {
    id: 'debt',
    label: 'Debt',
    emoji: '💳',
    hint: 'Credit cards & loans — pay principal',
    color: '#fb7185',
  },
  {
    id: 'savings',
    label: 'Savings',
    emoji: '💰',
    hint: 'Emergency fund — absorbs shocks',
    color: '#34d399',
  },
  {
    id: 'investing',
    label: 'Investing',
    emoji: '📈',
    hint: 'Long-term growth — delayed reward',
    color: '#a78bfa',
  },
  {
    id: 'wants',
    label: 'Wants',
    emoji: '🎉',
    hint: 'Fun & optional — no long-term benefit',
    color: '#fbbf24',
  },
];

export type CategoryAllocation = Record<CategoryId, number>;

export function emptyAllocation(): CategoryAllocation {
  return {
    needs: 0,
    debt: 0,
    savings: 0,
    investing: 0,
    wants: 0,
  };
}

export function sumAllocation(a: CategoryAllocation): number {
  return CATEGORY_IDS.reduce((s, id) => s + a[id], 0);
}
