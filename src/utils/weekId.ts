import { getISOWeek, getISOWeekYear } from 'date-fns';

/** ISO week label for weekly squad XP races, e.g. `2026-W15`. */
export function currentWeekId(d = new Date()): string {
  const y = getISOWeekYear(d);
  const w = getISOWeek(d);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
