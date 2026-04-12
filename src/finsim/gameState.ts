export type Category = 'needs' | 'debt' | 'savings' | 'investing' | 'wants';

export type ActionRecord = {
  step: number;
  decision: string;
  amount?: number;
  category: Category;
  result: string;
  impact: {
    balanceChange?: number;
    savingsChange?: number;
    debtChange?: number;
  };
};

export type GameState = {
  round: number;
  balance: number;
  savings: number;
  debt: number;
  history: ActionRecord[];
};

export type Scenario = {
  description: string;
  income: number;
  fixedExpenses: number;
  event: {
    type: 'emergency' | 'temptation' | 'opportunity';
    cost: number;
  };
};
