import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export function SignInPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return (
      <div className="page-pad page-narrow">
        <div className="page-wrap">
          <h1 className="page-title">You&apos;re signed in</h1>
          <p className="page-desc">
            Signed in as <strong>{user.email}</strong>. Head to your profile or start a
            game.
          </p>
          <div className="stack-btns">
            <Link to="/profile" className="btn-primary-lg">
              Profile
            </Link>
            <Link to="/play" className="btn-secondary-lg">
              Play game
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    signIn(email, password, displayName);
    navigate('/profile');
  };

  return (
    <div className="page-pad page-narrow">
      <div className="page-wrap">
        <h1 className="page-title">Sign in</h1>
        <p className="page-desc">
          Sign in to personalize your name in the nav. Everything stays on this device —
          no server, no cloud account.
        </p>

        <form className="form-card" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Display name</span>
            <input
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we greet you?"
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn-primary-lg full-width">
            Continue
          </button>
        </form>

        <p className="form-alt">
          <Link to="/">← Home</Link>
        </p>
      </div>
    </div>
  );
}
