import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { LevelAnswerKey } from '../components/LevelAnswerKey';
import { LEVELS } from '../data/levels';

export function AnswerKeyPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash]);

  return (
    <div className="page-answers page-pad">
      <div className="page-wrap answer-key-page-wrap">
        <header className="page-header">
          <h1 className="page-title">Answer keys & explanations</h1>
          <p className="page-desc">
            Full reference for every level: correct placement and the teaching text for
            each block. Same content you see after a level — here for relaxed reading,
            bookmarking, or review after your run.
          </p>
        </header>

        <nav className="answer-key-toc" aria-label="Levels">
          {LEVELS.map((lvl) => (
            <a key={lvl.id} className="answer-key-toc-link" href={`#level-${lvl.id}`}>
              Level {lvl.id}: {lvl.title}
            </a>
          ))}
        </nav>

        <div className="answer-key-sections">
          {LEVELS.map((lvl) => (
            <section key={lvl.id} id={`level-${lvl.id}`} className="answer-key-section">
              <h2 className="answer-key-section-title">
                Level {lvl.id}: {lvl.title}
              </h2>
              <p className="answer-key-section-goal">{lvl.learningGoal}</p>
              <LevelAnswerKey level={lvl} />
            </section>
          ))}
        </div>

        <p className="page-footnote answer-key-foot">
          <Link to="/stats">← Stats</Link>
          <span className="answer-key-foot-dot" aria-hidden="true">
            ·
          </span>
          <Link to="/play">Play</Link>
          <span className="answer-key-foot-dot" aria-hidden="true">
            ·
          </span>
          <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  );
}
