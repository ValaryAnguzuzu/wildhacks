export const ADVISOR_LESSON_CONTEXT_KEY = 'finlife_advisor_lesson_context';
export const ADVISOR_LESSON_CONTEXT_MAX_AGE_MS = 5 * 60 * 1000;

export type AdvisorLessonContext = {
  conceptTag: string;
  at: number;
};

export function readAdvisorLessonContext(): AdvisorLessonContext | null {
  try {
    const raw = sessionStorage.getItem(ADVISOR_LESSON_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdvisorLessonContext;
    if (!parsed?.conceptTag || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > ADVISOR_LESSON_CONTEXT_MAX_AGE_MS) {
      sessionStorage.removeItem(ADVISOR_LESSON_CONTEXT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAdvisorLessonContext(conceptTag: string) {
  sessionStorage.setItem(
    ADVISOR_LESSON_CONTEXT_KEY,
    JSON.stringify({ conceptTag, at: Date.now() } satisfies AdvisorLessonContext),
  );
}
