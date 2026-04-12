import React, { useEffect, useRef } from 'react';

import { GAME_CATEGORIES, sumAllocation } from '../data/gameCategories';
import { FIN_SIM_MAX_DEBT, FIN_SIM_ROUND_COUNT } from '../data/finSimScenario';
import type { FinSimResources } from '../data/finSimScenario';
import { useFinSimEngine } from '../hooks/useFinSimEngine';
import type { LevelStats } from '../types';

interface Props {
  lastRunTotalScore: number;
  onRunComplete: (stats: LevelStats[], won: boolean, resources: FinSimResources) => void;
  onExit: () => void;
}

function formatMoney(n: number): string {
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

export function FinSimBoard({ lastRunTotalScore, onRunComplete, onExit }: Props) {
  const engine = useFinSimEngine();
  const completedRef = useRef(false);
  const onRunCompleteRef = useRef(onRunComplete);
  onRunCompleteRef.current = onRunComplete;

  useEffect(() => {
    if (engine.phase !== 'gameWon' && engine.phase !== 'gameLost') return;
    if (completedRef.current) return;
    completedRef.current = true;
    onRunCompleteRef.current(
      engine.getRunStats(),
      engine.phase === 'gameWon',
      { ...engine.resources },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terminal transition once
  }, [engine.phase]);

  const timerPct =
    engine.timerMax > 0 ? Math.min(1, engine.timeLeft / engine.timerMax) : 0;
  const timerColor =
    timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  const sessionTotal = engine.score;
  const ahead = lastRunTotalScore > 0 && sessionTotal > lastRunTotalScore;

  const step = engine.currentStep;
  const pool =
    step?.kind === 'allocate' ? step.pool : 0;
  const allocated = sumAllocation(engine.allocationDraft);
  const remaining = pool - allocated;
  const canSubmit =
    engine.phase === 'step' &&
    step?.kind === 'allocate' &&
    remaining === 0 &&
    pool > 0;

  if (engine.phase === 'roundIntro' && engine.currentRound) {
    return (
      <div className="finsim-page">
        <div className="finsim-overlay" role="dialog" aria-modal="true">
          <div className="finsim-overlay-card">
            <p className="finsim-intro-badge">
              Month {engine.currentRound.month} · {engine.currentRound.title}
            </p>
            <h2 id="finsim-intro-title">Scenario</h2>
            <p>{engine.currentRound.aiIntro}</p>
            <div className="finsim-top-actions">
              <button
                type="button"
                className="finsim-continue"
                onClick={() => engine.acknowledgeRoundIntro()}
              >
                Start month
              </button>
              <button type="button" className="finsim-exit" onClick={onExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="finsim-page">
      <header className="finsim-hud" aria-label="FinSim status">
        <span className="finsim-hud__brand">FinSim</span>
        <div className="finsim-hud__metric">
          <span>Score</span>
          <strong>{engine.score}</strong>
        </div>
        <div className="finsim-hud__metric">
          <span>Month</span>
          <strong>
            {engine.roundIndex + 1}/{FIN_SIM_ROUND_COUNT}
          </strong>
        </div>
        <div className="finsim-hud__metric">
          <span>Streak</span>
          <strong>{engine.streak > 0 ? `${engine.streak}×` : '—'}</strong>
        </div>
        <div className="finsim-hud__metric" title="Previous full run">
          <span>Last run</span>
          <strong>{lastRunTotalScore > 0 ? lastRunTotalScore : '—'}</strong>
        </div>
        {lastRunTotalScore > 0 && (
          <div className={`finsim-hud__metric ${ahead ? 'arena-beat-last' : ''}`}>
            <span>Session</span>
            <strong>{sessionTotal}</strong>
          </div>
        )}
        {step?.kind === 'allocate' && engine.phase === 'step' ? (
          <div className="finsim-hud__timer" aria-hidden="true">
            <div
              className="finsim-hud__timer-fill"
              style={{
                width: `${timerPct * 100}%`,
                backgroundColor: timerColor,
              }}
            />
          </div>
        ) : null}
      </header>

      <div className="finsim-body">
        <aside className="finsim-panel" aria-label="Your money">
          <p className="finsim-panel__title">Your finances</p>
          <div className="finsim-meters">
            <div className="finsim-meter finsim-meter--savings">
              <span className="finsim-meter__label">Savings</span>
              <span className="finsim-meter__val">{formatMoney(engine.resources.savings)}</span>
            </div>
            <div className="finsim-meter finsim-meter--debt">
              <span className="finsim-meter__label">Debt</span>
              <span className="finsim-meter__val">{formatMoney(engine.resources.debt)}</span>
            </div>
            <div className="finsim-meter finsim-meter--investing">
              <span className="finsim-meter__label">Investing</span>
              <span className="finsim-meter__val">{formatMoney(engine.resources.investing)}</span>
            </div>
          </div>
          <p className="finsim-panel__risk">
            Lose if debt ≥ {formatMoney(FIN_SIM_MAX_DEBT)}.
          </p>
          <button type="button" className="finsim-exit" onClick={onExit}>
            ← Exit
          </button>
        </aside>

        <section className="finsim-ai" aria-label="Scenario and choices">
          <span className="finsim-ai__badge">AI narrator</span>

          {engine.phase === 'feedback' && engine.feedback ? (
            <>
              <div
                className={`finsim-feedback ${
                  engine.feedback.good ? 'finsim-feedback--good' : 'finsim-feedback--bad'
                }`}
              >
                <h3>{engine.feedback.headline}</h3>
                <p>{engine.feedback.detail}</p>
              </div>
              <button type="button" className="finsim-continue" onClick={() => engine.dismissFeedback()}>
                {engine.feedback.lost ? 'See results' : 'Continue'}
              </button>
            </>
          ) : null}

          {engine.phase === 'step' && step?.kind === 'narration' ? (
            <>
              <p className="finsim-ai__scenario">{step.text}</p>
              <button type="button" className="finsim-continue" onClick={() => engine.continueStep()}>
                Continue
              </button>
            </>
          ) : null}

          {engine.phase === 'step' && step?.kind === 'income' ? (
            <>
              <p className="finsim-line">
                <strong>Income:</strong> {step.label}{' '}
                <strong>+{formatMoney(step.amount)}</strong>
              </p>
              <p className="finsim-ai__hint">Next: you&apos;ll split this paycheck across all five categories.</p>
              <button type="button" className="finsim-continue" onClick={() => engine.continueStep()}>
                Continue
              </button>
            </>
          ) : null}

          {engine.phase === 'step' && step?.kind === 'allocate' ? (
            <>
              <p className="finsim-ai__scenario">{step.scenario}</p>
              <div className="finsim-pool-row" aria-live="polite">
                <span className="finsim-pool-chip finsim-pool-chip--pool">Pool {formatMoney(pool)}</span>
                <span className="finsim-pool-chip finsim-pool-chip--alloc">
                  Allocated {formatMoney(allocated)}
                </span>
                <span
                  className={`finsim-pool-chip finsim-pool-chip--rem ${remaining !== 0 ? 'finsim-remaining-warn' : ''}`}
                >
                  Left {formatMoney(remaining)}
                </span>
                <span className="finsim-pool-timer">{engine.timeLeft}s</span>
              </div>

              <div className="finsim-cols" role="group" aria-label="Category allocation">
                {GAME_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="finsim-col"
                    style={{ '--cat': cat.color } as React.CSSProperties}
                  >
                    <div className="finsim-col__head">
                      <span className="finsim-col__emoji" aria-hidden="true">
                        {cat.emoji}
                      </span>
                      <span className="finsim-col__label">{cat.label}</span>
                    </div>
                    <p className="finsim-col__hint">{cat.hint}</p>
                    <div className="finsim-col__amt">{formatMoney(engine.allocationDraft[cat.id])}</div>
                    <div className="finsim-col__btns">
                      <button
                        type="button"
                        className="finsim-col__step"
                        onClick={() => engine.adjustCategory(cat.id, -25)}
                        aria-label={`Remove 25 dollars from ${cat.label}`}
                      >
                        −25
                      </button>
                      <button
                        type="button"
                        className="finsim-col__step"
                        onClick={() => engine.adjustCategory(cat.id, 25)}
                        aria-label={`Add 25 dollars to ${cat.label}`}
                      >
                        +25
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="finsim-alloc-actions">
                <button
                  type="button"
                  className="finsim-btn finsim-btn--ghost"
                  onClick={() => engine.splitPoolEvenly()}
                >
                  Split evenly
                </button>
                <button
                  type="button"
                  className="finsim-continue"
                  disabled={!canSubmit}
                  onClick={() => engine.submitAllocation()}
                >
                  Confirm allocation
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
