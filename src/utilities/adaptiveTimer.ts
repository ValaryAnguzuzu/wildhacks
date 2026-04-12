/**
 * Streak-based adaptive difficulty: successful placements shorten the next block's timer
 * (capped) so the skill ceiling rises with the player — classic flow-state game design.
 */
export function getAdaptiveTimerSeconds(
  baseSeconds: number,
  streakAfterLastCorrect: number,
): number {
  const minSeconds = Math.max(2, Math.floor(baseSeconds * 0.28));
  const maxTrim = Math.max(0, baseSeconds - minSeconds);
  const trim = Math.min(maxTrim, Math.floor(streakAfterLastCorrect * 0.85));
  return Math.max(minSeconds, baseSeconds - trim);
}
