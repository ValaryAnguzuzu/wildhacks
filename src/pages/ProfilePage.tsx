import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getBestTotalScore, loadSessions } from '../services/statsStorage';

export function ProfilePage() {
  const { user, loading: authLoading, updateProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [sessionsCount, setSessionsCount] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName ?? '');
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    void Promise.all([loadSessions(), getBestTotalScore()]).then(([rows, b]) => {
      setSessionsCount(rows.length);
      setBest(b);
    });
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="page-pad page-narrow">
        <div className="page-wrap">
          <h1 className="page-title">Profile</h1>
          <p className="page-desc">Loading…</p>
        </div>
      </div>
    );
  }

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
    updateProfile({
      displayName: (name.trim() || user.displayName) ?? undefined,
    });
  };

  const emailLine = user.email ?? (user.isAnonymous ? 'Guest (anonymous)' : '—');

  return (
    <div className="page-pad">
      <div className="page-wrap narrow">
        <h1 className="page-title">Profile</h1>
        <p className="page-desc">
          Game progress and stats sync to Firebase. Add an email to keep the same account
          across browsers.
        </p>

        {user.isAnonymous ? (
          <p className="page-desc">
            You&apos;re playing as a guest.{' '}
            <Link to="/sign-in">Link an email</Link> so your runs stay tied to you if you
            switch devices.
          </p>
        ) : null}

        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-meta">
            <p className="profile-email">{emailLine}</p>
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
            <span className="stats-inline-val">{sessionsCount}</span>
          </div>
          <div>
            <span className="stats-inline-label">Best score (all time)</span>
            <span className="stats-inline-val">
              {best === null ? '—' : best || '—'}
            </span>
          </div>
        </div>

        <div className="stack-btns">
          <Link to="/play" className="btn-primary-lg">
            Play game
          </Link>
          <Link to="/stats" className="btn-secondary-lg">
            Full stats
          </Link>
          {user.isAnonymous ? (
            <Link to="/sign-in" className="btn-secondary-lg">
              Link email account
            </Link>
          ) : null}
          <button type="button" className="btn-ghost danger" onClick={signOut}>
            {user.isAnonymous ? 'New guest session' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
