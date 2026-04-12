import React from 'react';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">PrompTetris</span>
          <p className="footer-tag">Learn how LLMs work — by playing.</p>
        </div>
        <div className="footer-columns">
          <div className="footer-col">
            <span className="footer-col-title">Play</span>
            <Link to="/play">Start game</Link>
            <Link to="/stats">Your stats</Link>
            <Link to="/answers">Answer keys</Link>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Account</span>
            <Link to="/sign-in">Sign in</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/settings">Settings</Link>
          </div>
        </div>
      </div>
      <div className="footer-meta">© {new Date().getFullYear()} PrompTetris</div>
    </footer>
  );
}
