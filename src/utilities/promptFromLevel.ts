import { LevelData } from '../types';

const LEVEL2_COLUMN_ORDER = ['role', 'context', 'instruction', 'format'] as const;

/** Builds the user message for the Level 2 live response from the canonical prompt pieces. */
export function buildLevel2UserPrompt(level: LevelData): string {
  const segments: string[] = [];
  for (const colId of LEVEL2_COLUMN_ORDER) {
    const block = level.blocks.find((b) => b.correctColumn === colId && !b.isDistractor);
    if (block) segments.push(block.name);
  }
  const [role, context, instruction, format] = segments;
  return [
    'Using the structure below, answer as the Role would, applying Context, Instruction, and Format.',
    '',
    `Role: ${role ?? ''}`,
    `Context: ${context ?? ''}`,
    `Instruction: ${instruction ?? ''}`,
    `Format: ${format ?? ''}`,
    '',
    'Respond now. Keep the answer under 200 words.',
  ].join('\n');
}
