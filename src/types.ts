export type GamePhase = 'welcome' | 'playing' | 'gameComplete';
export type BlockPhaseInternal =
  | 'idle'
  | 'levelIntro'
  | 'countdown'
  | 'active'
  | 'dropping'
  | 'feedback'
  | 'levelComplete';

export interface BlockData {
  id: string;
  name: string;
  description: string;
  correctColumn: string;
  color: string;
  isDistractor?: boolean;
}

export interface ColumnData {
  id: string;
  label: string;
  hint: string;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  learningGoal: string;
  columns: ColumnData[];
  blocks: BlockData[];
  timerSeconds: number;
  hasApiCall?: boolean;
}

/** Placed blocks that were dismissed (distractors) use this instead of a column id. */
export const DISMISS_PLACEMENT_ID = '__dismiss__';

/** Passed / skipped as “I don’t know” (counts as incorrect). */
export const PASS_PLACEMENT_ID = '__pass__';

export interface PlacedBlock {
  block: BlockData;
  columnId: string;
  correct: boolean;
  feedbackMsg: string;
}

export interface FeedbackData {
  correct: boolean;
  headline: string;
  detail: string;
  /** Seconds removed from the next block's timer after a mistake. */
  lostTimeSec?: number;
}

export interface LevelStats {
  levelId: number;
  score: number;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
  /** Sum of speed bonuses earned this level (fast answers). */
  speedBonus: number;
  timeTakenMs: number;
}
