import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EndScreen } from '../components/EndScreen';
import { GameBoard } from '../components/GameBoard';
import { LEVEL_COUNT } from '../data/levels';
import {
  getLastRunTotalScore,
  recordSession,
  updateMaxAnswerLevelUnlocked,
} from '../services/statsStorage';
import { GamePhase, LevelStats } from '../types';
import { resumeAudioContext } from '../utilities/gameAudio';

export function PlayPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [allStats, setAllStats] = useState<LevelStats[]>([]);
  const [gameStartTime, setGameStartTime] = useState(() => Date.now());
  const [lastRunTotalScore, setLastRunTotalScore] = useState(() =>
    getLastRunTotalScore(),
  );
  /** Bumps when the player restarts mid-run so GameBoard fully remounts. */
  const [runId, setRunId] = useState(0);
  const recorded = useRef(false);

  const sessionScoreOffset = allStats.reduce((a, s) => a + s.score, 0);

  useEffect(() => {
    resumeAudioContext();
  }, []);

  useEffect(() => {
    if (phase !== 'gameComplete' || allStats.length !== LEVEL_COUNT || recorded.current)
      return;
    recorded.current = true;
    recordSession(allStats, Date.now() - gameStartTime);
  }, [phase, allStats, gameStartTime]);

  const handleLevelComplete = (stats: LevelStats) => {
    updateMaxAnswerLevelUnlocked(currentLevel);
    const updated = [...allStats, stats];
    setAllStats(updated);
    if (currentLevel < LEVEL_COUNT - 1) {
      setCurrentLevel((l) => l + 1);
    } else {
      setPhase('gameComplete');
    }
  };

  const handleRestart = () => {
    navigate('/');
  };

  const handleRestartRun = () => {
    setCurrentLevel(0);
    setAllStats([]);
    setGameStartTime(Date.now());
    setLastRunTotalScore(getLastRunTotalScore());
    setRunId((n) => n + 1);
    recorded.current = false;
  };

  return (
    <div className="play-page">
      {phase === 'playing' && (
        <GameBoard
          key={`run-${runId}-lvl-${currentLevel}`}
          levelIndex={currentLevel}
          totalLevels={LEVEL_COUNT}
          sessionScoreOffset={sessionScoreOffset}
          lastRunTotalScore={lastRunTotalScore}
          onLevelComplete={handleLevelComplete}
          onLevelCleared={updateMaxAnswerLevelUnlocked}
          onRestartRun={handleRestartRun}
          onExit={() => navigate('/')}
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
