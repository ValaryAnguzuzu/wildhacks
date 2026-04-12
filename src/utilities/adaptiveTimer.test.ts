import { describe, expect, test } from 'vitest';

import { getAdaptiveTimerSeconds } from './adaptiveTimer';

describe('getAdaptiveTimerSeconds', () => {
  test('returns base when streak is zero', () => {
    expect(getAdaptiveTimerSeconds(12, 0)).toBe(12);
  });

  test('reduces time as streak grows, never below minimum', () => {
    const t5 = getAdaptiveTimerSeconds(12, 5);
    expect(t5).toBeLessThan(12);
    expect(t5).toBeGreaterThanOrEqual(3);
  });
});
