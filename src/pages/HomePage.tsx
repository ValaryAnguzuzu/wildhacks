import React from 'react';
import { Link } from 'react-router-dom';

import { loadSessions } from '../services/statsStorage';

const LEVEL_PREVIEWS = [
  {
    num: 1,
    name: 'LLM Pipeline',
    desc: 'Order the stages from user text to model output — the real ChatGPT path.',
    color: '#00e5ff',
  },
  {
    num: 2,
    name: 'Prompt Builder',
    desc: 'Slot role, context, instruction, and format — then see a live answer to the prompt you built.',
    color: '#a855f7',
  },
  {
    num: 3,
    name: 'Hallucination Swamp',
    desc: 'Train your gut to spot confident nonsense. True vs fake under pressure.',
    color: '#ef4444',
  },
];

const BG_COLORS = ['#00e5ff', '#a855f7', '#22c55e', '#f59e0b', '#ec4899'];

const STEPS = [
  {
    title: 'Blocks fall',
    body: 'Each block is an AI concept — not trivia, but something you place in a real system.',
    emoji: '🧱',
  },
  {
    title: 'You sort fast',
    body: 'Move left/right, flip for definitions, drop in the right column before the timer hits zero.',
    emoji: '⚡',
  },
  {
    title: 'Feedback teaches',
    body: 'Every placement explains why it was right or wrong — no silent failures.',
    emoji: '💬',
  },
  {
    title: 'Stay in flow',
    body: 'When you’re on a roll, rounds get a little faster — finish all three levels to lock in the mental model.',
    emoji: '🔥',
  },
];

/** Pure CSS “illustrations” — no image files, kid-friendly shapes */
function VisualHeroPlay() {
  return (
    <div className="kid-art kid-art--hero">
      <div className="kid-art__cloud" />
      <div className="kid-art__stack">
        <span className="kid-block kid-block--a" />
        <span className="kid-block kid-block--b" />
        <span className="kid-block kid-block--c" />
      </div>
      <span className="kid-art__spark kid-art__spark--1" aria-hidden="true">
        ✨
      </span>
      <span className="kid-art__spark kid-art__spark--2" aria-hidden="true">
        ✨
      </span>
    </div>
  );
}

function VisualProblem() {
  return (
    <div className="kid-art kid-art--problem">
      <div className="kid-art__book-stack">
        <span className="kid-book" />
        <span className="kid-book kid-book--2" />
        <span className="kid-book kid-book--3" />
      </div>
      <span className="kid-art__emoji" aria-hidden="true">
        😴
      </span>
    </div>
  );
}

function VisualTwist() {
  return (
    <div className="kid-art kid-art--twist">
      <div className="kid-art__grid-mini">
        {['#00e5ff', '#a855f7', '#22c55e', '#f59e0b'].map((c) => (
          <span key={c} className="kid-mini-cell" style={{ background: c }} />
        ))}
      </div>
      <span className="kid-art__emoji kid-art__emoji--big" aria-hidden="true">
        🎮
      </span>
    </div>
  );
}

function VisualPayoff() {
  return (
    <div className="kid-art kid-art--payoff">
      <div className="kid-art__brain-ring" />
      <span className="kid-art__emoji" aria-hidden="true">
        🧠
      </span>
      <span className="kid-art__star" aria-hidden="true">
        ⭐
      </span>
    </div>
  );
}

function VisualStep({ emoji }: { emoji: string }) {
  return (
    <div className="kid-art kid-art--step">
      <span className="kid-step-emoji" aria-hidden="true">
        {emoji}
      </span>
      <div className="kid-art__dots" />
    </div>
  );
}

