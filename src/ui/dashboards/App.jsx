import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import TriagePhaseUI from './TriagePhaseUI';
import AfterActionReportUI from './AfterActionReportUI';
import DispatchMapUI from './DispatchMapUI';
import SceneSizeupUI from './SceneSizeupUI';
import CommandCenterUI from './CommandCenterUI';

export default function App() {
  const [gameStateData, setGameStateData] = useState(gameState.getState());

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { phase, score, patients } = gameStateData;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }}>
      {phase === 'DISPATCH' && <DispatchMapUI />}
      {phase === 'SCENE_SIZEUP' && <SceneSizeupUI />}
      {phase === 'COMMAND_CENTER' && <CommandCenterUI />}
      {phase === 'AFTER_ACTION_REPORT' && <AfterActionReportUI score={score} patients={patients} />}
    </div>
  );
}
