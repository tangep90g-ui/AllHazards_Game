import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { LayoutDashboard, CheckSquare, Clock, ShieldAlert, HeartPulse, Ambulance, Terminal } from 'lucide-react';
import expectedActionsData from '../../assets/data/expected_actions.json';

import TriagePhaseUI from './TriagePhaseUI';
import TransportUI from './TransportUI';
import TreatmentUI from './TreatmentUI';
import IntegratedMap from '../components/IntegratedMap';

export default function CommandCenterUI() {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [activeTab, setActiveTab] = useState('TRIAGE');
  const [completedActions, setCompletedActions] = useState({});
  const [pendingPlacementAction, setPendingPlacementAction] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
      setCompletedActions(newState.actionChecklist || {});
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { score, timeLeft } = gameStateData;

  const handleActionClick = (action) => {
    if (completedActions[action.id]) return;
    if (action.requiresPlacement) {
        setPendingPlacementAction(action);
    } else {
        gameState.processActionChecklist(action.id);
    }
  };

  const handleMapPlacement = (coords) => {
    if (!pendingPlacementAction) return;

    const dist = Math.sqrt(Math.pow(coords.x - 50, 2) + Math.pow(coords.y - 50, 2));
    let zone = 'cold';
    if (dist < 15) zone = 'hot';
    else if (dist < 35) zone = 'warm';

    const placementBonus = pendingPlacementAction.zoneRule[zone] || 0;
    
    // Pass coordinates to save the marker
    gameState.processActionChecklist(pendingPlacementAction.id, placementBonus, coords);
    setPendingPlacementAction(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-dark)', overflow: 'hidden' }}>
      
      {/* 1. Left Sidebar: Expected Actions Checklist (300px) */}
      <aside style={{ width: '300px', backgroundColor: '#0f0f15', borderRight: '1px solid var(--border-neon)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', borderBottom: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <h1 style={{ margin: 0, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} color="var(--color-primary)" />
            {gameStateData.currentScenario?.subtitle || 'INCIDENT RESPONSE'}
          </h1>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {expectedActionsData
            .map(action => {
              const status = completedActions[action.id];
              const isCooldownActive = action.isCooldownAction && gameStateData.skillsCooldown[action.id] > 0;
              const [maxT, minT] = action.recommendedTimeWindow;
              const isCompleted = !!status;
              const isCurrentWindow = !isCompleted && (timeLeft <= maxT && timeLeft >= minT);
              const isMissed = !isCompleted && timeLeft < minT;
              let weight = isCurrentWindow ? 0 : (isCompleted || isMissed ? 2 : 1);
              return { ...action, status, isCooldownActive, isCompleted, isCurrentWindow, isMissed, weight };
            })
            .sort((a, b) => a.weight - b.weight)
            .map(action => {
              const { status, isCooldownActive, isCompleted, isCurrentWindow, isMissed } = action;
              const [maxT, minT] = action.recommendedTimeWindow;
              const isSuccess = status === 'success';
              return (
                <div key={action.id} onClick={() => (isCooldownActive || isCompleted) ? null : handleActionClick(action)} style={{
                  padding: '0.6rem', borderRadius: '4px', border: '1px solid #222',
                  backgroundColor: isCurrentWindow ? 'rgba(255,204,0,0.08)' : isSuccess ? 'rgba(0,255,204,0.02)' : 'rgba(255,255,255,0.01)',
                  opacity: (isCompleted || isMissed) ? 0.4 : 1,
                  borderLeft: isCurrentWindow ? '4px solid var(--color-yellow)' : isSuccess ? '4px solid var(--color-green)' : '1px solid #222',
                  cursor: (isCooldownActive || isCompleted) ? 'default' : 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{action.title}</span>
                    {isCompleted && <span style={{ color: isSuccess ? '#00ffcc' : '#ff4444' }}>{isSuccess ? '✓' : '✗'}</span>}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px' }}>{maxT}s - {minT}s</div>
                  {isCooldownActive && <div style={{ fontSize: '0.6rem', color: 'var(--color-yellow)' }}>冷卻中 {gameStateData.skillsCooldown[action.id]}s</div>}
                </div>
              );
            })}
        </div>
      </aside>

      {/* Main Tactical Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Global Control Header */}
        <header style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderBottom: '1px solid var(--border-neon)', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <LayoutDashboard size={20} color="#0ff" />
             <h1 style={{ margin: 0, fontSize: '1rem', color: '#0ff', letterSpacing: '1px' }}>戰術指揮大盤 (COMMAND TACTICAL BOARD)</h1>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-red)', fontFamily: 'monospace' }}>
               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
             </div>
             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-yellow)' }}>
               SCORE: {score.toLocaleString()}
             </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', backgroundColor: '#111', borderBottom: '1px solid var(--border-neon)', flexShrink: 0 }}>
          {[
            { id: 'TRIAGE', icon: <ShieldAlert size={16} />, label: '現場檢傷' },
            { id: 'TREATMENT', icon: <HeartPulse size={16} />, label: '急救處置' },
            { id: 'TRANSPORT', icon: <Ambulance size={16} />, label: '後送調度' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.8rem',
                backgroundColor: activeTab === tab.id ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-green)' : 'var(--text-dim)',
                border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--color-green)' : '2px solid transparent',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* CENTER CONTENT: Split between Map and Active Tab Panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          
          {/* Shared Map Component */}
          <IntegratedMap 
            gameStateData={gameStateData}
            selectedPatientId={selectedPatientId}
            onPatientSelect={(id) => {
              setSelectedPatientId(id);
              setActiveTab('TRIAGE'); // Auto switch to triage assessment
            }}
            onMapClick={pendingPlacementAction ? handleMapPlacement : null}
          />

          {/* Right Action Panel (400px) */}
          <div style={{ width: '400px', backgroundColor: '#09090f', borderLeft: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            {activeTab === 'TRIAGE' && <TriagePhaseUI selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId} />}
            {activeTab === 'TREATMENT' && <TreatmentUI isEmbedded={true} />}
            {activeTab === 'TRANSPORT' && <TransportUI isEmbedded={true} />}
          </div>

          {/* Placement Overlay Message */}
          {pendingPlacementAction && (
             <div style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.9)', padding: '1rem 2rem', border: '2px solid var(--color-yellow)', borderRadius: '8px', zIndex: 100, pointerEvents: 'none', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--color-yellow)', margin: 0 }}>請在地圖上點擊位置</h2>
                <p style={{ color: '#fff', margin: '4px 0 0 0' }}>設置：{pendingPlacementAction.title}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
