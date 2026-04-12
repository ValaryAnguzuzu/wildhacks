import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FinSimBoard } from '../components/FinSimBoard';
import { EndScreen } from '../components/EndScreen';
import { FIN_SIM_ROUND_COUNT } from '../data/finSimScenario';
import type { FinSimResources } from '../data/finSimScenario';
import { useAuth } from '../context/AuthContext';
import {
  getLastRunTotalScore,
  recordSession,
  updateMaxAnswerLevelUnlocked,
} from '../services/statsStorage';
import { GamePhase, LevelStats } from '../types';

export function PlayPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [allStats, setAllStats] = useState<LevelStats[]>([]);
  const [gameStartTime] = useState(() => Date.now());
  const [lastRunTotalScore, setLastRunTotalScore] = useState(0);
  const [runId, setRunId] = useState(0);
  const [finSimWon, setFinSimWon] = useState(false);
  const [finSimResources, setFinSimResources] = useState<FinSimResources | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    void getLastRunTotalScore().then(setLastRunTotalScore);
  }, [authLoading]);

  useEffect(() => {
    if (phase !== 'gameComplete' || allStats.length !== FIN_SIM_ROUND_COUNT || recorded.current)
      return;
    recorded.current = true;
    void recordSession(allStats, Date.now() - gameStartTime).then(() => {
      void getLastRunTotalScore().then(setLastRunTotalScore);
    });
  }, [phase, allStats, gameStartTime]);

  const handleRunComplete = (stats: LevelStats[], won: boolean, resources: FinSimResources) => {
    void updateMaxAnswerLevelUnlocked(FIN_SIM_ROUND_COUNT - 1);
    setAllStats(stats);
    setFinSimWon(won);
    setFinSimResources(resources);
    setPhase('gameComplete');
  };

  const handleRestart = () => {
    navigate('/');
  };

  const handleRestartRun = () => {
    setPhase('playing');
    setAllStats([]);
    setFinSimWon(false);
    setFinSimResources(null);
    void getLastRunTotalScore().then(setLastRunTotalScore);
    setRunId((n) => n + 1);
    recorded.current = false;
  };

  return (
    <div className="play-page">
      {phase === 'playing' && (
        <FinSimBoard
          key={`finsim-${runId}`}
          lastRunTotalScore={lastRunTotalScore}
          onRunComplete={handleRunComplete}
          onExit={() => navigate('/')}
        />
      )}

      {phase === 'gameComplete' && (
        <EndScreen
          stats={allStats}
          totalTimeMs={Date.now() - gameStartTime}
          finSimWon={finSimWon}
          finSimResources={finSimResources}
          onRestart={handleRestart}
          onRestartRun={handleRestartRun}
        />
      )}
    </div>
  );
}
