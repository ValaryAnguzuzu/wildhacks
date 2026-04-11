// NOTE: API key is sent from the browser via a Vite dev proxy.
// For production, replace the proxy with a Firebase Function or similar backend.

const FALLBACK_RESPONSE = `Great work! You assembled a well-structured prompt. Here is what an LLM would explain:

**What is a Large Language Model?**

• **The core idea** — An LLM is a neural network trained on billions of text examples to predict the next word (token) in a sequence.

• **How it processes your prompt** — It breaks your text into tokens, reads the full context window, and generates a response one token at a time — each word shaped by everything before it.

• **Why it seems "smart"** — Language encodes human knowledge. By learning patterns in language at massive scale, LLMs absorb implicit knowledge about the world, logic, and reasoning.

• **The key limitation** — LLMs don't "know" anything — they predict. This is why they can be confidently wrong (hallucinate). They optimize for plausibility, not truth.

• **The bottom line** — You are talking to a very sophisticated autocomplete — one trained on almost all human-written text ever published.`;

export async function callClaude(userPrompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

  if (!apiKey) {
    return FALLBACK_RESPONSE;
  }

  try {
    const res = await fetch('/api/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: 'You are a helpful assistant. Be concise and use markdown bullet points.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) return FALLBACK_RESPONSE;

    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? FALLBACK_RESPONSE;
  } catch {
    return FALLBACK_RESPONSE;
  }
}
