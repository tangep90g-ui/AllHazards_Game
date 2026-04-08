import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { LayoutDashboard, CheckSquare, Clock, ShieldAlert, HeartPulse, Ambulance, Terminal } from 'lucide-react';
import expectedActionsData from '../../assets/data/expected_actions.json';

import TriagePhaseUI from './TriagePhaseUI';
import TransportUI from './TransportUI';
import TreatmentUI from './TreatmentUI';

export default function CommandCenterUI() {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [activeTab, setActiveTab] = useState('TRIAGE');
  const [completedActions, setCompletedActions] = useState({});
  const [pendingPlacementAction, setPendingPlacementAction] = useState(null); // Added for Map Modal

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
      setCompletedActions(newState.actionChecklist || {});
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { score, timeLeft, patients } = gameStateData;

  const handleActionClick = (action) => {
    if (completedActions[action.id]) return;
    
    if (action.requiresPlacement) {
        setPendingPlacementAction(action);
    } else {
        gameState.processActionChecklist(action.id);
    }
  };

  const handleMapPlacement = (e) => {
    if (!pendingPlacementAction) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const dist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
    let zone = 'cold';
    if (dist < 15) zone = 'hot';
    else if (dist < 35) zone = 'warm';

    const placementBonus = pendingPlacementAction.zoneRule[zone] || 0;
    
    gameState.processActionChecklist(pendingPlacementAction.id, placementBonus);
    setPendingPlacementAction(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-dark)', overflow: 'hidden' }}>
      
      {/* Left Sidebar: Expected Actions Checklist */}
      <aside style={{ width: '30%', minWidth: '300px', backgroundColor: '#0f0f15', borderRight: '1px solid var(--border-neon)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', borderBottom: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <h1 style={{ margin: 0, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={24} color="var(--color-primary)" />
            {gameStateData.currentScenario?.subtitle || 'INCIDENT RESPONSE MGR'}
          </h1>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>在對應的時間窗內完成任務可獲得指揮加分。</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {expectedActionsData
            .map(action => {
              const status = completedActions[action.id];
              const isCooldownActive = action.isCooldownAction && gameStateData.skillsCooldown[action.id] > 0;
              const [maxT, minT] = action.recommendedTimeWindow;
              const isCompleted = !!status;
              const isCurrentWindow = !isCompleted && (timeLeft <= maxT && timeLeft >= minT);
              const isMissed = !isCompleted && timeLeft < minT;
              
              // Sorting logic: 0 = Active, 1 = Pending, 2 = Done/Missed
              let weight = 1;
              if (isCurrentWindow) weight = 0;
              else if (isCompleted || isMissed) weight = 2;

              return { ...action, status, isCooldownActive, isCompleted, isCurrentWindow, isMissed, weight };
            })
            .sort((a, b) => a.weight - b.weight)
            .map(action => {
              const { status, isCooldownActive, isCompleted, isCurrentWindow, isMissed } = action;
              const [maxT, minT] = action.recommendedTimeWindow;
              const isSuccess = status === 'success';
              
              const rowStyle = {
                padding: '0.75rem', 
                borderRadius: '6px', 
                border: '1px solid #222',
                backgroundColor: isCurrentWindow ? 'rgba(255,204,0,0.08)' : isSuccess ? 'rgba(0,255,204,0.02)' : 'rgba(255,255,255,0.01)',
                opacity: (isCompleted || isMissed) ? 0.4 : 1,
                borderLeft: isCurrentWindow ? '4px solid var(--color-yellow)' : isSuccess ? '4px solid var(--color-green)' : '1px solid #222',
                transition: 'all 0.3s ease'
              };

              return (
                <div key={action.id} onClick={() => (isCooldownActive || isCompleted) ? null : handleActionClick(action)} style={rowStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isSuccess ? 'var(--color-green)' : '#fff' }}>{action.title}</span>
                        {isCurrentWindow && <span style={{ fontSize: '0.5rem', backgroundColor: 'var(--color-yellow)', color: '#000', padding: '1px 3px', borderRadius: '2px', fontWeight: 'bold' }}>ACTIVE</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isCurrentWindow ? 'var(--color-yellow)' : '#555', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '2px' }}>
                        <Clock size={10} /> {maxT}s - {minT}s
                      </div>
                    </div>
                    <div>
                      {!isCompleted && !isMissed && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); (isCooldownActive || isCompleted) ? null : handleActionClick(action) }}
                          style={{ padding: '0.3rem 0.6rem', backgroundColor: isCurrentWindow ? 'var(--color-yellow)' : '#333', color: '#000', border: 'none', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold', cursor: isCooldownActive ? 'not-allowed' : 'pointer' }}
                        >
                          {isCooldownActive ? `${gameStateData.skillsCooldown[action.id]}s` : '執行'}
                        </button>
                      )}
                      {isMissed && <span style={{ color: '#555', fontSize: '0.7rem' }}>已逾時</span>}
                      {isCompleted && (
                        <span style={{ color: isSuccess ? 'var(--color-green)' : 'var(--color-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {isSuccess ? `+${action.bonus}` : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isCompleted && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem', lineHeight: '1.4' }}>{action.description}</div>}
                </div>
              );
            })}
        </div>
      </aside>

      {/* Right Content Area: Global Header + Tabs + View */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Global Control Header */}
        <header style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderBottom: '1px solid var(--border-neon)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <LayoutDashboard size={24} color="#0ff" />
             <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#0ff', letterSpacing: '2px' }}>現場總指揮中心 (INCIDENT COMMAND POST)</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>任務剩餘時間 (TIMER)</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-red)', fontFamily: 'monospace' }}>
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
             </div>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>任務總指揮評分 (SCORE)</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-yellow)' }}>
                 {score.toLocaleString()}
               </div>
             </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', backgroundColor: '#111', borderBottom: '1px solid var(--border-neon)', padding: '0 1rem' }}>
          {[
            { id: 'TRIAGE', icon: <ShieldAlert size={18} />, label: '現場檢傷 (HOT ZONE)' },
            { id: 'TREATMENT', icon: <HeartPulse size={18} />, label: '急救處置 (TREATMENT)' },
            { id: 'TRANSPORT', icon: <Ambulance size={18} />, label: '後送調度 (TRANSPORT)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 2rem',
                backgroundColor: activeTab === tab.id ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-green)' : 'var(--text-dim)',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--color-green)' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          
          {/* Overarching Placement Map Modal */}
          {pendingPlacementAction && (
             <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <h2 style={{ color: '#00ffcc', marginBottom: '1rem', textShadow: '0 0 10px #00ffcc' }}>請點擊地圖選定【{pendingPlacementAction.title}】的預定設置位置</h2>
               <div 
                 onClick={handleMapPlacement}
                 style={{ position: 'relative', width: '80%', height: '80%', borderRadius: '12px', overflow: 'hidden', cursor: 'crosshair', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
               >
                 <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,10,0.85)', backgroundImage: `url(${gameStateData.currentScenario?.bgImage || '/bg_collapse.png'}), radial-gradient(circle at center, rgba(0,255,0,0.05) 0%, transparent 80%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`, backgroundBlendMode: 'screen', backgroundSize: 'cover, 40px 40px, 40px 40px', backgroundPosition: 'center' }} />
                 <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', borderRadius: '50%', border: '2px dashed var(--color-yellow)', backgroundColor: 'rgba(255, 204, 0, 0.05)', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--color-yellow)', fontWeight: 'bold', marginTop: '1rem', letterSpacing: '4px' }}>除污緩衝區 (WARM ZONE)</span>
                 </div>
                 <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', height: '30%', borderRadius: '50%', border: '2px dashed var(--color-red)', backgroundColor: 'rgba(255, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <span style={{ color: 'var(--color-red)', fontWeight: 'bold', letterSpacing: '4px' }}>災變原爆熱區</span>
                 </div>
               </div>
               <button onClick={() => setPendingPlacementAction(null)} style={{ marginTop: '1rem', padding: '0.5rem 2rem', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消佈置</button>
             </div>
          )}

          <div style={{ position: 'absolute', inset: 0, opacity: activeTab === 'TRIAGE' ? 1 : 0, pointerEvents: activeTab === 'TRIAGE' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TriagePhaseUI isEmbedded={true} />
          </div>
          
          <div style={{ position: 'absolute', inset: 0, opacity: activeTab === 'TREATMENT' ? 1 : 0, pointerEvents: activeTab === 'TREATMENT' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TreatmentUI isEmbedded={true} />
          </div>

          <div style={{ position: 'absolute', inset: 0, opacity: activeTab === 'TRANSPORT' ? 1 : 0, pointerEvents: activeTab === 'TRANSPORT' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TransportUI isEmbedded={true} />
          </div>
        </div>
      </main>
    </div>
  );
}
