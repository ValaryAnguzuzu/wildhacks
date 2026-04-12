# PrompTetris

**Learn how LLMs work by playing.** A Wildhacks project that turns core AI literacy into a fast, Tetris-inspired game. Concepts fall as blocks; you sort them into the right columns before the timer runs out. Every placement includes teaching feedback—no silent failures.

## What it is

PrompTetris is a short game loop for **active** learning: you rehearse how real LLM systems are put together—pipelines, prompts, failure modes, fine-tuning, retrieval, and embeddings—while the app explains why each placement is correct or not. The aim is a mental model you can reuse when you read docs, write prompts, or debug behavior.

## How to play

1. **Blocks fall** — Each block is an AI concept tied to a real pipeline or workflow, not trivia.
2. **Sort quickly** — Move left or right, flip for definitions, and drop into the right column before time runs out.
3. **Read the feedback** — Right and wrong answers both come with a short explanation.
4. **Review** — Session stats and an answer key help you recap what stuck.

## Levels

| # | Theme | Focus |
|---|--------|--------|
| 1 | LLM Pipeline | Input → tokenizer → context → model → output |
| 2 | Prompt Builder | Role, context, instruction, format |
| 3 | Hallucination Swamp | True vs confidently wrong statements |
| 4 | Fine-tuning | Pre-training, task data, adapters, evaluation |
| 5 | RAG | Ingest → chunk → embed → retrieve → augment |
| 6 | Embeddings | Vectors, similarity, semantics, limits |

## Features

- Local stats across runs  
- Answer key in-game and at `/answers`  
- Pause and exit  
- Distractor blocks you dismiss when they belong nowhere  
- Timer that can speed up when you are on a streak  

## Tech

React, TypeScript, Vite, and React Router. ESLint and Prettier for lint/format; Vitest and React Testing Library for tests. Use Node.js 22+ and npm 10+.

The Prompt Builder level can show a streamed model reply in local development when the dev server is set up to call the model API; otherwise the app uses a built-in sample response so the level still works.

## Setup

```bash
npm install
npm run dev
```

Then open the URL the dev server prints (often `http://localhost:5173`).

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run serve` | Preview the production build |
| `npm run type-check` | TypeScript only |
| `npm run lint` | Format + lint |
| `npm test` | Tests (watch) |
| `npm test -- --run` | Tests once |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Coverage |

## Tests

Vitest with jsdom; shared setup in `src/test/setup.ts`. Example tests live next to source (e.g. `src/app.test.tsx`).

## Credits

Game design, levels, and UI are original to this project. The repo started from a standard Vite + React + TypeScript toolchain similar to common open-source starters.
