import { FALLBACK_SCENARIOS } from './scenarios';
import type { Scenario } from './gameState';

const INCOME_BY_LEVEL = [2000, 2200, 2500];
const FIXED_EXPENSES_BY_LEVEL = [800, 300, 700];
const EVENT_COST_BY_LEVEL = [400, 600, 500];
const EVENT_TYPE_BY_LEVEL: Scenario['event']['type'][] = [
  'emergency',
  'temptation',
  'opportunity',
];

function openAiUrl(): string {
  // Dev: use Vite proxy to avoid CORS (see vite.config.ts). Prod: set VITE_OPENAI_URL or full API URL behind your own proxy.
  if (import.meta.env.DEV) {
    return '/openai/v1/chat/completions';
  }
  return `${import.meta.env.VITE_OPENAI_URL ?? 'https://api.openai.com'}/v1/chat/completions`;
}

/**
 * GPT supplies narrative text only. Income, fixed expenses, and event cost/type are deterministic by level.
 */
export async function generateScenario(level: number): Promise<Scenario> {
  const idx = Math.min(Math.max(0, level), 2);
  const base: Scenario = {
    income: INCOME_BY_LEVEL[idx],
    fixedExpenses: FIXED_EXPENSES_BY_LEVEL[idx],
    event: {
      type: EVENT_TYPE_BY_LEVEL[idx],
      cost: EVENT_COST_BY_LEVEL[idx],
    },
    description: '',
  };

  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key || String(key).trim() === '') {
    console.warn('VITE_OPENAI_API_KEY missing — using fallback scenario copy.');
    return FALLBACK_SCENARIOS[idx];
  }

  try {
    const response = await fetch(openAiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: `You generate short financial scenario descriptions for a budgeting game. 
Return ONLY a JSON object with one field: { "description": "..." }.
The description should be 2–3 sentences, written in second person, realistic, and reflect the event type.
Do not include numbers — those are provided separately. Do not add any explanation outside the JSON.`,
          },
          {
            role: 'user',
            content: `Round ${level + 1}. Income: $${base.income}. Fixed expenses: $${base.fixedExpenses}. Event type: ${base.event.type}. Event cost: $${base.event.cost}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { description?: string };
    if (!parsed.description || typeof parsed.description !== 'string') {
      throw new Error('Invalid GPT payload');
    }

    return { ...base, description: parsed.description };
  } catch (err) {
    console.warn('GPT scenario generation failed, using fallback.', err);
    return FALLBACK_SCENARIOS[idx];
  }
}
