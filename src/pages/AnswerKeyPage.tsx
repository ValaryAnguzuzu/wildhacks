import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LevelAnswerKey } from '../components/LevelAnswerKey';
import { LEVELS } from '../data/levels';
import { getMaxAnswerLevelUnlocked } from '../services/statsStorage';

export function AnswerKeyPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const maxUnlocked = getMaxAnswerLevelUnlocked();

  useEffect(() => {
    if (!hash) {
      setNotice(null);
      return;
    }
    const id = hash.replace('#', '');
    const match = /^level-(\d+)$/.exec(id);
    if (!match) return;
    const levelNum = parseInt(match[1], 10);
    if (levelNum > maxUnlocked) {
      setNotice(
        `Level ${levelNum} is locked. Complete level ${levelNum - 1} in Play mode first to unlock this guide.`,
      );
      navigate('/answers', { replace: true });
      return;
    }
    setNotice(null);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash, maxUnlocked, navigate]);

  const onLockedToc = (levelNum: number) => {
    setNotice(
      `Level ${levelNum} is locked. Complete level ${levelNum - 1} in Play mode first to unlock this guide.`,
    );
  };

  return (
    <div className="page-answers page-pad">
      <div className="page-wrap answer-key-page-wrap">
        <header className="page-header">
          <h1 className="page-title">Answer keys & explanations</h1>
          <p className="page-desc">
            Full reference for every level: correct placement and the teaching text for
            each block. Same content you see after a level — here for relaxed reading,
            bookmarking, or review after your run. Sections unlock as you complete levels
            in Play mode.
          </p>
        </header>

        {notice ? (
          <div className="answer-key-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              className="answer-key-notice-dismiss"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ) : null}

        <nav className="answer-key-toc" aria-label="Levels">
          {LEVELS.map((lvl) => {
            const locked = lvl.id > maxUnlocked;
            return locked ? (
              <button
                key={lvl.id}
                type="button"
                className="answer-key-toc-link answer-key-toc-link--locked"
                onClick={() => onLockedToc(lvl.id)}
              >
                Level {lvl.id}: {lvl.title}
                <span className="answer-key-lock" aria-hidden="true">
                  {' '}
                  🔒
                </span>
              </button>
            ) : (
              <a key={lvl.id} className="answer-key-toc-link" href={`#level-${lvl.id}`}>
                Level {lvl.id}: {lvl.title}
              </a>
            );
          })}
        </nav>

        <div className="answer-key-sections">
          {LEVELS.map((lvl) => {
            const locked = lvl.id > maxUnlocked;
            return (
              <section key={lvl.id} id={`level-${lvl.id}`} className="answer-key-section">
                <h2 className="answer-key-section-title">
                  Level {lvl.id}: {lvl.title}
                </h2>
                <p className="answer-key-section-goal">{lvl.learningGoal}</p>
                {locked ? (
                  <div className="answer-key-locked-panel">
                    <p className="answer-key-locked-text">
                      This section unlocks after you complete level {lvl.id - 1} in Play
                      mode.
                    </p>
                    <Link to="/play" className="answer-key-locked-cta">
                      Go to Play →
                    </Link>
                  </div>
                ) : (
                  <LevelAnswerKey level={lvl} />
                )}
              </section>
            );
          })}
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
