import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { HeartPulse, Stethoscope, Activity, Skull, ShieldCheck } from 'lucide-react';

export default function TreatmentUI({ isEmbedded }) {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [selectedEmtId, setSelectedEmtId] = useState(null);

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { patients, emts, score } = gameStateData;

  const handleEmtClick = (emtId) => {
    const emt = emts.find(e => e.id === emtId);
    if (emt.status === 'busy') {
       gameState.unassignEmt(emtId); // Allow pulling an EMT off a patient manually
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

  // Only show patients that have been triaged (red/yellow), are not dead, and have not yet departed on transport
  const activePatients = patients.filter(p => 
      (p.status === 'red' || p.status === 'yellow') && 
      !p.assignedVehicleId
  );

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header Info */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
         <div>
            <h2 style={{ margin: 0, color: 'var(--color-yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse size={24} /> 傷患處置區 (TREATMENT AREA)
            </h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>
               指派醫療人力 (EMT) 極力穩住紅卡與黃卡傷患的生命值。ALS 穩定的速度大幅優於 BLS。
               <br/>請注意：病患生命值一旦歸零將死亡，導致嚴重扣分。
            </p>
         </div>
      </div>

      {/* Resource Pool (EMTs) */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', marginBottom: '2rem' }}>
         <h3 style={{ margin: '0 0 1rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Stethoscope size={18}/> 可派發急救人力資源</h3>
         <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {emts.map(emt => {
               const isSelected = selectedEmtId === emt.id;
               const isBusy = emt.status === 'busy';
               return (
                  <button
                    key={emt.id}
                    onClick={() => handleEmtClick(emt.id)}
                    style={{
                       display: 'flex', alignItems: 'center', gap: '0.5rem',
                       padding: '0.8rem 1.5rem',
                       backgroundColor: isBusy ? '#333' : (isSelected ? 'var(--color-yellow)' : '#1a1a24'),
                       color: isBusy ? '#888' : (isSelected ? '#000' : '#fff'),
                       border: isSelected ? '2px solid #fff' : '2px solid #444',
                       borderRadius: '8px',
                       cursor: 'pointer',
                       fontWeight: 'bold',
                       transition: 'all 0.2s',
                       opacity: isBusy ? 0.7 : 1
                    }}
                  >
                     <Activity size={18} />
                     <div>
                       <div>{emt.id}</div>
                       <div style={{ fontSize: '0.7rem', color: isBusy? '#888': (isSelected? '#000': 'var(--text-dim)') }}>
                         {isBusy ? `處置著 #${emt.patientId}` : '待命中'}
                       </div>
                     </div>
                  </button>
               );
            })}
         </div>
      </div>

      {/* Patient Beds (The Challenge) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
         <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', color: 'white' }}>急救床位排程 ({activePatients.length} 人等候穩定)</h3>
         
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {activePatients.length === 0 && <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>目前無等候處置的傷患...趕緊去檢傷站(Hot Zone)分類吧。</div>}

            {activePatients.map(p => {
               const hp = p.hp !== undefined ? p.hp : 100;
               const isBeingTreated = emts.some(e => e.patientId === p.id);
               
               let borderColor = '#444';
               if (p.status === 'red') borderColor = 'var(--color-red)';
               if (p.status === 'yellow') borderColor = 'var(--color-yellow)';
               if (p.isStabilized) borderColor = 'var(--color-green)';

               const isDead = p.hp <= 0 && p.status === 'black'; // fallback catch

               return (
                  <div 
                     key={p.id}
                     onClick={() => !isDead && handlePatientClick(p.id)}
                     style={{
                        width: 'calc(33.333% - 1rem)', minWidth: '250px',
                        backgroundColor: 'rgba(20,20,30,0.8)',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '12px', padding: '1rem',
                        cursor: selectedEmtId && !p.isStabilized ? 'pointer' : 'default',
                        boxShadow: selectedEmtId && !p.isStabilized ? `0 0 15px ${borderColor}80` : 'none',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                     }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                           病患 #{p.id}
                           {p.status === 'red' && <span style={{ backgroundColor: 'var(--color-red)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>IMMEDIATE</span>}
                           {p.status === 'yellow' && <span style={{ backgroundColor: 'var(--color-yellow)', color: 'black', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>DELAYED</span>}
                        </div>
                        {isBeingTreated && <Activity size={20} color="var(--color-yellow)" style={{ animation: 'pulse 1s infinite' }} />}
                        {p.isStabilized && <ShieldCheck size={20} color="var(--color-green)" />}
                     </div>

                     {/* HP Bar */}
                     <div style={{ width: '100%', height: '12px', backgroundColor: '#222', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ 
                           width: `${hp}%`, height: '100%', 
                           backgroundColor: p.isStabilized ? 'var(--color-green)' : (hp < 30 ? 'var(--color-red)' : 'var(--color-yellow)'),
                           transition: 'width 0.5s linear, background-color 0.5s'
                        }} />
                     </div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>生命徵象穩定度: {Math.floor(hp)}%</div>

                     {/* Status Text Overlay */}
                     {p.isStabilized && (
                        <div style={{ marginTop: '1rem', color: 'var(--color-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           ✔ 已穩定，可移交【後送指揮區】
                        </div>
                     )}
                     {!p.isStabilized && !isBeingTreated && !isDead && (
                        <div style={{ marginTop: '1rem', color: 'var(--color-red)', fontWeight: 'bold', fontSize: '0.8rem', animation: hp < 50 ? 'pulse 1s infinite' : 'none' }}>
                           生命徵象持續流失中...
                        </div>
                     )}
                     {isBeingTreated && !p.isStabilized && (
                        <div style={{ marginTop: '1rem', color: 'var(--color-yellow)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                           EMT 急救處置中...
                        </div>
                     )}
                     
                     {/* Hover Overlay if EMT selected */}
                     {selectedEmtId && !p.isStabilized && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,204,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                           <span style={{ backgroundColor: '#000', color: 'var(--color-yellow)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>指派 EMT 進行處置</span>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
