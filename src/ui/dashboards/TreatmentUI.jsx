import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { HeartPulse, Stethoscope, Activity, ShieldCheck } from 'lucide-react';

export default function TreatmentUI({ isEmbedded }) {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [selectedEmtId, setSelectedEmtId] = useState(null);

  useEffect(() => {
    const onStateUpdate = (newState) => setGameStateData(newState);
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { patients, emts } = gameStateData;

  const handleEmtClick = (emtId) => {
    const emt = emts.find(e => e.id === emtId);
    if (emt.status === 'busy') {
       gameState.unassignEmt(emtId);
       setSelectedEmtId(null);
    } else {
       setSelectedEmtId(emtId === selectedEmtId ? null : emtId);
    }
  };

  const handlePatientClick = (patientId) => {
    if (selectedEmtId) {
       gameState.assignEmt(selectedEmtId, patientId);
       setSelectedEmtId(null);
    }
  };

  const activePatients = patients.filter(p => 
      (p.status === 'red' || p.status === 'yellow') && !p.assignedVehicleId
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#09090f' }}>
      
      {/* Header */}
      <div style={{ padding: '0.8rem', backgroundColor: '#0d0d18', borderBottom: '1px solid #1e2e2e', flexShrink: 0 }}>
        <h3 style={{ margin: 0, color: 'var(--color-yellow)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartPulse size={16} /> 急救處置區
        </h3>
      </div>

      {/* EMT Pool - Compact Horizontal Scroll */}
      <div style={{ padding: '0.8rem', borderBottom: '1px solid #1a1a24', flexShrink: 0 }}>
        <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>醫療人力資源</div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {emts.map(emt => {
            const isSelected = selectedEmtId === emt.id;
            const isBusy = emt.status === 'busy';
            return (
              <div key={emt.id} onClick={() => handleEmtClick(emt.id)} style={{
                flexShrink: 0, padding: '0.5rem 0.8rem', borderRadius: '4px',
                backgroundColor: isBusy ? '#1a1a1a' : (isSelected ? 'var(--color-yellow)' : '#111'),
                color: isBusy ? '#444' : (isSelected ? '#000' : '#fff'),
                border: `1px solid ${isSelected ? '#fff' : '#333'}`,
                cursor: 'pointer', fontSize: '0.75rem', textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold' }}>{emt.id}</div>
                <div style={{ fontSize: '0.6rem' }}>{isBusy ? '處置中' : '待命'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patients List - Vertical Stack */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>待處理傷患 ({activePatients.length})</div>
        {activePatients.length === 0 && <div style={{ color: '#333', fontSize: '0.75rem', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>目前無待處置重傷患</div>}
        
        {activePatients.map(p => {
          const hp = p.hp !== undefined ? p.hp : 100;
          const isBeingTreated = emts.some(e => e.patientId === p.id);
          let borderColor = p.isStabilized ? 'var(--color-green)' : (p.status === 'red' ? 'var(--color-red)' : 'var(--color-yellow)');
          
          return (
            <div key={p.id} onClick={() => handlePatientClick(p.id)} style={{
              padding: '0.8rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${isBeingTreated ? 'var(--color-yellow)' : borderColor}`,
              opacity: p.hp <= 0 ? 0.4 : 1, position: 'relative', cursor: selectedEmtId ? 'pointer' : 'default'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>病患 #{p.id}</span>
                {isBeingTreated && <Activity size={12} color="var(--color-yellow)" className="pulse" />}
                {p.isStabilized && <ShieldCheck size={14} color="var(--color-green)" />}
              </div>
              
              <div style={{ width: '100%', height: '4px', backgroundColor: '#111', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${hp}%`, height: '100%', 
                  backgroundColor: p.isStabilized ? 'var(--color-green)' : (hp < 30 ? 'var(--color-red)' : 'var(--color-yellow)'),
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.6rem', color: '#555' }}>生命跡象</span>
                <span style={{ fontSize: '0.6rem', color: '#888' }}>{Math.floor(hp)}%</span>
              </div>

              {selectedEmtId && !p.isStabilized && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,204,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-yellow)' }}>
                  點擊指派人力
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
