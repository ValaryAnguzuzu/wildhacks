import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { LEVELS } from '../data/levels';
import { useGameEngine } from '../hooks/useGameEngine';
import { streamClaude } from '../services/claudeApi';
import { LevelStats } from '../types';
import { isMuted, playGameSound, setMuted } from '../utilities/gameAudio';
import { buildLevel2UserPrompt } from '../utilities/promptFromLevel';
import { LevelAnswerKey } from './LevelAnswerKey';

interface Props {
  levelIndex: number;
  totalLevels: number;
  sessionScoreOffset: number;
  lastRunTotalScore: number;
  onLevelComplete: (stats: LevelStats) => void;
  /** Fires when this level is cleared (overlay shown), so answer-key links work before Next. */
  onLevelCleared?: (levelIndex: number) => void;
  /** Confirmed from level-complete overlay: restart run from level 1. */
  onRestartRun?: () => void;
  onExit: () => void;
}

function FormattedClaudeText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="ov-claude-response ov-claude-formatted">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

export function GameBoard({
  levelIndex,
  totalLevels,
  sessionScoreOffset,
  lastRunTotalScore,
  onLevelComplete,
  onLevelCleared,
  onRestartRun,
  onExit,
}: Props) {
  const level = LEVELS[levelIndex];
  const engine = useGameEngine(levelIndex);
  const [showOverlay, setShowOverlay] = useState(false);
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const statsRef = useRef<LevelStats | null>(null);
  const levelCompleteHandled = useRef(false);
  const lastSoundPhase = useRef<string>('');
  const levelChimePlayed = useRef(false);
  const [arenaShake, setArenaShake] = useState(false);
  const [comboAnim, setComboAnim] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const dragRef = useRef({ startX: 0, active: false });
  const pauseResumeRef = useRef<HTMLButtonElement>(null);

  const MAX_HINTS = 3;
  const numCols = level.columns.length;
  const timerPct = engine.timerMax > 0 ? engine.timeLeft / engine.timerMax : 0;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';
  const flowMode =
    engine.phase === 'active' &&
    engine.timerMax < level.timerSeconds &&
    engine.streak >= 2;

  const sessionTotal = sessionScoreOffset + engine.score;
  const runningAccuracy =
    engine.totalCount > 0
      ? Math.round((engine.correctCount / engine.totalCount) * 100)
      : 0;
  const aheadOfLastRun =
    lastRunTotalScore > 0 && sessionTotal > lastRunTotalScore && !showOverlay;

  const toggleMute = () => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
  };

  useEffect(() => {
    setDragPx(0);
    dragRef.current = { startX: 0, active: false };
  }, [engine.currentBlock?.id]);

  useEffect(() => {
    if (!engine.isPaused || showOverlay) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => pauseResumeRef.current?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [engine.isPaused, showOverlay]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showOverlay && e.code === 'Escape') return;
      if (e.code === 'Escape') {
        e.preventDefault();
        if (engine.isPaused) engine.resume();
        else engine.pause();
        return;
      }
      if (engine.isPaused || showOverlay) return;
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'Space':
          e.preventDefault();
          engine.drop();
          break;
        case 'KeyF':
          e.preventDefault();
          engine.flip();
          break;
        case 'KeyH':
          e.preventDefault();
          engine.useHint();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, showOverlay]);

  useEffect(() => {
    const prev = lastSoundPhase.current;
    const ph = engine.phase;
    if (ph === 'dropping' && prev !== 'dropping') playGameSound('drop');
    if (ph === 'feedback' && prev !== 'feedback' && engine.feedback) {
      playGameSound(engine.feedback.correct ? 'correct' : 'wrong');
    }
    lastSoundPhase.current = ph;
  }, [engine.phase, engine.feedback]);

  useEffect(() => {
    if (showOverlay && !levelChimePlayed.current) {
      levelChimePlayed.current = true;
      playGameSound('level');
    }
  }, [showOverlay]);

  useEffect(() => {
    if (engine.phase === 'feedback' && engine.feedback && !engine.feedback.correct) {
      setArenaShake(true);
      const t = window.setTimeout(() => setArenaShake(false), 520);
      return () => clearTimeout(t);
    }
  }, [engine.phase, engine.feedback]);

  useEffect(() => {
    if (engine.phase === 'feedback' && engine.feedback?.correct && engine.streak >= 3) {
      setComboAnim((n) => n + 1);
    }
  }, [engine.phase, engine.feedback, engine.streak]);

  useEffect(() => {
    if (!showOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showOverlay]);

  useEffect(() => {
    if (engine.phase !== 'levelComplete' || levelCompleteHandled.current) return;
    levelCompleteHandled.current = true;
    statsRef.current = engine.getStats();
    setShowOverlay(true);
    onLevelCleared?.(levelIndex);
    if (level.hasApiCall) {
      setClaudeLoading(true);
      setClaudeResponse('');
      const prompt = buildLevel2UserPrompt(level);
      void streamClaude(prompt, (chunk) => {
        setClaudeResponse((prev) => (prev ?? '') + chunk);
      }).finally(() => {
        setClaudeLoading(false);
      });
    }
  }, [engine.phase, level, levelIndex, onLevelCleared]);

  const placedInColumn = (colId: string) =>
    engine.placedBlocks.filter((p) => p.columnId === colId);

  const handleColumnClick = (colIdx: number) => {
    if (engine.isPaused || engine.phase !== 'active') return;
    engine.moveTo(colIdx);
    engine.drop(colIdx);
  };

  const handleNext = () => {
    if (statsRef.current) onLevelComplete(statsRef.current);
  };

  const handleCloseLevelComplete = () => {
    if (!onRestartRun) return;
    if (
      !window.confirm(
        'Close this screen? Your run will restart from level 1 — progress in this session will be lost.',
      )
    ) {
      return;
    }
    onRestartRun();
  };

  const accuracy =
    statsRef.current && statsRef.current.totalCount > 0
      ? Math.round((statsRef.current.correctCount / statsRef.current.totalCount) * 100)
      : 0;

  const cb = engine.currentBlock;
  const targetColLabel = cb?.isDistractor
    ? '— Not a lane — dismiss'
    : cb
      ? level.columns.find((c) => c.id === cb.correctColumn)?.label
      : undefined;

  const handleDistractorPointerDown = (e: React.PointerEvent) => {
    if (!cb?.isDistractor || engine.phase !== 'active' || engine.isPaused) return;
    dragRef.current = { startX: e.clientX, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDistractorPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !cb?.isDistractor) return;
    const dx = e.clientX - dragRef.current.startX;
    setDragPx(Math.min(0, dx));
  };

  const handleDistractorPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current = { startX: 0, active: false };
    setDragPx(0);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (cb?.isDistractor && dx < -72) {
      engine.dismissDistractor();
    }
  };

  const comboPill =
    engine.comboTier === 'mega'
      ? 'MEGA COMBO'
      : engine.comboTier === 'combo'
        ? 'COMBO'
        : null;

  return (
    <div className="game-container game-arena" data-level-theme={String(levelIndex)}>
      <header className="arena-hud" aria-label="Game status">
        <div className="arena-hud__row">
          <div className="arena-hud__level">
            <span className="arena-lvl-num">LVL {level.id}</span>
            <div className="arena-lvl-text">
              <div className="arena-lvl-title-row">
                <span className="arena-lvl-title">
                  Level {level.id}: {level.title}
                </span>
                {flowMode && (
                  <span
                    className="arena-flow-pill"
                    title="Timer tightens as your streak grows — stay in flow"
                  >
                    FLOW
                  </span>
                )}
              </div>
              <span className="arena-lvl-sub">{level.subtitle}</span>
            </div>
          </div>
          <div className="arena-hud__score">
            <span className="arena-score-label">SCORE</span>
            <span className="arena-score-val">{engine.score}</span>
          </div>
          <div className="arena-hud__streak">
            <span className="arena-streak-label">STREAK</span>
            <span
              key={comboAnim}
              className={[
                'arena-streak-val',
                engine.streak >= 3 &&
                (engine.phase === 'active' || engine.phase === 'feedback')
                  ? 'is-combo'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {engine.streak > 0 ? (
                <>
                  <span className="arena-fire" aria-hidden="true">
                    {engine.streak >= 2 ? '🔥 ' : ''}
                  </span>
                  {engine.streak}×
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="arena-hud__hints" aria-label="Hints remaining">
            {Array.from({ length: MAX_HINTS }, (_, i) => (
              <span
                key={i}
                className={['arena-hint-dot', i < engine.hintsLeft ? 'is-on' : '']
                  .filter(Boolean)
                  .join(' ')}
                title={i < engine.hintsLeft ? 'Hint available' : 'Used'}
              />
            ))}
          </div>
          <div className="arena-hud__controls">
            <button
              type="button"
              className="arena-hud__icon-btn"
              onClick={() => (engine.isPaused ? engine.resume() : engine.pause())}
              aria-label={engine.isPaused ? 'Resume' : 'Pause'}
              title={engine.isPaused ? 'Resume (Esc)' : 'Pause (Esc)'}
            >
              {engine.isPaused ? '▶' : '⏸'}
            </button>
            <button
              type="button"
              className="arena-hud__icon-btn"
              onClick={onExit}
              aria-label="Exit to home"
              title="Exit run"
            >
              ✕
            </button>
            <button
              type="button"
              className="arena-hud__mute"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute game sounds' : 'Mute game sounds'}
              title="Sound effects"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        <div className="arena-hud__meta" aria-label="Run stats">
          <span title="This level">
            ACC <strong>{runningAccuracy}%</strong>
          </span>
          <span title="Speed bonus (fast answers)">
            SPD <strong>+{engine.speedBonusTotal}</strong>
          </span>
          <span title="Best streak this level">
            BEST <strong>{engine.bestStreak}×</strong>
          </span>
          <span title="All levels so far">
            RUN <strong>{sessionTotal}</strong>
          </span>
          {lastRunTotalScore > 0 && (
            <span
              className={aheadOfLastRun ? 'arena-beat-last' : ''}
              title="Previous full run"
            >
              LAST <strong>{lastRunTotalScore}</strong>
              {aheadOfLastRun ? ' · ahead' : ''}
            </span>
          )}
        </div>

        <div>
          <div className="arena-hud__timer-label">
            <span>TIMER</span>
            <span>
              {engine.isPaused
                ? 'PAUSED'
                : engine.phase === 'active' || engine.phase === 'dropping'
                  ? `${Math.ceil(engine.timeLeft)}s`
                  : '—'}
            </span>
          </div>
          <div className="arena-hud__timer-track">
            <div
              className="arena-hud__timer-fill"
              style={{
                width:
                  engine.phase === 'active' || engine.phase === 'dropping'
                    ? `${timerPct * 100}%`
                    : '100%',
                backgroundColor:
                  engine.phase === 'active' || engine.phase === 'dropping'
                    ? timerColor
                    : 'rgba(51, 65, 85, 0.6)',
                boxShadow:
                  timerPct <= 0.25 && engine.phase === 'active' && !engine.isPaused
                    ? '0 0 20px rgba(248, 113, 113, 0.55)'
                    : undefined,
                filter: engine.isPaused ? 'grayscale(0.4)' : undefined,
              }}
            />
          </div>
        </div>
      </header>

      <div
        className={['arena-body', engine.isPaused ? 'arena-body--paused' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <aside className="arena-sidebar arena-sidebar--left" aria-label="Concept">
          <div className="arena-sidebar__title">Current concept</div>
          <div className="arena-sidebar__concept">{engine.currentBlock?.name ?? '—'}</div>
          <div className="arena-sidebar__title" style={{ marginTop: '0.35rem' }}>
            Target lane
          </div>
          <div className="arena-sidebar__concept" style={{ fontSize: '0.82rem' }}>
            {targetColLabel ?? '—'}
          </div>
          <div className="arena-sidebar__tip">{level.learningGoal}</div>
        </aside>

        <div className="arena-main">
          <div
            className={['board', arenaShake ? 'arena-shake' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className="fall-lane-header">
              <span className="fall-lane-label">FALL LANE</span>
              {comboPill && engine.phase === 'active' && (
                <span
                  className={
                    engine.comboTier === 'mega'
                      ? 'arena-flow-pill arena-mega'
                      : 'arena-flow-pill'
                  }
                  style={{ fontSize: '0.48rem' }}
                >
                  {comboPill}
                </span>
              )}
            </div>
            <div className="falling-zone">
              {engine.currentBlock &&
                (engine.phase === 'active' || engine.phase === 'dropping') && (
                  <div
                    className={[
                      'falling-block',
                      engine.phase === 'dropping' ? 'is-dropping' : '',
                      engine.isFlipped ? 'is-flipped' : '',
                      engine.currentBlock.isDistractor ? 'is-distractor' : '',
                      engine.phase === 'active' && timerPct < 0.25 ? 'timer-urgent' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label="Concept block — F to flip; distractors: drag left to dismiss"
                    style={{
                      left: `calc(${((engine.selectedColumn + 0.5) / numCols) * 100}%)`,
                      transform: `translateX(calc(-50% + ${dragPx}px))`,
                      borderColor: engine.currentBlock.color,
                      boxShadow: `0 0 28px ${engine.currentBlock.color}66`,
                      touchAction: engine.currentBlock.isDistractor ? 'none' : undefined,
                    }}
                    onPointerDown={handleDistractorPointerDown}
                    onPointerMove={handleDistractorPointerMove}
                    onPointerUp={handleDistractorPointerUp}
                    onPointerCancel={handleDistractorPointerUp}
                    onClick={(e) => {
                      if (engine.currentBlock?.isDistractor) return;
                      e.stopPropagation();
                      engine.flip();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        engine.flip();
                      }
                    }}
                  >
                    <div className="block-face block-front">
                      <div
                        className="block-name"
                        style={{ color: engine.currentBlock.color }}
                      >
                        {engine.currentBlock.name}
                      </div>
                      {engine.currentBlock.isDistractor && (
                        <div className="distractor-badge">⚠ DISTRACTOR</div>
                      )}
                      {!engine.isFlipped && (
                        <div className="flip-hint">
                          {engine.currentBlock.isDistractor
                            ? 'F to flip · drag left to dismiss'
                            : 'Press F to flip'}
                        </div>
                      )}
                    </div>
                    <div className="block-face block-back">
                      <div className="block-desc">{engine.currentBlock.description}</div>
                    </div>
                    {engine.phase === 'active' && (
                      <div className="block-timer-track">
                        <div
                          className="block-timer-fill"
                          style={{
                            width: `${timerPct * 100}%`,
                            backgroundColor: timerColor,
                            transition: 'width 1s linear, background-color 0.5s',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

              {engine.phase === 'active' && engine.currentBlock && (
                <div className="block-pass-panel">
                  <div className="block-pass-panel__label">Quick actions</div>
                  <div className="block-pass-actions">
                    {engine.currentBlock.isDistractor ? (
                      <>
                        <button
                          type="button"
                          className="block-pass-btn block-pass-btn--primary"
                          onClick={() => engine.dismissDistractor()}
                          disabled={engine.isPaused}
                        >
                          <span className="block-pass-btn__title">
                            Not a fit — dismiss
                          </span>
                          <span className="block-pass-btn__sub">
                            Correct when it’s not a lane
                          </span>
                        </button>
                        <button
                          type="button"
                          className="block-pass-btn block-pass-btn--muted"
                          onClick={() => engine.skipDistractorAsMiss()}
                          disabled={engine.isPaused}
                        >
                          <span className="block-pass-btn__title">
                            I don’t know — skip
                          </span>
                          <span className="block-pass-btn__sub">Counts as a miss</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="block-pass-btn block-pass-btn--muted block-pass-actions__solo"
                        onClick={() => engine.passDontKnow()}
                        disabled={engine.isPaused}
                      >
                        <span className="block-pass-btn__title">I don’t know: pass</span>
                        <span className="block-pass-btn__sub">
                          Same as a wrong lane: streak resets, shorter next timer
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {engine.phase === 'active' && (
                <div
                  className="drop-arrow"
                  style={{
                    left: `calc(${((engine.selectedColumn + 0.5) / numCols) * 100}%)`,
                  }}
                >
                  ▼
                </div>
              )}
            </div>

            <div
              className="columns"
              style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
            >
              {level.columns.map((col, colIdx) => {
                const placed = placedInColumn(col.id);
                const isSelected =
                  engine.selectedColumn === colIdx && engine.phase === 'active';
                const isHinted = engine.hintColumn === colIdx;
                const isTarget =
                  engine.phase === 'dropping' && engine.selectedColumn === colIdx;

                return (
                  <div
                    key={col.id}
                    role="button"
                    tabIndex={0}
                    className={[
                      'column',
                      placed.length === 0 ? 'col-empty' : '',
                      isSelected ? 'col-selected' : '',
                      isHinted ? 'col-hinted' : '',
                      isTarget ? 'col-target' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={`${col.label}. ${col.hint}`}
                    title={col.hint}
                    onClick={() => handleColumnClick(colIdx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleColumnClick(colIdx);
                      }
                    }}
                  >
                    <div className="col-label">{col.label}</div>
                    <div className="col-hint">{col.hint}</div>
                    <div className="col-stack">
                      {placed.map((p, pi) => (
                        <div
                          key={pi}
                          className={`placed-block ${p.correct ? 'pb-correct' : 'pb-wrong'}`}
                          style={{
                            borderLeftColor: p.correct ? '#22c55e' : '#ef4444',
                          }}
                        >
                          <span className="pb-icon">{p.correct ? '✓' : '✗'}</span>
                          <span className="pb-name">{p.block.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={[
              'feedback-bar',
              engine.phase === 'feedback' && engine.feedback
                ? engine.feedback.correct
                  ? 'fb-correct'
                  : ['fb-wrong', engine.feedback.lostTimeSec ? 'fb-hard' : '']
                      .filter(Boolean)
                      .join(' ')
                : 'fb-idle',
            ].join(' ')}
          >
            {engine.phase === 'feedback' && engine.feedback ? (
              <>
                <div className="fb-headline">{engine.feedback.headline}</div>
                <div className="fb-detail">{engine.feedback.detail}</div>
              </>
            ) : engine.hintColumn !== null && engine.phase === 'active' ? (
              <div className="fb-coach fb-coach--hint">
                <div className="fb-coach__top">
                  <span className="fb-coach__badge">Hint</span>
                </div>
                {engine.currentBlock?.isDistractor ? (
                  <>
                    <p className="fb-coach__lead">
                      Not a valid lane — <strong>dismiss</strong> or{' '}
                      <strong>drag left</strong> to clear.
                    </p>
                    <p className="fb-coach__fine">
                      “Skip” still counts as a miss. Dropping in a column costs time.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="fb-coach__lead">
                      <strong>{engine.currentBlock?.name}</strong> belongs in the{' '}
                      <strong>highlighted</strong> column.
                    </p>
                    <p className="fb-coach__fine">
                      Or use <span className="fb-coach__kbd">I don’t know — pass</span>{' '}
                      above if you’re stuck (counts as a miss).
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div
                className={[
                  'fb-coach',
                  engine.phase === 'active' && engine.currentBlock?.isDistractor
                    ? 'fb-coach--distractor'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {engine.phase === 'active' && engine.currentBlock ? (
                  <>
                    <div className="fb-coach__top">
                      <span
                        className={[
                          'fb-coach__badge',
                          engine.currentBlock.isDistractor ? 'fb-coach__badge--warn' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {engine.currentBlock.isDistractor ? 'Distractor' : 'Your move'}
                      </span>
                    </div>
                    {engine.currentBlock.isDistractor ? (
                      <>
                        <p className="fb-coach__lead">
                          This block <strong>doesn’t match any lane</strong>. Clear it
                          with dismiss or a left swipe — don’t force it into a column.
                        </p>
                        <ul className="fb-coach__bullets" aria-label="Distractor rules">
                          <li>
                            <span className="fb-coach__bullet-icon" aria-hidden="true">
                              ✓
                            </span>
                            Dismiss = correct
                          </li>
                          <li>
                            <span
                              className="fb-coach__bullet-icon fb-coach__bullet-icon--bad"
                              aria-hidden="true"
                            >
                              ✗
                            </span>
                            Skip or wrong lane = miss / penalty
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="fb-coach__lead">
                          Align the arrow, then <strong>Drop</strong> when{' '}
                          <strong>{engine.currentBlock.name}</strong> matches the lane.
                        </p>
                        <p className="fb-coach__fine">
                          Stuck? Use <span className="fb-coach__kbd">Pass</span> — it
                          scores as an incorrect answer (streak resets, shorter next
                          timer).
                        </p>
                      </>
                    )}
                  </>
                ) : engine.phase === 'dropping' ? (
                  <p className="fb-coach__lead fb-coach__lead--solo">Placing…</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="controls-bar">
            <button
              className="ctrl-btn"
              onClick={engine.moveLeft}
              disabled={engine.isPaused}
              aria-label="Move left"
            >
              ◀
            </button>
            <button
              className="ctrl-btn"
              onClick={engine.flip}
              disabled={engine.isPaused}
              aria-label="Flip block"
            >
              FLIP <kbd>F</kbd>
            </button>
            <button
              className="ctrl-btn drop-btn"
              onClick={() => engine.drop()}
              disabled={engine.isPaused}
              aria-label="Drop block"
            >
              DROP <kbd>SPACE</kbd>
            </button>
            <button
              className="ctrl-btn"
              onClick={engine.useHint}
              disabled={engine.isPaused || engine.hintsLeft === 0}
              aria-label="Use hint"
            >
              HINT ({engine.hintsLeft})
            </button>
            <button
              className="ctrl-btn"
              onClick={engine.moveRight}
              disabled={engine.isPaused}
              aria-label="Move right"
            >
              ▶
            </button>
          </div>

          <div className="queue-bar">
            <span className="queue-label">QUEUE:</span>
            {engine.blockQueue.map((b, i) => (
              <div
                key={b.id}
                className="queue-dot"
                style={{
                  backgroundColor: b.color,
                  opacity: Math.max(0.2, 1 - i * 0.18),
                }}
                title={b.name}
              />
            ))}
            {engine.blockQueue.length === 0 && engine.phase !== 'levelComplete' && (
              <span className="queue-last">last block!</span>
            )}
          </div>
        </div>

        <aside className="arena-sidebar arena-sidebar--right" aria-label="Progress">
          <div className="arena-sidebar__title">Blocks left</div>
          <div className="arena-queue-count">{engine.blockQueue.length}</div>
          <div className="arena-sidebar__title" style={{ marginTop: '0.5rem' }}>
            Pipeline
          </div>
          <div className="arena-pipeline">
            {level.columns.map((col) => {
              const filled = placedInColumn(col.id).length > 0;
              return (
                <div key={col.id} className="arena-pipeline__row">
                  <span
                    className={['arena-pipeline__dot', filled ? 'is-filled' : '']
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden="true"
                  />
                  <span>{col.label}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {engine.isPaused &&
        !showOverlay &&
        createPortal(
          <div
            className="overlay pause-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-dialog-title"
          >
            <div className="pause-popup-card">
              <h2 id="pause-dialog-title" className="pause-title">
                Paused
              </h2>
              <p className="pause-hint">Press Esc or Resume to continue.</p>
              <div className="pause-actions">
                <button
                  ref={pauseResumeRef}
                  type="button"
                  className="pause-btn"
                  onClick={() => engine.resume()}
                >
                  Resume
                </button>
                <button
                  type="button"
                  className="pause-btn pause-btn--ghost"
                  onClick={onExit}
                >
                  Exit to home
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showOverlay &&
        createPortal(
          <div
            className="overlay level-complete-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-complete-title"
          >
            <div className="overlay-card level-complete-card">
              {onRestartRun ? (
                <button
                  type="button"
                  className="level-complete-close"
                  onClick={handleCloseLevelComplete}
                  aria-label="Close and restart run from level 1"
                  title="Close — restarts your run from level 1"
                >
                  ×
                </button>
              ) : null}
              <div className="ov-badge">LEVEL {level.id} COMPLETE</div>
              <h2 className="ov-title" id="level-complete-title">
                {level.title}
              </h2>

              <div className="ov-goal">
                <span className="ov-goal-icon">🧠</span>
                <span>{level.learningGoal}</span>
              </div>

              {statsRef.current && (
                <div className="ov-stats ov-stats--grid">
                  <div className="ov-stat">
                    <span className="ov-stat-val">{statsRef.current.score}</span>
                    <span className="ov-stat-lbl">SCORE</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-val">{accuracy}%</span>
                    <span className="ov-stat-lbl">ACCURACY</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-val">{statsRef.current.bestStreak}×</span>
                    <span className="ov-stat-lbl">BEST STREAK</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-val">+{statsRef.current.speedBonus}</span>
                    <span className="ov-stat-lbl">SPEED BONUS</span>
                  </div>
                </div>
              )}

              {levelIndex < totalLevels - 1 && (
                <div className="ov-next-preview">
                  <div className="ov-next-preview-label">Up next</div>
                  <h3 className="ov-next-preview-title">
                    {LEVELS[levelIndex + 1]?.title}
                  </h3>
                  <p className="ov-next-preview-sub">
                    {LEVELS[levelIndex + 1]?.subtitle}
                  </p>
                </div>
              )}

              <div className="ov-answer-key-block">
                <div className="ov-answer-key-head">
                  <h3 className="ov-answer-key-title">
                    This level — answers & explanations
                  </h3>
                  <Link
                    to={`/answers#level-${level.id}`}
                    className="ov-answer-key-guide-link"
                  >
                    Open full guide (all levels) →
                  </Link>
                </div>
                <LevelAnswerKey level={level} placements={engine.placedBlocks} />
              </div>

              {level.hasApiCall && (
                <div className="ov-claude-section">
                  <div className="ov-claude-label">Your assembled prompt</div>
                  <pre className="ov-prompt-preview">{buildLevel2UserPrompt(level)}</pre>
                  {claudeLoading && !claudeResponse ? (
                    <div className="ov-claude-loading">
                      <span className="dot-anim" />
                      Generating response…
                    </div>
                  ) : null}
                  {claudeResponse ? <FormattedClaudeText text={claudeResponse} /> : null}
                  {claudeLoading && claudeResponse ? (
                    <div className="stream-caret" aria-hidden="true">
                      ▍
                    </div>
                  ) : null}
                </div>
              )}

              <div className="ov-next-actions">
                <Link to="/" className="ov-home-btn">
                  Home
                </Link>
                <button type="button" className="ov-next-btn" onClick={handleNext}>
                  {levelIndex < totalLevels - 1
                    ? `Level ${level.id + 1} →`
                    : 'See Final Results →'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
