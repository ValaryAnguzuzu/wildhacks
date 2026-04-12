export type LessonChoice = { id: string; text: string };

export type LessonScenario = {
  situation: string;
  choices: LessonChoice[];
  correct: string;
  feedback: Record<string, string>;
  lesson: string;
  conceptTag: string;
};

export type Lesson = {
  id: string;
  lessonId: string;
  categoryId: string;
  world: number;
  order: number;
  title: string;
  concept: string;
  takeaway: string;
  scenario: LessonScenario;
};

export type CategoryProgress = {
  worldsUnlocked: number;
  lessonsComplete: string[];
  conceptsUnlocked: string[];
  xpEarned: number;
  perfectLessons: string[];
};

export type FinLifeUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  xp: number;
  streak: number;
  hearts: number;
  lastPlayed: import('firebase/firestore').Timestamp | null;
  netWorth: number;
  skillLevel: string | null;
  activeCategory: string | null;
  streakFreezes: number;
  createdAt?: import('firebase/firestore').Timestamp;
};
