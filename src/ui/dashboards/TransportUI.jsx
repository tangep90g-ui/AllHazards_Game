import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';
import { Ambulance, Users } from 'lucide-react';

export default function TransportUI({ isEmbedded }) {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useEffect(() => {
    const onStateUpdate = (newState) => setGameStateData(newState);
    globalEvents.on('STATE_UPDATE', onStateUpdate);
    return () => globalEvents.off('STATE_UPDATE', onStateUpdate);
  }, []);

  const { patients, vehicles } = gameStateData;

  const handlePatientSelect = (id) => setSelectedPatientId(id);
  const handleAssignToVehicle = (vehicleId) => {
    if (!selectedPatientId) return;
    gameState.assignPatientToVehicle(selectedPatientId, vehicleId);
    setSelectedPatientId(null);
  };
  
  const handleDepart = (vehicleId) => gameState.dispatchVehicle(vehicleId);

  const stagingPatients = patients.filter(p => !p.assignedVehicleId && p.status !== 'unknown');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#09090f' }}>
      
      {/* Header */}
      <div style={{ padding: '0.8rem', backgroundColor: '#0d0d18', borderBottom: '1px solid #1e2e2e', flexShrink: 0 }}>
        <h3 style={{ margin: 0, color: 'var(--color-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Ambulance size={16} /> 後送調度區
        </h3>
      </div>

      {/* Staging Area - Horizontal Scroll */}
      <div style={{ padding: '0.8rem', borderBottom: '1px solid #1a1a24', flexShrink: 0 }}>
        <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>待命後送病患 ({stagingPatients.length})</div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {stagingPatients.map(p => {
            const isSelected = selectedPatientId === p.id;
            let bg = p.status === 'red' ? 'var(--color-red)' : (p.status === 'yellow' ? 'var(--color-yellow)' : 'var(--color-green)');
            if (p.status === 'black') bg = '#333';

            return (
              <div key={p.id} onClick={() => handlePatientSelect(p.id)} style={{
                flexShrink: 0, padding: '0.5rem 0.8rem', borderRadius: '4px',
                backgroundColor: isSelected ? '#fff' : bg,
                color: isSelected ? '#000' : (p.status === 'yellow' ? '#000' : '#fff'),
                border: `1.5px solid ${isSelected ? '#0ff' : 'transparent'}`,
                cursor: 'pointer', fontSize: '0.75rem', textAlign: 'center', transition: 'all 0.1s'
              }}>
                <div style={{ fontWeight: '900' }}>#{p.id}</div>
                <div style={{ fontSize: '0.6rem' }}>{p.status.toUpperCase()}</div>
              </div>
            );
          })}
          {stagingPatients.length === 0 && <div style={{ fontSize: '0.7rem', color: '#333', fontStyle: 'italic' }}>目前無待運送病患</div>}
        </div>
      </div>

      {/* Vehicles List - Vertical Stack */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>抵達救護車輛</div>
        
        {vehicles.filter(v => !v.departed).map(v => (
          <div key={v.id} style={{ 
            padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00ffcc' }}>{v.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>{v.loadedPatients.length}/{v.capacity}</div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {Array.from({ length: v.capacity }).map((_, idx) => {
                const pid = v.loadedPatients[idx];
                const p = patients.find(x => x.id === pid);
                return (
                  <div key={idx} 
                    onClick={() => !p && handleAssignToVehicle(v.id)}
                    style={{
                      flex: 1, height: '30px', borderRadius: '4px',
                      border: p ? 'none' : '1px dashed #444',
                      backgroundColor: p ? (p.status === 'red' ? 'var(--color-red)' : (p.status === 'yellow' ? 'var(--color-yellow)' : 'var(--color-green)')) : (selectedPatientId ? 'rgba(0, 255, 204, 0.1)' : 'transparent'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !p && selectedPatientId ? 'pointer' : 'default'
                    }}
                  >
                    {p ? <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: p.status === 'yellow' ? '#000' : '#fff' }}>#{p.id}</span> : (selectedPatientId ? <span style={{ fontSize: '0.6rem', color: '#00ffcc' }}>掛載</span> : null)}
                  </div>
                );
              })}
            </div>

            <button 
              disabled={v.loadedPatients.length === 0}
              onClick={() => handleDepart(v.id)}
              style={{
                width: '100%', padding: '0.5rem', borderRadius: '4px',
                backgroundColor: v.loadedPatients.length === 0 ? '#1a1a1a' : 'var(--color-green)',
                color: '#000', border: 'none', fontWeight: 'bold', fontSize: '0.8rem',
                cursor: v.loadedPatients.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              發車 (DEPART)
            </button>
          </div>
        ))}
        {vehicles.filter(v => !v.departed).length === 0 && <div style={{ textAlign: 'center', color: '#333', fontSize: '0.75rem', padding: '1rem' }}>等待支援救護車抵達中...</div>}
      </div>
    </div>
  );
}
