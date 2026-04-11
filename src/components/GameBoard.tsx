import React, { useEffect, useRef, useState } from 'react';

import { LEVELS } from '../data/levels';
import { useGameEngine } from '../hooks/useGameEngine';
import { callClaude } from '../services/claudeApi';
import { LevelStats } from '../types';

interface Props {
  levelIndex: number;
  onLevelComplete: (stats: LevelStats) => void;
}

export function GameBoard({ levelIndex, onLevelComplete }: Props) {
  const level = LEVELS[levelIndex];
  const engine = useGameEngine(levelIndex);
  const [showOverlay, setShowOverlay] = useState(false);
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const statsRef = useRef<LevelStats | null>(null);

  const numCols = level.columns.length;
  const timerPct = engine.timerMax > 0 ? engine.timeLeft / engine.timerMax : 0;
  const timerColor =
    timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  // ── keyboard handler ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':  e.preventDefault(); engine.moveLeft();  break;
        case 'ArrowRight': e.preventDefault(); engine.moveRight(); break;
        case 'Space':      e.preventDefault(); engine.drop();      break;
        case 'KeyF':       e.preventDefault(); engine.flip();      break;
        case 'KeyH':       e.preventDefault(); engine.useHint();   break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine]);

  // ── detect level complete ─────────────────────────────────────────────────
  useEffect(() => {
    if (engine.phase === 'levelComplete' && !showOverlay) {
      statsRef.current = engine.getStats();
      setShowOverlay(true);
      if (level.hasApiCall) {
        setClaudeLoading(true);
        const prompt =
          'Context: The user is a student.\n' +
          'Task: Explain in simple terms what a Large Language Model is.\n' +
          'Format: Use bullet points. Keep it under 200 words.';
        callClaude(prompt).then((r) => {
          setClaudeResponse(r);
          setClaudeLoading(false);
        });
      }
    }
  }, [engine.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ───────────────────────────────────────────────────────────────
  const placedInColumn = (colId: string) =>
    engine.placedBlocks.filter((p) => p.columnId === colId);

  const handleColumnClick = (colIdx: number) => {
    if (engine.phase !== 'active') return;
    if (engine.selectedColumn === colIdx) {
      engine.drop(colIdx);
    } else {
      engine.moveTo(colIdx);
    }
  };

  const handleNext = () => {
    if (statsRef.current) onLevelComplete(statsRef.current);
  };

  // ── accuracy label for overlay ────────────────────────────────────────────
  const accuracy =
    statsRef.current && statsRef.current.totalCount > 0
      ? Math.round(
          (statsRef.current.correctCount / statsRef.current.totalCount) * 100,
        )
      : 0;

  return (
    <div className="game-container">
      {/* ── HUD ── */}
      <div className="hud">
        <div className="hud-left">
          <span className="hud-lvl-badge">LVL {level.id}</span>
          <span className="hud-lvl-name">{level.title}</span>
        </div>
        <div className="hud-center">
          <span className="hud-subtitle">{level.subtitle}</span>
        </div>
        <div className="hud-right">
          <div className="stat-chip">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{engine.score}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-label">STREAK</span>
            <span className="stat-value">{engine.streak > 0 ? `${engine.streak}×` : '—'}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-label">HINTS</span>
            <span className="stat-value">{engine.hintsLeft}</span>
          </div>
        </div>
      </div>

      {/* ── Game board ── */}
      <div className="board">
        {/* Falling zone — block hovers here */}
        <div className="falling-zone">
          {engine.currentBlock &&
            (engine.phase === 'active' || engine.phase === 'dropping') && (
              <div
                className={[
                  'falling-block',
                  engine.phase === 'dropping' ? 'is-dropping' : '',
                  engine.isFlipped ? 'is-flipped' : '',
                  engine.currentBlock.isDistractor ? 'is-distractor' : '',
                ].join(' ')}
                style={{
                  left: `calc(${((engine.selectedColumn + 0.5) / numCols) * 100}%)`,
                  borderColor: engine.currentBlock.color,
                  boxShadow: `0 0 24px ${engine.currentBlock.color}55`,
                }}
              >
                {/* Front face */}
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
                    <div className="flip-hint">Press F to flip</div>
                  )}
                </div>

                {/* Back face (description) */}
                <div className="block-face block-back">
                  <div className="block-desc">{engine.currentBlock.description}</div>
                </div>

                {/* Timer bar */}
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

          {/* Drop arrow indicator */}
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

        {/* Columns */}
        <div
          className="columns"
          style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
        >
          {level.columns.map((col, colIdx) => {
            const placed = placedInColumn(col.id);
            const isSelected = engine.selectedColumn === colIdx && engine.phase === 'active';
            const isHinted  = engine.hintColumn === colIdx;
            const isTarget  = engine.phase === 'dropping' && engine.selectedColumn === colIdx;

            return (
              <div
                key={col.id}
                className={[
                  'column',
                  isSelected ? 'col-selected' : '',
                  isHinted   ? 'col-hinted'   : '',
                  isTarget   ? 'col-target'   : '',
                ].join(' ')}
                onClick={() => handleColumnClick(colIdx)}
                title={col.hint}
              >
                <div className="col-label">{col.label}</div>
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

      {/* ── Feedback bar ── */}
      <div
        className={[
          'feedback-bar',
          engine.phase === 'feedback' && engine.feedback
            ? engine.feedback.correct
              ? 'fb-correct'
              : 'fb-wrong'
            : 'fb-idle',
        ].join(' ')}
      >
        {engine.phase === 'feedback' && engine.feedback ? (
          <>
            <div className="fb-headline">{engine.feedback.headline}</div>
            <div className="fb-detail">{engine.feedback.detail}</div>
          </>
        ) : engine.hintColumn !== null && engine.phase === 'active' ? (
          <div className="fb-hint-text">
            💡{' '}
            {engine.currentBlock?.isDistractor
              ? 'This phrase is a distractor — it does NOT belong in any proper prompt section.'
              : `"${engine.currentBlock?.name}" belongs in the highlighted column`}
          </div>
        ) : (
          <div className="fb-idle-text">
            {engine.phase === 'active'
              ? `Place "${engine.currentBlock?.name}" in the correct column`
              : engine.phase === 'dropping'
              ? 'Placing...'
              : ''}
          </div>
        )}
      </div>

      {/* ── Mobile / extra controls ── */}
      <div className="controls-bar">
        <button className="ctrl-btn" onClick={engine.moveLeft} aria-label="Move left">◀</button>
        <button className="ctrl-btn" onClick={engine.flip}     aria-label="Flip block">FLIP <kbd>F</kbd></button>
        <button className="ctrl-btn drop-btn" onClick={() => engine.drop()} aria-label="Drop block">
          DROP <kbd>SPACE</kbd>
        </button>
        <button
          className="ctrl-btn"
          onClick={engine.useHint}
          disabled={engine.hintsLeft === 0}
          aria-label="Use hint"
        >
          HINT ({engine.hintsLeft})
        </button>
        <button className="ctrl-btn" onClick={engine.moveRight} aria-label="Move right">▶</button>
      </div>

      {/* ── Remaining blocks queue dots ── */}
      <div className="queue-bar">
        <span className="queue-label">QUEUE:</span>
        {engine.blockQueue.map((b, i) => (
          <div
            key={b.id}
            className="queue-dot"
            style={{ backgroundColor: b.color, opacity: Math.max(0.2, 1 - i * 0.18) }}
            title={b.name}
          />
        ))}
        {engine.blockQueue.length === 0 && engine.phase !== 'levelComplete' && (
          <span className="queue-last">last block!</span>
        )}
      </div>

      {/* ── Level complete overlay ── */}
      {showOverlay && (
        <div className="overlay" onClick={(e) => e.stopPropagation()}>
          <div className="overlay-card">
            <div className="ov-badge">LEVEL {level.id} COMPLETE</div>
            <h2 className="ov-title">{level.title}</h2>

            <div className="ov-goal">
              <span className="ov-goal-icon">🧠</span>
              <span>{level.learningGoal}</span>
            </div>

            {statsRef.current && (
              <div className="ov-stats">
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
              </div>
            )}

            {/* Claude API response for Level 2 */}
            {level.hasApiCall && (
              <div className="ov-claude-section">
                <div className="ov-claude-label">
                  🤖 Your assembled prompt — sent to Claude:
                </div>
                {claudeLoading ? (
                  <div className="ov-claude-loading">
                    <span className="dot-anim" />
                    Claude is thinking…
                  </div>
                ) : claudeResponse ? (
                  <div className="ov-claude-response">{claudeResponse}</div>
                ) : null}
              </div>
            )}

            <button className="ov-next-btn" onClick={handleNext}>
              {levelIndex < 2 ? `Level ${levelIndex + 2} →` : 'See Final Results →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
