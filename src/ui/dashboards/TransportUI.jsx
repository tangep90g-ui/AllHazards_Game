import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { Ambulance, ShieldAlert, Timer, Users } from 'lucide-react';

export default function TransportUI({ isEmbedded }) {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useEffect(() => {
    const onStateUpdate = (newState) => {
      setGameStateData(newState);
    };
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { patients, vehicles } = gameStateData;

  const handlePatientSelect = (id) => {
    setSelectedPatientId(id);
  };

  const handleAssignToVehicle = (vehicleId) => {
    if (!selectedPatientId) return;
    gameState.assignPatientToVehicle(selectedPatientId, vehicleId);
    setSelectedPatientId(null); // Reset selection
  };
  
  const handleDepart = (vehicleId) => {
    gameState.dispatchVehicle(vehicleId);
  }

  // Group patients by triage state for the staging area
  const stagingPatients = patients.filter(p => !p.assignedVehicleId && p.status !== 'unknown');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', backgroundColor: 'var(--bg-dark)' }}>


      {/* Main UI layout: Split 50/50 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Staging Area */}
        <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid var(--border-neon)', overflowY: 'auto' }}>
          <h2 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}><Users /> 傷患集結區 (Staging Area)</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>請點選要後送的病患，再點選右側救護車空位進行登車。</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {stagingPatients.map(p => {
              let bg = '#333';
              if (p.status === 'red') bg = 'var(--color-red)';
              if (p.status === 'yellow') bg = 'var(--color-yellow)';
              if (p.status === 'green') bg = 'var(--color-green)';
              if (p.status === 'black') bg = '#111';

              const isSelected = selectedPatientId === p.id;
              
              return (
                <div 
                  key={p.id}
                  onClick={() => handlePatientSelect(p.id)}
                  style={{
                    backgroundColor: bg,
                    color: p.status === 'yellow' ? '#000' : '#fff',
                    padding: '1rem',
                    borderRadius: '8px',
                    width: '120px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 4px #00ffcc' : 'none',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.1s'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>病患 #{p.id}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>狀態: {p.status.toUpperCase()}</div>
                </div>
              );
            })}
            
            {stagingPatients.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '2rem' }}>目前無等待後送的病患。</div>
            )}
          </div>
        </div>

        {/* Right Side: Ambulances pool */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <h2 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}><Ambulance /> 抵達滿載區 (Loading Zone)</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>救護車將持續抵達，請注意車輛容量上限。</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {vehicles.filter(v => !v.departed).map(v => (
              <div key={v.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}><Ambulance style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> {v.name}</div>
                  <div style={{ color: 'var(--text-dim)' }}>容量: {v.loadedPatients.length} / {v.capacity}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${v.capacity}, 1fr)`, gap: '1rem', marginBottom: '1rem' }}>
                  {Array.from({ length: v.capacity }).map((_, index) => {
                    const loadedP = patients.find(p => p.id === v.loadedPatients[index]);
                    
                    if (loadedP) {
                      // Slot occupied
                      let bg = '#333';
                      if (loadedP.status === 'red') bg = 'var(--color-red)';
                      if (loadedP.status === 'yellow') bg = 'var(--color-yellow)';
                      if (loadedP.status === 'green') bg = 'var(--color-green)';
                      
                      return (
                        <div key={index} style={{ backgroundColor: bg, color: loadedP.status === 'yellow' ? '#000' : '#fff', padding: '1rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                          病患 #{loadedP.id}
                        </div>
                      );
                    } else {
                      // Empty Slot
                      return (
                        <div 
                          key={index} 
                          onClick={() => handleAssignToVehicle(v.id)}
                          style={{ border: '2px dashed rgba(255,255,255,0.3)', padding: '1rem', borderRadius: '4px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', cursor: selectedPatientId ? 'pointer' : 'default', backgroundColor: selectedPatientId ? 'rgba(0, 255, 204, 0.1)' : 'transparent' }}
                        >
                          {selectedPatientId ? '點擊載入' : '空位'}
                        </div>
                      );
                    }
                  })}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <button 
                    disabled={v.loadedPatients.length === 0}
                    onClick={() => handleDepart(v.id)}
                    style={{ padding: '0.8rem 2rem', backgroundColor: v.loadedPatients.length === 0 ? '#333' : '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: v.loadedPatients.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    發車前往醫院 (DEPART)
                  </button>
                </div>
              </div>
            ))}
            
            {vehicles.filter(v => !v.departed).length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
                <Ambulance size={40} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <div>目前無閒置的救護車輛，等待支援抵達...</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
