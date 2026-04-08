import React from 'react';
import { User, LocateFixed, HeartPulse, Truck, Flag, Ambulance } from 'lucide-react';

const ASSET_ICONS = {
  action_icp: { icon: <Flag size={20} />, color: '#00ccff', label: 'ICP 指揮站' },
  action_setup_treatment: { icon: <HeartPulse size={20} />, color: '#ff3333', label: '救護處置區' },
  action_setup_staging: { icon: <Truck size={20} />, color: '#ffcc00', label: '車輛集結區' }
};

export default function IntegratedMap({ 
  gameStateData, 
  selectedPatientId, 
  onPatientSelect, 
  onMapClick, 
  showPatients = true 
}) {
  const { patients, tacticalAssets, currentScenario, vehicles } = gameStateData;

  return (
    <div 
      onClick={(e) => {
        if (onMapClick) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          onMapClick({ x, y });
        }
      }}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        backgroundColor: 'rgba(5,5,10,0.9)',
        backgroundImage: `url(${currentScenario?.bgImage || '/bg_collapse.png'})`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'screen',
        cursor: onMapClick ? 'crosshair' : 'default'
      }}
    >
      {/* Grid Overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,204,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,204,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.6rem', color: 'rgba(0,255,150,0.3)', fontWeight: 'bold', letterSpacing: '2px' }}>TACTICAL BOARD VIEW</div>

      {/* Vehicles Layer (Ambulances at Staging/Right-Bottom) */}
      {vehicles && vehicles.filter(v => !v.departed).map(v => (
        <div
            key={`veh-${v.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onVehicleClick) onVehicleClick(v.id);
            }}
            style={{
              position: 'absolute', top: `${v.y}%`, left: `${v.x}%`,
              transform: 'translate(-50%, -50%)',
              color: '#00ffcc',
              cursor: 'pointer',
              zIndex: 45,
              animation: 'pulse 3s infinite',
              filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.6))'
            }}
            title={v.name}
        >
          <Ambulance size={24} />
          <div style={{ fontSize: '0.5rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '0 2px' }}>{v.id}</div>
        </div>
      ))}

      {/* Tactical Assets Layer (Stamps) */}
      {tacticalAssets && tacticalAssets.map((asset, idx) => {
        const config = ASSET_ICONS[asset.type] || { icon: <LocateFixed size={20} />, color: '#fff', label: '未定義資產' };
        return (
          <div
            key={`asset-${idx}`}
            style={{
              position: 'absolute', top: `${asset.y}%`, left: `${asset.x}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              zIndex: 50, pointerEvents: 'none'
            }}
          >
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: `2px solid ${config.color}`,
              borderRadius: '50%', padding: '6px',
              color: config.color,
              boxShadow: `0 0 15px ${config.color}80`,
              animation: 'pulse 2s infinite'
            }}>
              {config.icon}
            </div>
            <div style={{ 
              fontSize: '0.65rem', fontWeight: 'bold', color: '#fff', 
              backgroundColor: 'rgba(0,0,0,0.7)', padding: '1px 6px', 
              borderRadius: '3px', whiteSpace: 'nowrap',
              textShadow: `0 0 5px ${config.color}`
            }}>
              {config.label}
            </div>
          </div>
        );
      })}

      {/* Patients Layer */}
      {showPatients && patients.map(patient => {
        const isSel = selectedPatientId === patient.id;
        const isTransported = patient.transported;
        
        let dotColor = 'rgba(200,200,200,0.2)';
        if (patient.status === 'red') dotColor = '#cc1111';
        if (patient.status === 'yellow') dotColor = '#d4a000';
        if (patient.status === 'green') dotColor = '#006e2e';
        if (patient.status === 'black') dotColor = '#333';
        
        return (
          <div
            key={patient.id}
            onClick={(e) => {
              if (isTransported) return;
              e.stopPropagation();
              if (onPatientSelect) onPatientSelect(patient.id);
            }}
            style={{
              position: 'absolute', top: `${patient.y}%`, left: `${patient.x}%`,
              transform: `translate(-50%,-50%) rotate(-45deg) ${isSel ? 'scale(1.2)' : ''}`,
              width: isSel ? '40px' : '32px', height: isSel ? '40px' : '32px',
              backgroundColor: isTransported ? 'transparent' : dotColor,
              border: isTransported ? `3px dashed ${dotColor}` : (isSel ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)'),
              borderRadius: '50% 50% 50% 0',
              cursor: isTransported ? 'default' : 'pointer',
              boxShadow: isTransported ? 'none' : (isSel ? '0 0 14px rgba(255,255,255,0.5)' : `0 0 6px ${dotColor}80`),
              transition: 'all 0.2s',
              animation: (patient.status === 'unknown' && !isTransported) ? 'pulse 2s infinite' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: isTransported ? 30 : 40,
              opacity: isTransported ? 0.6 : 1
            }}
          >
            {!isTransported && <User size={14} color="#fff" style={{ transform: 'rotate(45deg)' }} />}
          </div>
        );
      })}
    </div>
  );
}
