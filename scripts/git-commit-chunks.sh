#!/usr/bin/env bash
# Chunked commits for PrompTetris — no IDE co-authors; messages are plain -m only.
#
# From a clean replay onto origin/main (drops local commit messages, keeps all files):
#   git fetch origin
#   RESET_TO_ORIGIN=1 bash scripts/git-commit-chunks.sh
#
# If you already committed chunks and only want to continue / fix: run without RESET_TO_ORIGIN
# (script will fail at first empty commit — stop and fix, or reset --mixed manually).

set -euo pipefail
cd "$(dirname "$0")/.."

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository."
  exit 1
fi

if [ "${RESET_TO_ORIGIN:-}" = "1" ]; then
  echo "Fetching origin and resetting mixed to origin/main (working tree keeps current files)..."
  git fetch origin
  git reset --mixed origin/main
fi

# 1 — Tooling
git add package.json package-lock.json vite.config.ts .gitignore index.html
git commit -m "chore: align Vite tooling, lockfile, and HTML shell

- Vite + React + TypeScript; dev proxy and env patterns
- .gitignore for local env and build outputs
- index.html title and meta for PrompTetris"

# 2 — Types & level data
git add src/types.ts src/data/levels.ts \
  src/utilities/adaptiveTimer.ts src/utilities/adaptiveTimer.test.ts
git commit -m "feat: game types, six levels, adaptive timer

- LevelStats with speed bonus; distractor dismiss placement id
- Levels 1–6: pipeline, prompts, hallucination, fine-tuning, RAG, embeddings
- Adaptive timer helper tied to streak difficulty"

# 3 — Services & prompt utilities
git add src/services/statsStorage.ts src/services/claudeApi.ts \
  src/utilities/promptFromLevel.ts src/utilities/promptFromLevel.test.ts \
  src/utilities/gameAudio.ts
git commit -m "feat: session persistence, Claude API, prompts, audio

- localStorage sessions with scores, accuracy, streak, speed bonus totals
- Last-run total score for run comparisons
- Level 2 prompt builder and streaming Claude helper with fallbacks
- Web Audio hooks for game feedback"

# 4 — Game engine
git add src/hooks/useGameEngine.ts
git commit -m "feat: core game engine hook

- Scoring with combo and mega streak multipliers; speed bonus from time left
- Wrong answers: penalty, streak loss, shorter next timer
- Pause and resume; dismiss distractors (lanes vs dismiss path)
- Hint usage; correct/total counts for HUD accuracy"

# 5 — Global & page styles
git add src/index.css src/styles/layout.css src/styles/home-zigzag.css \
  src/styles/game-arena.css src/styles/answer-key.css
git commit -m "style: global, layout, home, arena, and answer-key CSS

- App shell, stats/settings, zigzag marketing home
- Neon game arena: HUD, timer, sidebars, feedback, pause overlay
- Level-complete modal and study page styles; overlay viewport centering"

# 6 — App shell
git add src/context/ThemeContext.tsx src/context/AuthContext.tsx \
  src/routes/RootLayout.tsx \
  src/components/NavBar.tsx src/components/SiteFooter.tsx src/components/HelpPanel.tsx
git commit -m "feat: theme and auth context, layout, navigation chrome

- Root layout with nav, footer, and help panel
- Light/dark theme and local auth stubs for profile and sign-in
- Footer links to play, stats, and answer keys"

# 7 — Game UI components
git add src/components/GameBoard.tsx src/components/EndScreen.tsx \
  src/components/LevelAnswerKey.tsx
git commit -m "feat: GameBoard, EndScreen, LevelAnswerKey

- Game HUD, arena, distractor controls, level-complete portal to document.body
- End-of-run summary with totals and links
- Answer key list for modal reuse and study page"

# 8 — Pages
git add src/pages/HomePage.tsx src/pages/PlayPage.tsx src/pages/StatsPage.tsx \
  src/pages/AnswerKeyPage.tsx src/pages/NotFoundPage.tsx src/pages/SignInPage.tsx \
  src/pages/ProfilePage.tsx src/pages/SettingsPage.tsx
git commit -m "feat: application pages and routes content

- Six-level play session and stats recording
- Answer key page with TOC and per-level anchors
- Home, stats, auth, profile, settings, and not-found pages"

# 9 — App entry, tests, assets, removed legacy
git add src/App.tsx src/main.tsx src/app.test.tsx src/vite-env.d.ts src/test/
[ -d src/favicon ] && git add src/favicon/
git add src/*.svg 2>/dev/null || true
git add -u src/
git commit -m "feat: App router, entrypoint, tests; drop legacy welcome screen

- Routes for home, play, stats, answers, sign-in, profile, settings
- main.tsx stylesheet imports
- Vitest smoke tests for home and play HUD
- Remove App.css and WelcomeScreen in favor of routed UI"

# Optional: scripts folder itself (this file), without large binaries
if [ -f scripts/git-commit-chunks.sh ]; then
  git add scripts/git-commit-chunks.sh
  git commit -m "chore: add helper script for chunked git history" || true
fi

# Anything left (e.g. local-only docs)
if [ -n "$(git status --porcelain)" ]; then
  echo "Remaining (uncommitted):"
  git status -s
else
  echo "Working tree clean."
fi

echo "Recent commits:"
git log --oneline -14
