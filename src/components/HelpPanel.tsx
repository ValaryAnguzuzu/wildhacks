import React, { useEffect, useId, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="help-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="help-header">
          <h2 id={titleId} className="help-title">
            How to play
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="help-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="help-lead">
          Each month you get a paycheck. Assign <strong>every dollar</strong> across five
          categories: Needs, Debt, Savings, Investing, and Wants — color-coded columns on
          the right.
        </p>
        <ul className="help-shortcuts">
          <li>
            <span className="kbd">+25</span> / <span className="kbd">−25</span> move money
            into or out of a category
          </li>
          <li>
            <strong>Split evenly</strong> runs a playful distribution animation so you can
            watch dollars move into each bucket — then tweak any column you like
          </li>
          <li>
            <strong>Confirm allocation</strong> when remaining is $0 — or the timer
            applies an even split
          </li>
          <li>
            Underfunding Needs or debt minimums triggers fees or interest in the feedback
          </li>
        </ul>
        <p className="help-touch">
          Touch: tap +/− in each column. Lose if total debt crosses the limit shown on the
          left.
        </p>
        <p className="help-foot">
          Appearance lives in <strong>Settings</strong>. Signed-in runs sync to{' '}
          <strong>Stats</strong>.
        </p>
      </div>
    </div>
  );
}