function VisualLevel({ color, num }: { color: string; num: number }) {
  return (
    <div
      className="kid-art kid-art--level"
      style={{ '--lvl': color } as React.CSSProperties}
    >
      <div className="kid-level-badge">{String(num).padStart(2, '0')}</div>
      <div className="kid-level-bars">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function VisualControls() {
  return (
    <div className="kid-art kid-art--keys kid-art--keys--home" aria-hidden="true">
      <span className="kid-key-pill">← →</span>
      <span className="kid-key-pill kid-key-pill--wide">enter</span>
      <span className="kid-key-pill">↓</span>
      <span className="kid-key-pill kid-key-pill--wide">space</span>
      <span className="kid-key-pill">esc</span>
      <span className="kid-key-pill">F</span>
      <span className="kid-key-pill">H</span>
    </div>
  );
}

export function HomePage() {
  const lastRun = loadSessions()[0];

  return (
    <div className="home home-zigzag">
      <div className="home-bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="home-bg-block"
            style={{
              left: `${(i * 7.2) % 100}%`,
              width: `${38 + (i % 4) * 14}px`,
              height: `${38 + (i % 4) * 14}px`,
              background: BG_COLORS[i % BG_COLORS.length] + '14',
              border: `1px solid ${BG_COLORS[i % BG_COLORS.length]}22`,
              animationDelay: `-${(i * 1.7) % 12}s`,
              animationDuration: `${9 + (i % 6) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Hero — text | art */}
      <section className="home-hero home-hero-zig section-y">
        <div className="page-wrap zigzag-inner">
          <div className="zigzag-copy">
            <p className="home-eyebrow">Learn how language models work — by playing</p>
            <h1 className="home-title">
              <span className="title-promp">Promp</span>
              <span className="title-tetris">Tetris</span>
            </h1>
            <p className="home-lead">
              A fast, tactile way to understand LLMs — pipeline, prompts, and
              hallucinations — without reading a manual. For curious kids, students,
              teachers, and anyone who chats with AI.
            </p>
            <div className="home-hero-cta">
              <Link to="/play" className="btn-primary-lg">
                Start game
              </Link>
              <Link to="/stats" className="btn-secondary-lg">
                View stats
              </Link>
            </div>
            <p className="home-micro">
              No account required · Optional sign-in keeps your name on this device
            </p>
            <p className="home-hero-controls-jump">
              <a href="#controls" className="home-hero-controls-jump__link">
                Keyboard & touch controls
              </a>
              <span className="home-hero-controls-jump__hint" aria-hidden="true">
                {' '}
                · Enter/↓ drop · Space or Esc pause
              </span>
            </p>
            {lastRun ? (
              <aside className="home-last-run" aria-label="Your last completed run">
                <div className="home-last-run-top">
                  <span className="home-last-run-label">Last run</span>
                  <Link to="/stats" className="home-last-run-link">
                    History →
                  </Link>
                </div>
                <div className="home-last-run-body">
                  <span className="home-last-run-score">{lastRun.totalScore} pts</span>
                  <span className="home-last-run-meta">
                    {lastRun.accuracyPct}% accuracy · {lastRun.bestStreak}× best streak
                  </span>
                </div>
              </aside>
            ) : null}
          </div>
          <div className="zigzag-visual">
            <VisualHeroPlay />
          </div>
        </div>
      </section>

      <section
        className="zigzag-band zigzag-band--controls home-controls-band"
        id="controls"
        aria-labelledby="controls-heading"
      >
        <div className="page-wrap zigzag-inner zigzag-inner--flip">
          <div className="zigzag-copy">
            <h2 className="zigzag-h3" id="controls-heading">
              Controls
            </h2>
            <p className="zigzag-p">
              Keyboard or touch — pick what feels good. Tap a column to place; tap the
              block to read the back.
            </p>
            <ul className="zigzag-control-list">
              <li>
                <span className="kbd">← →</span> move
              </li>
              <li>
                <span className="kbd">Enter</span> <span className="kbd">↓</span> drop
              </li>
              <li>
                <span className="kbd">Space</span> pause <span className="zigzag-control-note">(Esc too)</span>
              </li>
              <li>
                <span className="kbd">F</span> flip
              </li>
              <li>
                <span className="kbd">H</span> hint
              </li>
            </ul>
          </div>
          <div className="zigzag-visual">
            <VisualControls />
          </div>
        </div>
      </section>

      <div className="zigzag-section-title page-wrap">
        <h2 className="zigzag-h2">Why PrompTetris?</h2>
        <p className="zigzag-lead">
          Three big ideas — flip-flopping down the page like a storybook.
        </p>
      </div>

      {/* Problem — text | art */}
      <section className="zigzag-band zigzag-band--soft" aria-labelledby="zig-problem">
        <div className="page-wrap zigzag-inner">
          <div className="zigzag-copy">
            <p className="zigzag-kicker" id="zig-problem">
              The problem
            </p>
            <h3 className="zigzag-h3">Reading about AI can feel endless</h3>
            <p className="zigzag-p">
              Long docs and videos are easy to skim — but hard to remember. Lots of people
              never get to the moment where it really clicks.
            </p>
          </div>
          <div className="zigzag-visual">
            <VisualProblem />
          </div>
        </div>
      </section>

      {/* Twist — art | text */}
      <section className="zigzag-band" aria-labelledby="zig-twist">
        <div className="page-wrap zigzag-inner zigzag-inner--flip">
          <div className="zigzag-copy">
            <p className="zigzag-kicker" id="zig-twist">
              Our twist
            </p>
            <h3 className="zigzag-h3">Play first, learn while you move</h3>
            <p className="zigzag-p">
              It’s Tetris-style: blocks drop, you sort them into the right slots. Each
              block is a real idea — like tokenizer or context window — with instant
              explanations when you place them.
            </p>
          </div>
          <div className="zigzag-visual">
            <VisualTwist />
          </div>
        </div>
      </section>

      {/* Payoff — text | art */}
      <section className="zigzag-band zigzag-band--soft2" aria-labelledby="zig-payoff">
        <div className="page-wrap zigzag-inner">
          <div className="zigzag-copy">
            <p className="zigzag-kicker" id="zig-payoff">
              The payoff
            </p>
            <h3 className="zigzag-h3">A mental map you keep</h3>
            <p className="zigzag-p">
              In a few minutes you walk away knowing how pieces fit together — handy every
              time you open ChatGPT or wonder if something an AI said is actually true.
            </p>
          </div>
          <div className="zigzag-visual">
            <VisualPayoff />
          </div>
        </div>
      </section>

      <div className="zigzag-section-title page-wrap">
        <h2 className="zigzag-h2" id="how-heading">
          How it works
        </h2>
        <p className="zigzag-lead">
          Four quick beats — text on one side, a friendly picture on the other.
        </p>
      </div>

      {STEPS.map((s, i) => (
        <section
          key={s.title}
          className={`zigzag-band ${i % 2 === 1 ? 'zigzag-band--soft' : ''}`}
          aria-labelledby={`step-${i}`}
        >
          <div
            className={`page-wrap zigzag-inner ${i % 2 === 1 ? 'zigzag-inner--flip' : ''}`}
          >
            <div className="zigzag-copy">
              <p className="zigzag-kicker" id={`step-${i}`}>
                Step {i + 1}
              </p>
              <h3 className="zigzag-h3">{s.title}</h3>
              <p className="zigzag-p">{s.body}</p>
            </div>
            <div className="zigzag-visual">
              <VisualStep emoji={s.emoji} />
            </div>
          </div>
        </section>
      ))}

      <div className="zigzag-section-title page-wrap">
        <h2 className="zigzag-h2" id="levels-heading">
          Three levels — one adventure
        </h2>
        <p className="zigzag-lead">
          Each stop is a few minutes of play. The pictures match the vibe of the level.
        </p>
      </div>

      {LEVEL_PREVIEWS.map((lvl, i) => (
        <section
          key={lvl.num}
          className={`zigzag-band ${i % 2 === 1 ? 'zigzag-band--soft2' : 'zigzag-band--soft'}`}
          aria-labelledby={`lvl-${lvl.num}`}
        >
          <div
            className={`page-wrap zigzag-inner ${i % 2 === 1 ? 'zigzag-inner--flip' : ''}`}
          >
            <div className="zigzag-copy">
              <p
                className="zigzag-kicker"
                id={`lvl-${lvl.num}`}
                style={{ color: lvl.color }}
              >
                Level 0{lvl.num}
              </p>
              <h3 className="zigzag-h3">{lvl.name}</h3>
              <p className="zigzag-p">{lvl.desc}</p>
            </div>
            <div className="zigzag-visual">
              <VisualLevel color={lvl.color} num={lvl.num} />
            </div>
          </div>
        </section>
      ))}

      <section className="section-y home-final-cta">
        <div className="page-wrap center">
          <div className="kid-cta-burst" aria-hidden="true">
            <span>🎯</span>
            <span>🚀</span>
            <span>✨</span>
          </div>
          <h2 className="final-cta-title">Ready to play?</h2>
          <p className="final-cta-sub">
            Your first run is short, sweet, and packed with “aha” moments.
          </p>
          <Link to="/play" className="btn-primary-lg">
            Start game
          </Link>
        </div>
      </section>
    </div>
  );
}
