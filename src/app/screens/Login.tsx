import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/firebase/auth';
import { useStore } from '@/store/useStore';

import { Button } from '../components/Button';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const profile = useStore((s) => s.user);
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (user && profile?.skillLevel && profile?.activeCategory) {
      navigate('/home', { replace: true });
    }
  }, [user, profile?.skillLevel, profile?.activeCategory, navigate]);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const goNext = () => {
    navigate(from && from !== '/login' ? from : '/home', { replace: true });
  };

  const handleEmail = async () => {
    setError(null);
    setPending(true);
    const fn =
      mode === 'signup'
        ? signUpWithEmail(email, password, name || 'Learner')
        : signInWithEmail(email, password);
    const { error: err } = await fn;
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    goNext();
  };

  const handleGoogle = async () => {
    setError(null);
    setPending(true);
    const { error: err } = await signInWithGoogle();
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    goNext();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 bg-[var(--background)] relative">
      <FloatingThemeToggle />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto w-full"
      >
        <h1
          className="mb-2 text-center"
          style={{
            fontSize: 'var(--font-display)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}
        >
          FinLife
        </h1>
        <p
          className="mb-8 text-center"
          style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </p>

        <div className="space-y-4 mb-6">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-3 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full px-4 py-3 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
          />
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--wrong) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--wrong) 35%, transparent)',
              color: 'var(--wrong)',
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => void handleEmail()}
            disabled={pending || !email || !password}
          >
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => void handleGoogle()}
            disabled={pending}
          >
            Continue with Google
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="w-full text-center text-sm py-2"
            style={{ color: 'var(--teal)' }}
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
