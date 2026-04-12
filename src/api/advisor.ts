import type { FinancialProfileData } from '@/firebase/firestore';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

type ProfileForPrompt = Pick<
  FinancialProfileData,
  | 'checking'
  | 'savings'
  | 'cash'
  | 'creditCardBalance'
  | 'creditCardLimit'
  | 'monthlyIncome'
  | 'monthlyExpenses'
>;

const NUMERIC_PROFILE_KEYS: (keyof ProfileForPrompt)[] = [
  'checking',
  'savings',
  'cash',
  'creditCardBalance',
  'creditCardLimit',
  'monthlyIncome',
  'monthlyExpenses',
];

function buildSystemPrompt(profile: ProfileForPrompt | null): string {
  const hasProfile =
    profile != null && NUMERIC_PROFILE_KEYS.some((k) => Number(profile[k]) > 0);

  const snapshotSection = hasProfile
    ? `
## The user's current financial snapshot
- Checking account: $${(profile!.checking ?? 0).toLocaleString()}
- Savings account: $${(profile!.savings ?? 0).toLocaleString()}
- Cash on hand: $${(profile!.cash ?? 0).toLocaleString()}
- Credit card balance owed: $${(profile!.creditCardBalance ?? 0).toLocaleString()}
- Credit card limit: $${(profile!.creditCardLimit ?? 0).toLocaleString()}
- Monthly take-home income: $${(profile!.monthlyIncome ?? 0).toLocaleString()}
- Monthly expenses: $${(profile!.monthlyExpenses ?? 0).toLocaleString()}
- Available liquidity (checking + savings + cash): $${(
        (profile!.checking ?? 0) +
        (profile!.savings ?? 0) +
        (profile!.cash ?? 0)
      ).toLocaleString()}
- Credit utilization: ${
        profile!.creditCardBalance > 0 && profile!.creditCardLimit > 0
          ? Math.round((profile!.creditCardBalance / profile!.creditCardLimit) * 100) +
            '%'
          : 'unknown'
      }
`
    : `
## Financial snapshot
The user has not yet entered their financial details. If relevant to their question, gently encourage them to update their balances in the app so you can give more personalized advice. Still answer as helpfully as possible with the information they provide in their message.
`;

  return `You are Fin, a sharp and friendly personal financial advisor built into FinLife — a financial literacy app. Your job is to help users make smarter money decisions in real time, before they act.

## Your personality
- Direct and honest. You give real opinions, not wishy-washy hedging.
- Warm but not sycophantic. You care about the user's financial health, not their feelings in the moment.
- You push back when needed. If someone wants to make a bad financial decision, you say so clearly — then explain why.
- You celebrate smart decisions genuinely.
- You translate financial concepts into plain English. No jargon unless you immediately define it.
- You're concise. Maximum 3 short paragraphs unless the question genuinely requires more depth.
- You never tell the user to "consult a financial advisor" — you ARE their financial advisor in this context.

## Your role
Help users decide whether specific purchases or financial moves are wise given their current situation. When evaluating a purchase, always consider:
1. Can they actually afford it without stress? (liquidity check)
2. Do they have an emergency fund? (3-6 months of expenses)
3. Do they have high-interest debt? (credit card debt above 20% APY should usually be paid before discretionary spending)
4. Does this purchase align with good financial habits?
5. Is there a smarter alternative or timing?

## Response format for purchase decisions
When a user asks about a specific purchase, structure your response as:
- One sentence verdict: "Yes, you can afford this" / "No, this isn't the right time" / "Yes, but with a condition"
- 2-3 sentences explaining your reasoning using their specific numbers
- One sentence on what would need to change for this to be a better decision (if saying no), or one sentence of affirmation (if saying yes)

## What you never do
- Never recommend specific stocks, funds by name, or make investment predictions
- Never be preachy or lecture repeatedly about the same point
- Never ignore the user's emotional context — acknowledge it briefly, then give the financial truth
- Never give advice that could cause serious harm if followed — flag uncertainty where it exists

${snapshotSection}

Remember: you know their numbers. Use them. Reference actual figures from their snapshot when relevant — it makes your advice feel real and personal, not generic.`;
}

function extractAssistantText(data: unknown): string {
  const d = data as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const c = d.choices?.[0]?.message?.content;
  return typeof c === 'string' && c.length > 0 ? c : '';
}

/** Safe hints for OpenAI-style error JSON (Groq uses the same shape). */
function chatCompletionFailureHint(
  data: unknown,
  provider: 'groq' | 'openai',
): string | null {
  const d = data as { error?: { code?: string; type?: string; message?: string } };
  const code = d.error?.code;
  const type = d.error?.type;
  const msg = (d.error?.message ?? '').toLowerCase();

  if (code === 'insufficient_quota' || type === 'insufficient_quota') {
    return provider === 'openai'
      ? 'OpenAI is blocking API calls due to quota or billing limits. The API is billed separately from ChatGPT Plus — open platform.openai.com, go to Billing, and check limits / monthly budget.'
      : 'Groq quota was exceeded. Wait a bit or check your limits at console.groq.com.';
  }
  if (code === 'invalid_api_key' || msg.includes('invalid api key')) {
    return provider === 'openai'
      ? 'OpenAI rejected the API key. Confirm VITE_OPENAI_API_KEY in .env.'
      : 'Groq rejected the API key. Confirm VITE_GROQ_API_KEY in .env.';
  }
  if (code === 'rate_limit_exceeded' || msg.includes('rate limit')) {
    return 'Too many requests. Wait a few seconds and try again.';
  }
  return null;
}

/**
 * Fin advisor LLM: prefers Groq (free-tier friendly, OpenAI-compatible) when VITE_GROQ_API_KEY is set; otherwise OpenAI.
 * TODO: Route through a backend in production so API keys are not in the client bundle.
 */
export async function askAdvisor(
  userMessage: string,
  financialProfile: ProfileForPrompt | null,
  conversationHistory: ChatTurn[],
): Promise<string> {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

  const systemPrompt = buildSystemPrompt(financialProfile);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  if (groqKey) {
    const model =
      import.meta.env.VITE_GROQ_ADVISOR_MODEL?.trim() || 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages,
      }),
    });
    const data: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const hint = chatCompletionFailureHint(data, 'groq');
      throw new Error(hint ?? 'The advisor could not respond. Try again in a moment.');
    }
    const text = extractAssistantText(data);
    if (!text) {
      throw new Error('The advisor returned an empty response. Try again.');
    }
    return text;
  }

  if (!openaiKey) {
    throw new Error(
      'Advisor is not configured. Add VITE_GROQ_API_KEY (free tier at console.groq.com) or VITE_OPENAI_API_KEY in .env.',
    );
  }

  const base =
    import.meta.env.VITE_OPENAI_URL?.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
  const model = import.meta.env.VITE_OPENAI_ADVISOR_MODEL?.trim() || 'gpt-4o-mini';

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages,
    }),
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const hint = chatCompletionFailureHint(data, 'openai');
    throw new Error(hint ?? 'The advisor could not respond. Try again in a moment.');
  }

  const text = extractAssistantText(data);
  if (!text) {
    throw new Error('The advisor returned an empty response. Try again.');
  }

  return text;
}
