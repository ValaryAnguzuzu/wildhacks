import React from 'react';
import { Link } from 'react-router-dom';

import type { FinSimResources } from '../data/finSimScenario';
import { LevelStats } from '../types';

interface Props {
  stats: LevelStats[];
  totalTimeMs: number;
  onRestart: () => void;
  onRestartRun?: () => void;
  finSimWon?: boolean;
  finSimResources?: FinSimResources | null;
}

function formatMoney(n: number): string {
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

export function EndScreen({
  stats,
  totalTimeMs,
  onRestart,
  onRestartRun,
  finSimWon,
  finSimResources,
}: Props) {
  const totalScore = stats.reduce((s, l) => s + l.score, 0);
  const totalCorrect = stats.reduce((s, l) => s + l.correctCount, 0);
  const totalBlocks = stats.reduce((s, l) => s + l.totalCount, 0);
  const accuracy = totalBlocks > 0 ? Math.round((totalCorrect / totalBlocks) * 100) : 0;
  const bestStreak =
    stats.length > 0 ? Math.max(0, ...stats.map((s) => s.bestStreak)) : 0;
  const totalSpeedBonus = stats.reduce((s, l) => s + l.speedBonus, 0);
  const minutesPlayed = Math.max(1, Math.round(totalTimeMs / 60000));

  const won = finSimWon === true;
  const lost = finSimWon === false;

  return (
    <div className="end-screen game-end-screen">
      <div className="welcome-bg" aria-hidden="true" />

      <div className="end-card">
        <div className="end-badge">
          {won ? 'RUN COMPLETE' : lost ? 'RUN ENDED' : 'RUN COMPLETE'}
        </div>
        <h1 className="end-title">
          {won
            ? 'You finished three allocation months.'
            : lost
              ? 'Debt crossed the limit.'
              : 'Run finished.'}
        </h1>

        <div className="end-time-message">
          Play time:{' '}
          <strong>
            {minutesPlayed} minute{minutesPlayed !== 1 ? 's' : ''}
          </strong>{' '}
          — strategy, not memorization.
        </div>

        <p className="end-impact">
          {won
            ? 'You practiced splitting real dollars across Needs, Debt, Savings, Investing, and Wants — the tradeoffs show up in the score.'
            : 'Try again: raise Needs and Debt payments before Wants eat the plan.'}
        </p>

        {finSimResources ? (
          <div className="end-stats" style={{ marginBottom: '1rem' }}>
            <div className="end-stats-row">
              <div className="end-stat">
                <span className="end-stat-val">{formatMoney(finSimResources.savings)}</span>
                <span className="end-stat-lbl">SAVINGS</span>
              </div>
              <div className="end-stat">
                <span className="end-stat-val">{formatMoney(finSimResources.debt)}</span>
                <span className="end-stat-lbl">DEBT</span>
              </div>
              <div className="end-stat">
                <span className="end-stat-val">{formatMoney(finSimResources.investing)}</span>
                <span className="end-stat-lbl">INVESTING</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="end-stats">
          <div className="end-stat-hero">
            <span className="end-stat-hero-val">{totalScore}</span>
            <span className="end-stat-hero-lbl">TOTAL SCORE</span>
          </div>
          <div className="end-stats-row">
            <div className="end-stat">
              <span className="end-stat-val">{accuracy}%</span>
              <span className="end-stat-lbl">DECISION QUALITY</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">{bestStreak}×</span>
              <span className="end-stat-lbl">BEST STREAK</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">
                {totalCorrect}/{totalBlocks}
              </span>
              <span className="end-stat-lbl">STRONG MONTHS</span>
            </div>
            <div className="end-stat">
              <span className="end-stat-val">+{totalSpeedBonus}</span>
              <span className="end-stat-lbl">SPEED BONUS</span>
            </div>
          </div>
        </div>

        <div className="end-breakdown">
          {stats.map((ls, i) => {
            const acc =
              ls.totalCount > 0 ? Math.round((ls.correctCount / ls.totalCount) * 100) : 0;
            return (
              <div key={i} className="end-level-row">
                <span className="elr-num">M{ls.levelId}</span>
                <span className="elr-name">Month {ls.levelId}</span>
                <span className="elr-score">{ls.score} pts</span>
                <span className={`elr-acc ${acc >= 70 ? 'acc-good' : 'acc-bad'}`}>
                  {acc}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="end-learnings">
          <div className="end-learnings-title">Five categories = clear tradeoffs:</div>
          <div className="end-learning-row">
            <span className="learning-check">✓</span>
            <span>Needs vs Wants vs long-term Savings &amp; Investing</span>
          </div>
          <div className="end-learning-row">
            <span className="learning-check">✓</span>
            <span>Debt minimums and interest when you underpay</span>
          </div>
          <div className="end-learning-row">
            <span className="learning-check">✓</span>
            <span>Immediate feedback after each month&apos;s split</span>
          </div>
        </div>

        <div className="end-actions">
          {onRestartRun ? (
            <button type="button" className="restart-btn" onClick={onRestartRun}>
              Play again
            </button>
          ) : (
            <button type="button" className="restart-btn" onClick={onRestart}>
              Play again
            </button>
          )}
          <div className="end-secondary-links">
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
