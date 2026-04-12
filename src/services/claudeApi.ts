// Dev: Vite proxies /api → Anthropic. Production: use a serverless proxy — never ship API keys to browsers.

const FALLBACK_RESPONSE = `Great work! You assembled a well-structured prompt. Here is what an LLM would explain:

**What is a Large Language Model?**

• **The core idea** — An LLM is a neural network trained on billions of text examples to predict the next word (token) in a sequence.

• **How it processes your prompt** — It breaks your text into tokens, reads the full context window, and generates a response one token at a time — each word shaped by everything before it.

• **Why it seems "smart"** — Language encodes human knowledge. By learning patterns in language at massive scale, LLMs absorb implicit knowledge about the world, logic, and reasoning.

• **The key limitation** — LLMs don't "know" anything — they predict. This is why they can be confidently wrong (hallucinate). They optimize for plausibility, not truth.

• **The bottom line** — You are talking to a very sophisticated autocomplete — one trained on almost all human-written text ever published.`;

function extractDeltaText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const o = data as Record<string, unknown>;
  if (o.type !== 'content_block_delta' || !o.delta || typeof o.delta !== 'object')
    return '';
  const d = o.delta as Record<string, unknown>;
  if (d.type === 'text_delta' && typeof d.text === 'string') return d.text;
  return '';
}

async function readAnthropicStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (s: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const raw = trimmed.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const data = JSON.parse(raw) as unknown;
        const piece = extractDeltaText(data);
        if (piece) {
          full += piece;
          onChunk(piece);
        }
      } catch {
        /* ignore malformed SSE JSON */
      }
    }
  }
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data:')) {
      const raw = trimmed.slice(5).trim();
      if (raw && raw !== '[DONE]') {
        try {
          const data = JSON.parse(raw) as unknown;
          const piece = extractDeltaText(data);
          if (piece) {
            full += piece;
            onChunk(piece);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }
  return full;
}

/** Typewriter-style fallback so demos look great even without an API key or network. */
async function streamFallback(onChunk: (s: string) => void): Promise<string> {
  const text = FALLBACK_RESPONSE;
  for (const ch of text) {
    onChunk(ch);
    await new Promise((r) => setTimeout(r, 4));
  }
  return text;
}

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

/**
 * Streams Claude output (SSE). Falls back to a local typewriter effect if no key,
 * HTTP error, or non-streaming response — demo always looks polished.
 */
export async function streamClaude(
  userPrompt: string,
  onChunk: (s: string) => void,
): Promise<string> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

  if (!apiKey) {
    return streamFallback(onChunk);
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
        stream: true,
        system: 'You are a helpful assistant. Be concise and use markdown bullet points.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok || !res.body) {
      return streamFallback(onChunk);
    }

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/event-stream')) {
      const text = await res.text();
      try {
        const data = JSON.parse(text) as { content?: Array<{ text?: string }> };
        const t = data.content?.[0]?.text ?? FALLBACK_RESPONSE;
        for (const ch of t) {
          onChunk(ch);
          await new Promise((r) => setTimeout(r, 2));
        }
        return t;
      } catch {
        return streamFallback(onChunk);
      }
    }

    const streamed = await readAnthropicStream(res.body, onChunk);
    if (!streamed.trim()) {
      return streamFallback(onChunk);
    }
    return streamed;
  } catch {
    return streamFallback(onChunk);
  }
}
