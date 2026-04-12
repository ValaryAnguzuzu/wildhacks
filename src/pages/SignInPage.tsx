import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export function SignInPage() {
  const { user, loading: authLoading, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="page-pad page-narrow">
        <div className="page-wrap">
          <h1 className="page-title">Sign in</h1>
          <p className="page-desc">Loading…</p>
        </div>
      </div>
    );
  }

  if (user && !user.isAnonymous && user.email) {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    setSubmitting(true);
    try {
      await signInWithEmail(email, password, displayName);
      navigate('/profile');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message =
        code === 'auth/weak-password'
          ? 'Password is too weak.'
          : code === 'auth/invalid-email'
            ? 'Invalid email address.'
            : code === 'auth/wrong-password' || code === 'auth/invalid-credential'
              ? 'Wrong email or password.'
              : (err as Error)?.message ?? 'Could not sign in. Try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-pad page-narrow">
      <div className="page-wrap">
        <h1 className="page-title">
          {user?.isAnonymous ? 'Link an email' : 'Sign in'}
        </h1>
        <p className="page-desc">
          {user?.isAnonymous
            ? 'Add an email and password to keep your progress if you clear cookies or use another device. Your current guest stats are merged into this account.'
            : 'Sign in with email and password.'}
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
          <button
            type="submit"
            className="btn-primary-lg full-width"
            disabled={submitting}
          >
            {submitting ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <p className="form-alt">
          <Link to="/">← Home</Link>
        </p>
      </div>
    </div>
  );
}
