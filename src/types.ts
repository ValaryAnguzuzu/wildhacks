export type GamePhase = 'welcome' | 'playing' | 'gameComplete';
export type BlockPhaseInternal = 'idle' | 'active' | 'dropping' | 'feedback' | 'levelComplete';

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
}

export interface LevelStats {
  levelId: number;
  score: number;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
  timeTakenMs: number;
}
