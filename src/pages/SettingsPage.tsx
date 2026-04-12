import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { clearSessions } from '../services/statsStorage';
import { isMuted, setMuted } from '../utilities/gameAudio';

export function SettingsPage() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [soundOff, setSoundOff] = React.useState(isMuted());

  const toggleSound = () => {
    const next = !isMuted();
    setMuted(next);
    setSoundOff(next);
  };

  const clearData = () => {
    if (
      !window.confirm(
        'Clear all completed runs stored in Firebase for this account? Theme and sound stay on this device.',
      )
    )
      return;
    void clearSessions();
  };

  const nuclear = () => {
    if (
      !window.confirm(
        'Reset this browser: clear cloud session history, sign out and start a new guest, and remove theme and sound preferences. This cannot be undone.',
      )
    )
      return;
    void (async () => {
      await clearSessions();
      await signOut();
      localStorage.removeItem('prompTetris_user');
      localStorage.removeItem('prompTetrisTheme');
      localStorage.removeItem('prompTetrisMute');
      localStorage.removeItem('prompTetris_migrated_to_firestore_v1');
      window.location.reload();
    })();
  };

  return (
    <div className="page-pad">
      <div className="page-wrap narrow">
        <h1 className="page-title">Settings</h1>
        <p className="page-desc">
          Theme and sound stay on this device. Game runs and unlocks sync to your Firebase
          account.
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
              Clear cloud session history
            </button>
            <button type="button" className="btn-ghost danger" onClick={nuclear}>
              Reset browser and cloud stats
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
