import React from 'react';
import { Link } from 'react-router-dom';

import { LEVELS } from '../data/levels';
import { LevelStats } from '../types';

interface Props {
  stats: LevelStats[];
  totalTimeMs: number;
  onRestart: () => void;
}

export function EndScreen({ stats, totalTimeMs, onRestart }: Props) {
  const totalScore = stats.reduce((s, l) => s + l.score, 0);
  const totalCorrect = stats.reduce((s, l) => s + l.correctCount, 0);
  const totalBlocks = stats.reduce((s, l) => s + l.totalCount, 0);
  const accuracy = totalBlocks > 0 ? Math.round((totalCorrect / totalBlocks) * 100) : 0;
  const bestStreak =
    stats.length > 0 ? Math.max(0, ...stats.map((s) => s.bestStreak)) : 0;
  const totalSpeedBonus = stats.reduce((s, l) => s + l.speedBonus, 0);
  const minutesPlayed = Math.max(1, Math.round(totalTimeMs / 60000));
  const minutesEquivalent = 45;

  return (
    <div className="end-screen game-end-screen">
      {/* background grid reuse */}
      <div className="welcome-bg" aria-hidden="true" />

      <div className="end-card">
        <div className="end-badge">ALL LEVELS COMPLETE</div>
        <h1 className="end-title">You learned AI.</h1>

        {/* TIME theme message */}
        <div className="end-time-message">
          You learned in{' '}
          <strong>
            {minutesPlayed} minute{minutesPlayed !== 1 ? 's' : ''}
          </strong>{' '}
          what usually takes about <strong>{minutesEquivalent} minutes</strong> of
          reading.
        </div>

        <p className="end-impact">
          You now have a clearer picture of how text becomes output, how prompts are
          structured, and why models can sound right while being wrong — useful every time
          you use an AI tool or read a claim about one.
        </p>

        {/* Main stats */}
        <div className="end-stats">
          <div className="end-stat-hero">
            <span className="end-stat-hero-val">{totalScore}</span>
            <span className="end-stat-hero-lbl">TOTAL SCORE</span>
          </div>
          <div className="end-stats-row">
            <div className="end-stat">
              <span className="end-stat-val">{accuracy}%</span>
              <span className="end-stat-lbl">ACCURACY</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">{bestStreak}×</span>
              <span className="end-stat-lbl">BEST STREAK</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">
                {totalCorrect}/{totalBlocks}
              </span>
              <span className="end-stat-lbl">CORRECT</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">+{totalSpeedBonus}</span>
              <span className="end-stat-lbl">SPEED BONUS</span>
            </div>
          </div>
        </div>

        {/* Per-level breakdown */}
        <div className="end-breakdown">
          {stats.map((ls, i) => {
            const lvl = LEVELS[i];
            const acc =
              ls.totalCount > 0 ? Math.round((ls.correctCount / ls.totalCount) * 100) : 0;
            return (
              <div key={i} className="end-level-row">
                <span className="elr-num">0{ls.levelId}</span>
                <span className="elr-name">{lvl?.title ?? `Level ${ls.levelId}`}</span>
                <span className="elr-score">{ls.score} pts</span>
                <span className={`elr-acc ${acc >= 70 ? 'acc-good' : 'acc-bad'}`}>
                  {acc}%
                </span>
              </div>
            );
          })}
        </div>

        {/* What you learned */}
        <div className="end-learnings">
          <div className="end-learnings-title">You now understand:</div>
          {LEVELS.map((lvl) => (
            <div key={lvl.id} className="end-learning-row">
              <span className="learning-check">✓</span>
              <span>{lvl.learningGoal}</span>
            </div>
          ))}
        </div>

        <div className="end-actions">
          <button type="button" className="restart-btn" onClick={onRestart}>
            Play again
          </button>
          <div className="end-secondary-links">
            <Link to="/answers">Answer keys</Link>
            <span className="end-link-dot" aria-hidden="true">
              ·
            </span>
            <Link to="/stats">View stats</Link>
            <span className="end-link-dot" aria-hidden="true">
              ·
            </span>
            <Link to="/">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
