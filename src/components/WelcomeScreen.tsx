import React from 'react';

interface Props {
  onPlay: () => void;
}

const LEVEL_PREVIEWS = [
  { num: 1, name: 'LLM Pipeline',         desc: 'How does ChatGPT actually work?',  color: '#00e5ff' },
  { num: 2, name: 'Prompt Builder',        desc: 'Build the perfect AI prompt',       color: '#a855f7' },
  { num: 3, name: 'Hallucination Swamp',   desc: 'Real fact — or AI fiction?',        color: '#ef4444' },
];

const BG_COLORS = ['#00e5ff', '#a855f7', '#22c55e', '#f59e0b', '#ec4899'];

export function WelcomeScreen({ onPlay }: Props) {
  return (
    <div className="welcome">
      {/* ── animated falling blocks background ── */}
      <div className="welcome-bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="bg-block"
            style={{
              left: `${(i * 7.2) % 100}%`,
              width:  `${38 + (i % 4) * 14}px`,
              height: `${38 + (i % 4) * 14}px`,
              background: BG_COLORS[i % BG_COLORS.length] + '18',
              border: `1px solid ${BG_COLORS[i % BG_COLORS.length]}30`,
              animationDelay:    `-${(i * 1.7) % 12}s`,
              animationDuration: `${9 + (i % 6) * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="welcome-content">
        {/* hackathon badge */}
        <div className="welcome-badge">
          <span className="badge-pulse" />
          TIME × CHILDHOOD GAMES HACKATHON
        </div>

        {/* title */}
        <div className="welcome-title-group">
          <h1 className="welcome-title">
            <span className="title-prompt">PROMPT</span>
            <span className="title-tetris">TETRIS</span>
          </h1>
          <p className="welcome-tagline">
            Learn AI in <em>minutes</em>, not hours&nbsp;—&nbsp;by playing.
          </p>
        </div>

        {/* feature pills */}
        <div className="welcome-features">
          <div className="feature-pill"><span>⏱</span> Time Pressure</div>
          <div className="feature-pill"><span>🧠</span> AI Concepts</div>
          <div className="feature-pill"><span>🎮</span> Real Gameplay</div>
        </div>

        {/* level cards */}
        <div className="welcome-levels">
          {LEVEL_PREVIEWS.map((lvl) => (
            <div
              key={lvl.num}
              className="level-card"
              style={{ '--accent': lvl.color } as React.CSSProperties}
            >
              <span className="level-card-num">0{lvl.num}</span>
              <div className="level-card-text">
                <div className="level-card-name">{lvl.name}</div>
                <div className="level-card-desc">{lvl.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="play-btn" onClick={onPlay}>
          <span>PLAY NOW</span>
          <span className="play-btn-arrow">→</span>
        </button>

        {/* keyboard legend */}
        <div className="welcome-controls">
          <span><kbd>← →</kbd> move block</span>
          <span><kbd>SPACE</kbd> drop</span>
          <span><kbd>F</kbd> flip</span>
          <span><kbd>H</kbd> hint</span>
          <span>📱 tap to drop</span>
        </div>
      </div>
    </div>
  );
}
