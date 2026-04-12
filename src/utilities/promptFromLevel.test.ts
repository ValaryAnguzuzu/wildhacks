import { describe, expect, test } from 'vitest';

import { LEVELS } from '../data/levels';
import { buildLevel2UserPrompt } from './promptFromLevel';

describe('buildLevel2UserPrompt', () => {
  test('includes role, context, instruction, and format lines from level data', () => {
    const level2 = LEVELS[1];
    const prompt = buildLevel2UserPrompt(level2);
    expect(prompt).toContain('You are a helpful assistant');
    expect(prompt).toContain('The user is a student');
    expect(prompt).toContain('Explain in simple terms');
    expect(prompt).toContain('Use bullet points');
    expect(prompt).toMatch(/Role:/);
    expect(prompt).toMatch(/Context:/);
    expect(prompt).toMatch(/Instruction:/);
    expect(prompt).toMatch(/Format:/);
  });
});
