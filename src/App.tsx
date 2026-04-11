import './App.css';

import { useState } from 'react';

import { EndScreen } from './components/EndScreen';
import { GameBoard } from './components/GameBoard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GamePhase, LevelStats } from './types';

function App() {
  const [phase, setPhase]             = useState<GamePhase>('welcome');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [allStats, setAllStats]         = useState<LevelStats[]>([]);
  const [gameStartTime]                 = useState(() => Date.now());

  const handlePlay = () => {
    setCurrentLevel(0);
    setAllStats([]);
    setPhase('playing');
  };

  const handleLevelComplete = (stats: LevelStats) => {
    const updated = [...allStats, stats];
    setAllStats(updated);
    if (currentLevel < 2) {
      setCurrentLevel((l) => l + 1);
    } else {
      setPhase('gameComplete');
    }
  };

  const handleRestart = () => {
    setPhase('welcome');
  };

  return (
    <div className="app">
      {phase === 'welcome' && <WelcomeScreen onPlay={handlePlay} />}

      {phase === 'playing' && (
        <GameBoard
          key={currentLevel}
          levelIndex={currentLevel}
          onLevelComplete={handleLevelComplete}
        />
      )}

      {phase === 'gameComplete' && (
        <EndScreen
          stats={allStats}
          totalTimeMs={Date.now() - gameStartTime}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
