import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getBestTotalScore, loadSessions } from '../services/statsStorage';

export function ProfilePage() {
  const { user, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  useEffect(() => {
    if (!user) return;
    setName(user.displayName);
  }, [user]);
  const sessions = loadSessions().length;
  const best = getBestTotalScore();

  if (!user) {
    return (
      <div className="page-pad page-narrow">
        <div className="page-wrap">
          <h1 className="page-title">Profile</h1>
          <p className="page-desc">
            Sign in to set a display name — it appears in the nav when you&apos;re logged
            in.
          </p>
          <Link to="/sign-in" className="btn-primary-lg">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ displayName: name.trim() || user.displayName });
  };

  return (
    <div className="page-pad">
      <div className="page-wrap narrow">
        <h1 className="page-title">Profile</h1>
        <p className="page-desc">Local profile — data stays in your browser.</p>

        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {(user.displayName || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-meta">
            <p className="profile-email">{user.email}</p>
            <form className="profile-form" onSubmit={handleSave}>
              <label className="form-field">
                <span>Display name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <button type="submit" className="btn-secondary-lg">
                Save
              </button>
            </form>
          </div>
        </div>

        <div className="stats-inline">
          <div>
            <span className="stats-inline-label">Sessions recorded</span>
            <span className="stats-inline-val">{sessions}</span>
          </div>
          <div>
            <span className="stats-inline-label">Best score (all time)</span>
            <span className="stats-inline-val">{best || '—'}</span>
          </div>
        </div>

        <div className="stack-btns">
          <Link to="/play" className="btn-primary-lg">
            Play game
          </Link>
          <Link to="/stats" className="btn-secondary-lg">
            Full stats
          </Link>
          <button type="button" className="btn-ghost danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
