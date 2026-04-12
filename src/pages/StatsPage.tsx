import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { clearSessions, GameSessionRecord, loadSessions } from '../services/statsStorage';

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function StatsPage() {
  const [sessions, setSessions] = useState<GameSessionRecord[]>(() => loadSessions());

  const best = useMemo(
    () => sessions.reduce((m, r) => Math.max(m, r.totalScore), 0),
    [sessions],
  );

  const handleClear = () => {
    if (!window.confirm('Clear all saved game sessions on this device?')) return;
    clearSessions();
    setSessions([]);
  };

  return (
    <div className="page-stats page-pad">
      <div className="page-wrap">
        <header className="page-header">
          <h1 className="page-title">Your stats</h1>
          <p className="page-desc">
            Completed runs are saved only on this device so you can see how you improve
            over time.
          </p>
          <p className="page-desc stats-study-link">
            <Link to="/answers">Answer keys & explanations (all levels)</Link> —
            comfortable reading for every block.
          </p>
        </header>

        <div className="stats-summary">
          <div className="stat-box">
            <span className="stat-box-label">Sessions</span>
            <span className="stat-box-value">{sessions.length}</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-label">Best total score</span>
            <span className="stat-box-value">{sessions.length === 0 ? '—' : best}</span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No completed runs yet.</p>
            <Link to="/play" className="btn-primary-lg">
              Play your first game
            </Link>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Score</th>
                    <th scope="col">Accuracy</th>
                    <th scope="col">Best streak</th>
                    <th scope="col">Time</th>
                    <th scope="col">Levels</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.at)}</td>
                      <td>{r.totalScore}</td>
                      <td>{r.accuracyPct}%</td>
                      <td>{r.bestStreak}×</td>
                      <td>{formatDuration(r.durationMs)}</td>
                      <td className="mono">{r.levelScores.join(' / ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn-ghost danger" onClick={handleClear}>
              Clear all sessions
            </button>
          </>
        )}

        <p className="page-footnote">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
