import React from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';
import { clearSessions } from '../services/statsStorage';
import { isMuted, setMuted } from '../utilities/gameAudio';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [soundOff, setSoundOff] = React.useState(isMuted());

  const toggleSound = () => {
    const next = !isMuted();
    setMuted(next);
    setSoundOff(next);
  };

  const clearData = () => {
    if (!window.confirm('Clear all local game sessions? Profile sign-in is kept.'))
      return;
    clearSessions();
  };

  const nuclear = () => {
    if (
      !window.confirm(
        'Remove sign-in, stats, theme, and sound prefs from this browser? This cannot be undone.',
      )
    )
      return;
    clearSessions();
    localStorage.removeItem('prompTetris_user');
    localStorage.removeItem('prompTetrisTheme');
    localStorage.removeItem('prompTetrisMute');
    window.location.reload();
  };

  return (
    <div className="page-pad">
      <div className="page-wrap narrow">
        <h1 className="page-title">Settings</h1>
        <p className="page-desc">
          Theme, sound, and data preferences stay on this device.
        </p>

        <section className="settings-block">
          <h2 className="settings-heading">Appearance</h2>
          <p className="settings-hint">
            Light and dark themes apply across the whole app.
          </p>
          <div className="segmented">
            <button
              type="button"
              className={theme === 'light' ? 'seg active' : 'seg'}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'seg active' : 'seg'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
          </div>
        </section>

        <section className="settings-block">
          <h2 className="settings-heading">Sound</h2>
          <button type="button" className="btn-secondary-lg" onClick={toggleSound}>
            {soundOff ? 'Turn sound on' : 'Mute game sounds'}
          </button>
        </section>

        <section className="settings-block">
          <h2 className="settings-heading">Data</h2>
          <div className="stack-btns tight">
            <button type="button" className="btn-ghost" onClick={clearData}>
              Clear session history only
            </button>
            <button type="button" className="btn-ghost danger" onClick={nuclear}>
              Reset all local data
            </button>
          </div>
        </section>

        <p className="page-footnote">
          <Link to="/">← Home</Link>
        </p>
      </div>
    </div>
  );
}
