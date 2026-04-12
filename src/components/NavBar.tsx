import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HelpPanel } from './HelpPanel';

export function NavBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <header className="main-nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" aria-label="PrompTetris home">
          <span className="nav-brand-promp">Promp</span>
          <span className="nav-brand-tetris">Tetris</span>
        </Link>

        <button
          type="button"
          className="nav-burger"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'nav-links-open' : ''}`} aria-label="Main">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/stats" className={linkClass}>
            Stats
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
          {authLoading ? null : user && !user.isAnonymous ? (
            <span
              className="nav-user-pill"
              title={user.email ?? user.displayName ?? undefined}
            >
              {user.displayName?.trim() || user.email || 'Player'}
            </span>
          ) : (
            <NavLink to="/sign-in" className={linkClass}>
              Sign in
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-help-btn"
            onClick={() => setHelpOpen(true)}
            aria-label="Help and keyboard shortcuts"
            title="Help"
          >
            ?
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link to="/play" className="nav-play-btn">
            Play game
          </Link>
        </div>
      </div>
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
