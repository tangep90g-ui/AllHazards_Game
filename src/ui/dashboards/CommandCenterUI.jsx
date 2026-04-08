import React, { useState, useEffect, useMemo } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { LayoutDashboard, CheckSquare, Clock, ShieldAlert, HeartPulse, Ambulance, Terminal, Timer, Bell } from 'lucide-react';
import expectedActionsData from '../../assets/data/expected_actions.json';

import TriagePhaseUI from './TriagePhaseUI';
import TransportUI from './TransportUI';
import TreatmentUI from './TreatmentUI';
import FloatingAction from '../components/FloatingAction';

export default function CommandCenterUI() {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [activeTab, setActiveTab] = useState('TRIAGE');
  const [completedActions, setCompletedActions] = useState({});
  const [pendingPlacementAction, setPendingPlacementAction] = useState(null);
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  const getSkillPos = (id) => {
    // Vertically aligned on the left, starting lower to avoid nav overlap
    const mapping = {
        'action_megaphone': { x: 3, y: 25 }, 
        'action_hospital_comms': { x: 3, y: 50 },
        'action_request_als': { x: 3, y: 75 }
    };
    return mapping[id] || { x: 3, y: 85 };
  };

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
      setCompletedActions(newState.actionChecklist || {});
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { score, timeLeft, patients, skillsCooldown } = gameStateData;

  // Filter skills that are already displayed as floating buttons
  const floatingSkillIds = ['action_megaphone', 'action_hospital_comms', 'action_request_als'];

  const activeTasks = useMemo(() => {
    return expectedActionsData
      .map(action => {
        const [maxT, minT] = action.recommendedTimeWindow;
        const isCompleted = !!completedActions[action.id];
        const isCurrentWindow = !isCompleted && (timeLeft <= maxT && timeLeft >= minT);
        return { ...action, isCurrentWindow, isCompleted };
      })
      .filter(a => a.isCurrentWindow && !floatingSkillIds.includes(a.id));
  }, [timeLeft, completedActions]);

  // Auto-show tasks when they become active
  useEffect(() => {
    if (activeTasks.length > 0) {
      setShowTaskPopup(true);
    } else {
      setShowTaskPopup(false);
    }
  }, [activeTasks.length]);

  const handleActionClick = (id) => {
    const action = expectedActionsData.find(a => a.id === id);
    if (!action || completedActions[id]) return;
    
    if (action.requiresPlacement) {
        setPendingPlacementAction(action);
    } else {
        gameState.processActionChecklist(id);
    }
    
    if (activeTasks.length <= 1) setShowTaskPopup(false);
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
    gameState.processActionChecklist(pendingPlacementAction.id, placementBonus, { x, y });
    setPendingPlacementAction(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-dark)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Floating Skills Layout (Only visible in TRIAGE tab, avoiding START panel) */}
      <div style={{ 
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2000,
        opacity: (activeTab === 'TRIAGE' && !pendingPlacementAction) ? 1 : 0,
        transition: 'opacity 0.2s'
      }}>
        {activeTab === 'TRIAGE' && floatingSkillIds.map(id => {
           const actionInfo = expectedActionsData.find(a => a.id === id);
           const time = skillsCooldown[id] || 0;
           const pos = getSkillPos(id);
           return (
             <FloatingAction 
               key={id} 
               id={id} 
               title={actionInfo?.title || 'SKILL'} 
               timeLeft={time} 
               onExecute={() => handleActionClick(id)}
               initialX={pos.x}
               initialY={pos.y}
             />
           );
        })}
      </div>

      {/* Task Popup Overlay (Disappears after action or when map modal is active) */}
      {showTaskPopup && activeTasks.length > 0 && !pendingPlacementAction && (
        <div style={{ 
          position: 'absolute', 
          top: '20%', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 3000, 
          width: '90%', 
          maxWidth: '400px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div className="glass-panel" style={{ padding: '1.2rem', border: '2px solid var(--color-yellow)', backgroundColor: 'rgba(20, 20, 30, 0.95)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-yellow)', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,204,0,0.2)', paddingBottom: '0.5rem' }}>
                <Bell size={20} />
                <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>緊急指揮任務 (URGENT TASK)</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {activeTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                       <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.2rem' }}>時效獎勵: +{task.bonus}</div>
                    </div>
                    <button 
                      onClick={() => handleActionClick(task.id)}
                      style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--color-yellow)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      立即執行
                    </button>
                  </div>
                ))}
             </div>
             <button onClick={() => setShowTaskPopup(false)} style={{ width: '100%', marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid #444', color: '#888', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>暫時關閉</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Global Control Header (Responsive) */}
        <header style={{ 
          backgroundColor: 'rgba(10, 10, 15, 0.95)', 
          borderBottom: '1px solid var(--border-neon)', 
          padding: '0 1rem', 
          height: 'var(--header-h)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          zIndex: 10,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <Terminal size={18} color="#0ff" />
             <div>
               <h1 style={{ margin: 0, fontSize: '0.8rem', color: '#0ff', letterSpacing: '1px' }}>COMMAND POST</h1>
               <div style={{ fontSize: '0.55rem', color: '#555' }}>{gameStateData.currentScenario?.title || 'Unknown'}</div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-red)', fontFamily: 'monospace' }}>
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-yellow)' }}>
                 {score.toLocaleString()}
               </div>
             </div>
          </div>
        </header>

        {/* Tab Navigation (Responsive Icon Based) */}
        <nav style={{ display: 'flex', backgroundColor: '#111', borderBottom: '1px solid var(--border-neon)', height: 'var(--nav-h)', flexShrink: 0 }}>
          {[
            { id: 'TRIAGE', icon: <ShieldAlert size={18} />, label: '檢傷' },
            { id: 'TREATMENT', icon: <HeartPulse size={18} />, label: '急救' },
            { id: 'TRANSPORT', icon: <Ambulance size={18} />, label: '調度' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0 0.2rem',
                backgroundColor: activeTab === tab.id ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-green)' : 'var(--text-dim)',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-green)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, position: 'relative', overflow: activeTab === 'TRIAGE' ? 'hidden' : 'auto' }}>
          {/* Overarching Placement Map Modal */}
          {pendingPlacementAction && (
             <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1rem', overflowY: 'auto' }}>
               <div className="glass-panel" style={{ padding: '1rem', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginBottom: '2rem' }}>
                 <h3 style={{ color: '#00ffcc', marginBottom: '1rem', fontSize: '1rem', textAlign: 'center' }}>請在下方戰術地圖標示【{pendingPlacementAction.title}】</h3>
                 <div 
                   onClick={handleMapPlacement}
                   style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', cursor: 'crosshair', border: '1px solid #444' }}
                 >
                   <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,10,0.85)', backgroundImage: `url(${gameStateData.currentScenario?.bgImage || '/bg_collapse.png'}), radial-gradient(circle at center, rgba(0,255,0,0.05) 0%, transparent 80%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`, backgroundBendMode: 'screen', backgroundSize: 'cover, 40px 40px, 40px 40px', backgroundPosition: 'center' }} />
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', borderRadius: '50%', border: '1px dashed var(--color-yellow)', backgroundColor: 'rgba(255, 204, 0, 0.05)' }}></div>
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', height: '30%', borderRadius: '50%', border: '1px dashed var(--color-red)', backgroundColor: 'rgba(255, 0, 0, 0.1)' }}></div>

                   {/* Tactical Intel Sync */}
                   {(gameStateData.tacticalAssets || []).map((asset, idx) => {
                      const color = (asset.type === 'ICP' || asset.type === 'action_icp') ? '#00ffcc' : (asset.type.includes('treatment') ? 'var(--color-yellow)' : '#fff');
                      return (
                        <div key={`modal-asset-${idx}`} style={{
                          position: 'absolute', top: `${asset.y}%`, left: `${asset.x}%`,
                          width: '12px', height: '12px', borderRadius: '50%', 
                          backgroundColor: 'rgba(0,0,0,0.85)', border: `1.5px solid ${color}`,
                          transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          zIndex: 10
                        }}>
                          <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: color }} />
                        </div>
                      );
                   })}
                 </div>
                 <button onClick={() => setPendingPlacementAction(null)} style={{ marginTop: '1rem', padding: '0.5rem 2rem', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
               </div>
             </div>
          )}

          <div style={{ position: 'absolute', inset: 0, opacity: activeTab === 'TRIAGE' ? 1 : 0, pointerEvents: activeTab === 'TRIAGE' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TriagePhaseUI isEmbedded={true} />
          </div>
          
          <div style={{ position: activeTab === 'TREATMENT' ? 'relative' : 'absolute', inset: 0, opacity: activeTab === 'TREATMENT' ? 1 : 0, pointerEvents: activeTab === 'TREATMENT' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TreatmentUI isEmbedded={true} />
          </div>

          <div style={{ position: activeTab === 'TRANSPORT' ? 'relative' : 'absolute', inset: 0, opacity: activeTab === 'TRANSPORT' ? 1 : 0, pointerEvents: activeTab === 'TRANSPORT' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <TransportUI isEmbedded={true} />
          </div>
        </div>
      </main>
      
      {/* Animation Styles */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -60%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}
