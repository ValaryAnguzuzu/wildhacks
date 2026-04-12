# FinLife

**Money is a skill.** FinLife is a bite-sized financial literacy web app with a Duolingo-style loop: pick a topic, learn a concept, pass a scenario quiz, earn XP, and keep your streak. Progress syncs to Firebase so learners can pick up where they left off on any device.

## What it does

- **Paths** — Categories such as investing, budgeting, taxes, and real estate, organized into worlds and ordered lessons.
- **Lessons** — Short concept copy, a takeaway, then a **scenario quiz** with feedback on each choice.
- **Progress** — XP, streak, hearts, simulated net worth, and per-category progress (lessons completed, worlds unlocked, concepts unlocked).
- **Squads** — Optional learning groups: share an invite code, compare **weekly XP** (ISO week) on a squad leaderboard, and keep pace with friends.
- **Theme** — **Light** and **dark** modes; preference is stored in the browser (`localStorage` via `next-themes`).

Lesson content is loaded from **Firestore** when available (`content/lessons/items`); if the query fails or returns nothing, the app falls back to bundled **`src/content/lessons.json`**.

## Tech stack

| Area          | Choice                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| UI            | React 19, TypeScript, Vite 8                                                           |
| Styling       | Tailwind CSS 4, CSS variables (`src/styles/theme.css`)                                 |
| Routing       | React Router 7                                                                         |
| Server data   | Firebase Authentication + Cloud Firestore                                              |
| Client state  | Zustand (session + hydrated profile/progress), TanStack Query (lessons/sessions, etc.) |
| UI primitives | Radix-based components under `src/app/components/ui/`                                  |

**Node.js 22+** and a current npm are required (`engines` in `package.json`).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment** — Copy `.env.example` to `.env` and add your Firebase web app keys from the Firebase console (Project settings → General → Your apps). Optional variables in `.env.example` (e.g. OpenAI) are only needed if you wire up related experiments; core learning flows use Firebase only.

3. **Firestore rules** — Deploy `firestore.rules` to your Firebase project so users can read/write their own data and use squads/invites as defined in the rules.

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (usually `http://localhost:5173`).

Optional: populate lesson documents with `npm run seed` or `npm run seed:content` if your repo includes the matching scripts and Firebase admin setup.

## Scripts

| Command                 | What it does                  |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Vite dev server               |
| `npm run build`         | `tsc` + production build      |
| `npm run serve`         | Preview the production build  |
| `npm run type-check`    | TypeScript only               |
| `npm run lint`          | Prettier + ESLint             |
| `npm test`              | Vitest (watch)                |
| `npm test -- --run`     | Vitest once                   |
| `npm run test:ui`       | Vitest UI                     |
| `npm run test:coverage` | Coverage report               |
| `npm run seed`          | Seed lessons (see `scripts/`) |
| `npm run seed:content`  | Seed content (see `scripts/`) |

## Tests

Vitest with jsdom; shared setup in `src/test/setup.ts`. Domain logic is covered alongside utilities (e.g. `src/utils/gameLogic.test.ts`).

## Repo layout (high level)

- `src/app/` — Screens, app shell, shared layout/nav.
- `src/components/` — Cross-cutting UI (e.g. theme toggle, celebrations).
- `src/firebase/` — Firebase config, auth helpers, Firestore API, squad helpers.
- `src/content/` — Local lesson JSON and related content.
- `playground/` — Separate small Vite app for experiments (see `playground/README.md`).

## Credits

FinLife is a Wildhacks-style learning product; the toolchain follows common Vite + React + TypeScript patterns. Firebase powers auth and persistence; lesson and squad behavior are implemented in this repository.
