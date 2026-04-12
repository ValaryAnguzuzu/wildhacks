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
          Sort each falling block into the column that matches the concept. Read the back
          of a card when you need a hint — the timer keeps you honest.
        </p>
        <ul className="help-shortcuts">
          <li>
            <span className="kbd">←</span> <span className="kbd">→</span> Move
          </li>
          <li>
            <span className="kbd">Enter</span> <span className="kbd">↓</span> Drop
          </li>
          <li>
            <span className="kbd">Space</span> Pause (Esc too)
          </li>
          <li>
            <span className="kbd">F</span> Flip card
          </li>
          <li>
            <span className="kbd">H</span> Hint
          </li>
        </ul>
        <p className="help-touch">
          Touch: tap a column to place · tap the block to flip.
        </p>
        <p className="help-foot">
          Sound and appearance live in <strong>Settings</strong>. Your runs are saved on
          this device only.
        </p>
      </div>
    </div>
  );
}
