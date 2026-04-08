import React, { useState, useEffect, useRef } from 'react';
import { User, ScanEye, RadioTower, HeartPulse, Ambulance, ShieldAlert, ChevronRight, ChevronLeft, Search, ZoomIn, ZoomOut } from 'lucide-react';

import { gameState } from '../../core/StateManager';
import { globalEvents } from '../../core/EventSystem';

// Compact SVG Human Body
function HumanBodySVG({ scannedParts, onHover }) {
  const zoneStyle = (part) => ({
    fill: scannedParts[part] >= 100 ? 'rgba(0,255,150,0.35)' : 'rgba(255,255,255,0.06)',
    stroke: scannedParts[part] >= 100 ? '#00ff96' : '#555',
    strokeWidth: 1.5,
    cursor: 'crosshair',
    transition: 'fill 0.3s',
    pointerEvents: 'auto',
  });

  const handleTouch = (e, part) => {
    // Only trigger if mouse or touch is active
    if (e.buttons > 0 || e.type.includes('touch')) {
        onHover(part);
    }
  };

  return (
    <svg viewBox="0 0 90 200" width="90" height="200" style={{ display: 'block', flexShrink: 0 }}>
      {/* Head */}
      <ellipse cx="45" cy="17" rx="14" ry="15" {...zoneStyle('head')} onMouseMove={(e) => handleTouch(e, 'head')} onTouchMove={(e) => handleTouch(e, 'head')} />
      {/* Torso */}
      <rect x="24" y="39" width="42" height="60" rx="6" {...zoneStyle('chest')} onMouseMove={(e) => handleTouch(e, 'chest')} onTouchMove={(e) => handleTouch(e, 'chest')} />
      {/* Hand zones */}
      <ellipse cx="16" cy="91" rx="8" ry="10" {...zoneStyle('hand')} onMouseMove={(e) => handleTouch(e, 'hand')} onTouchMove={(e) => handleTouch(e, 'hand')} />
      <ellipse cx="74" cy="91" rx="8" ry="10" {...zoneStyle('hand')} onMouseMove={(e) => handleTouch(e, 'hand')} onTouchMove={(e) => handleTouch(e, 'hand')} />
      {/* Pelvis */}
      <rect x="24" y="99" width="42" height="18" rx="4" fill="rgba(255,255,255,0.04)" stroke="#444" strokeWidth={1} />
      {/* Left Leg */}
      <rect x="24" y="117" width="18" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#444" strokeWidth={1} />
      {/* Right Leg */}
      <rect x="48" y="117" width="18" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#444" strokeWidth={1} />

      {/* Labels */}
      <text x="45" y="14" textAnchor="middle" fontSize="6" fill={scannedParts.head >= 100 ? '#00ff96' : '#777'}>意識</text>
      <text x="45" y="68" textAnchor="middle" fontSize="6" fill={scannedParts.chest >= 100 ? '#00ff96' : '#777'}>呼吸</text>
      <text x="16" y="103" textAnchor="middle" fontSize="5.5" fill={scannedParts.hand >= 100 ? '#00ff96' : '#777'}>末梢</text>
      <text x="74" y="103" textAnchor="middle" fontSize="5.5" fill={scannedParts.hand >= 100 ? '#00ff96' : '#777'}>充填</text>
    </svg>
  );
}

// Triage strip button
function TriageStrip({ color, symbol, label, onClick, disabled }) {
  const bg = { black: '#111', red: '#cc1111', yellow: '#d4a000', green: '#006e2e' };
  const tc = color === 'yellow' ? '#000' : '#fff';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem',
        width: '100%', padding: '0.45rem 0.8rem',
        backgroundColor: disabled ? 'rgba(60,60,60,0.3)' : bg[color],
        border: `1.5px solid ${disabled ? '#2a2a2a' : bg[color]}`,
        borderRadius: '3px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1, transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: '900', color: tc, minWidth: '1.5rem', fontFamily: 'monospace' }}>{symbol}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: tc, letterSpacing: '1px' }}>{label}</span>
    </button>
  );
}

// Inline scan row: shows result value immediately when that part hits 100%
function ScanRow({ icon, label, progress, value, status, symptom }) {
  const done = progress >= 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', opacity: done ? 1 : 0.3 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: 'bold' }}>{label}</span>
            <span style={{ fontSize: '0.65rem', color: done ? '#00ffcc' : '#444' }}>{done ? '完成' : `${progress}%`}</span>
          </div>
          <div style={{ height: '3px', backgroundColor: '#1a1a2a', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: done ? '#00ff96' : '#e6a800', transition: 'width 0.2s' }} />
          </div>
        </div>
      </div>
      
      {done && (
        <div style={{ marginLeft: '1.4rem', marginTop: '2px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{value}</span>
          <span style={{ fontSize: '0.7rem', color: status?.startsWith('🟢') ? '#00ff96' : status?.startsWith('🟡') ? '#ffcc00' : '#ff4444' }}>
            {status}
          </span>
          {symptom && (
            <div style={{ 
              width: '100%', 
              marginTop: '2px', 
              fontSize: '0.7rem', 
              color: '#ffcc00', 
              backgroundColor: 'rgba(255, 204, 0, 0.1)', 
              padding: '2px 6px', 
              borderRadius: '3px',
              borderLeft: '2px solid #ffcc00',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⚠</span> {symptom}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TriagePhaseUI() {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [scan, setScan] = useState({ head: 0, chest: 0, hand: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 950);
  
  // Tactical Map Transform States
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState(null);
  const mapViewportRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const checkRes = () => { if (window.innerWidth <= 950) setIsSidebarOpen(false); else setIsSidebarOpen(true); };
    window.addEventListener('resize', checkRes);
    return () => window.removeEventListener('resize', checkRes);
  }, []);

  // Auto-open sidebar when a patient is selected for the first time or if collapsed
  useEffect(() => {
    if (selectedPatientId && window.innerWidth <= 950) {
      setIsSidebarOpen(true);
    }
  }, [selectedPatientId]);

  // Auto-focus sidebar to top on selection
  useEffect(() => {
    if (selectedPatientId && sidebarRef.current) {
        sidebarRef.current.scrollTop = 0;
    }
  }, [selectedPatientId]);

  useEffect(() => {
    const onState = (s) => setGameStateData(s);
    const onOk = () => { setFeedbackMsg({ text: '✓ 判定正確 +100', c: '#00ff96' }); setTimeout(() => setFeedbackMsg(null), 2000); };
    const onErr = () => { setFeedbackMsg({ text: '✗ 判定錯誤 -50', c: '#ff4444' }); setTimeout(() => setFeedbackMsg(null), 2000); };
    const onEvt = (d) => { setFeedbackMsg({ text: `🚨 ${d.name}: ${d.description}`, c: '#ff6600' }); setTimeout(() => setFeedbackMsg(null), 5000); };
    globalEvents.on('STATE_UPDATE', onState);
    globalEvents.on('TRIAGE_CORRECT', onOk);
    globalEvents.on('TRIAGE_INCORRECT', onErr);
    globalEvents.on('INCIDENT_EVENT', onEvt);
    return () => {
      globalEvents.off('STATE_UPDATE', onState);
      globalEvents.off('TRIAGE_CORRECT', onOk);
      globalEvents.off('TRIAGE_INCORRECT', onErr);
      globalEvents.off('INCIDENT_EVENT', onEvt);
    };
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    const p = gameStateData.patients.find(x => x.id === selectedPatientId);
    setScan(p && p.status !== 'unknown' ? { head: 100, chest: 100, hand: 100 } : { head: 0, chest: 0, hand: 0 });
  }, [selectedPatientId]);

  const handleScan = (part) => setScan(prev => ({ ...prev, [part]: Math.min(100, prev[part] + 18) }));
  const handleTriage = (color) => {
    if (!selectedPatientId || !anyScanned) return;
    gameState.processTriage(selectedPatientId, color);
    setSelectedPatientId(null);
    setScan({ head: 0, chest: 0, hand: 0 });
  };

  const { patients } = gameStateData;
  const sel = patients.find(p => p.id === selectedPatientId);
  // Unlock triage as soon as ANY zone reaches 100% (START allows walking = immediate green)
  const anyScanned = scan.head >= 100 || scan.chest >= 100 || scan.hand >= 100;
  const isScanned = scan.head >= 100 && scan.chest >= 100 && scan.hand >= 100;

  // Logic for refined row data
  const respData = sel ? {
    value: sel.vitals.resp === 0 ? '無呼吸' : `${sel.vitals.resp}/分`,
    status: sel.vitals.resp === 0 ? '🔴 停止' : sel.vitals.resp > 30 ? '🔴 過速' : '🟢 正常',
    symptom: sel.vitals.traumaSymptom
  } : null;

  const capData = sel ? {
    value: sel.vitals.crt === 0 ? '無法偵測' : `${sel.vitals.crt}s`,
    status: sel.vitals.crt === 0 ? '🔴 異常' : sel.vitals.crt > 2.0 ? '🔴 延遲 (>2s)' : '🟢 正常 (<2s)',
    symptom: null // CRT row usually doesn't need extra text if others have it
  } : null;

  const mentalData = sel ? {
    value: sel.vitals.mentalRaw === 'unconscious' ? '無反應' : '有反應',
    status: sel.vitals.mentalRaw === 'unconscious' ? '🔴 昏迷' : 
            sel.vitals.mentalRaw === 'confused_immobile' ? '🟡 意識混亂' : 
            sel.vitals.mentalRaw === 'obedient_immobile' ? '🟡 清醒/無法行走' : '🟢 清醒/能行走',
    symptom: sel.vitals.traumaSymptom
  } : null;

  // -- Map Interaction Handlers --
  const handleMapWheel = (e) => {
    if (selectedPatientId) return; // Prioritize UI interaction if patient is open
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setMapTransform(prev => ({
      ...prev,
      scale: Math.max(1, Math.min(3, prev.scale * delta))
    }));
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setLastTouch({ dist: d });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && lastTouch && !lastTouch.dist) {
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      setMapTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && lastTouch && lastTouch.dist) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = d / lastTouch.dist;
      setMapTransform(prev => ({
        ...prev,
        scale: Math.max(1, Math.min(3, prev.scale * delta))
      }));
      setLastTouch({ dist: d });
    }
  };

  const resetMap = () => setMapTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Toast */}
      {feedbackMsg && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.9)', border: `2px solid ${feedbackMsg.c}`,
          color: feedbackMsg.c, padding: '0.4rem 1.5rem', borderRadius: '4px',
          fontWeight: 'bold', fontSize: '0.9rem', zIndex: 999,
          boxShadow: `0 0 16px ${feedbackMsg.c}80`, maxWidth: '80%', textAlign: 'center'
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Map Viewport */}
      <div 
        ref={mapViewportRef}
        onWheel={handleMapWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { setIsDragging(false); setLastTouch(null); }}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          backgroundColor: '#05050a', cursor: isDragging ? 'grabbing' : 'crosshair'
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          backgroundImage: `url(${gameStateData.currentScenario?.bgImage || '/bg_collapse.png'})`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'screen'
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,204,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,204,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '0.6rem', color: 'rgba(0,255,150,0.5)', fontWeight: 'bold', letterSpacing: '2px' }}>■ 輕傷集結區</div>

          {/* Tactical Asset Markings */}
          {(gameStateData.tacticalAssets || []).map((asset, idx) => {
             let IconComp = ShieldAlert;
             let color = 'white';
             if (asset.type === 'ICP' || asset.type === 'action_icp') { IconComp = RadioTower; color = '#00ffcc'; }
             if (asset.type === 'TREATMENT' || asset.type === 'action_setup_treatment') { IconComp = HeartPulse; color = 'var(--color-yellow)'; }
             if (asset.type === 'STAGING' || asset.type === 'action_setup_staging') { IconComp = Ambulance; color = '#fff'; }
             
             return (
               <div key={`asset-${idx}`} style={{
                 position: 'absolute', top: `${asset.y}%`, left: `${asset.x}%`,
                 transform: 'translate(-50%, -50%)', zIndex: 5,
                 display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
               }}>
                 <div style={{ 
                   width: '28px', height: '28px', borderRadius: '50%', 
                   backgroundColor: 'rgba(0,0,0,0.85)', border: `1.5px solid ${color}`, 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   boxShadow: `0 0 10px ${color}60`
                 }}>
                   <IconComp size={16} color={color} />
                 </div>
                 <div style={{ 
                   fontSize: '0.55rem', color: color, fontWeight: 'bold', marginTop: '2px', 
                   backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' 
                 }}>
                   {asset.type.split('_').pop().toUpperCase()}
                 </div>
               </div>
             );
          })}

          {patients.map(patient => {
            const isSel = selectedPatientId === patient.id;
            let dotColor = 'rgba(200,200,200,0.2)';
            if (patient.status === 'red') dotColor = '#cc1111';
            if (patient.status === 'yellow') dotColor = '#d4a000';
            if (patient.status === 'green') dotColor = '#006e2e';
            if (patient.status === 'black') dotColor = '#333';
            return (
              <div
                key={patient.id}
                onClick={(e) => { e.stopPropagation(); setSelectedPatientId(patient.id); }}
                style={{
                  position: 'absolute', top: `${patient.y}%`, left: `${patient.x}%`,
                  transform: `translate(-50%,-50%) rotate(-45deg) ${isSel ? 'scale(1.2)' : ''}`,
                  width: isSel ? '40px' : '32px', height: isSel ? '40px' : '32px',
                  backgroundColor: dotColor,
                  border: isSel ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50% 50% 50% 0',
                  cursor: 'pointer',
                  boxShadow: isSel ? '0 0 14px rgba(255,255,255,0.5)' : `0 0 6px ${dotColor}80`,
                  transition: 'all 0.2s',
                  animation: patient.status === 'unknown' ? 'pulse 2s infinite' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: isSel ? 20 : 10
                }}
              >
                <User size={14} color="#fff" style={{ transform: 'rotate(45deg)' }} />
              </div>
            );
          })}
        </div>

        {/* Map Control Overlay */}
        <div style={{ position: 'absolute', bottom: '15px', left: '15px', display: 'flex', gap: '8px', zIndex: 100 }}>
          <button onClick={resetMap} className="glass-panel" style={{ padding: '8px', border: '1px solid var(--border-neon)', color: '#0ff', backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}>
            <Search size={16} />
          </button>
          <button onClick={() => setMapTransform(prev => ({...prev, scale: Math.min(3, prev.scale + 0.2)}))} className="glass-panel" style={{ padding: '8px', border: '1px solid var(--border-neon)', color: '#0ff', backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}>
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setMapTransform(prev => ({...prev, scale: Math.max(1, prev.scale - 0.2)}))} className="glass-panel" style={{ padding: '8px', border: '1px solid var(--border-neon)', color: '#0ff', backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}>
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL (Collapsible for Mobile) */}
      <div 
        ref={sidebarRef}
        style={{ 
          width: isSidebarOpen ? '320px' : '0px', 
          minWidth: isSidebarOpen ? '320px' : '0px', 
        backgroundColor: '#09090f', 
        borderLeft: isSidebarOpen ? '1px solid #1e1e2e' : 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}>
        {/* Toggle Tab (Floating on map edge) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 1000, backgroundColor: 'rgba(0,255,204,0.8)', color: '#000',
              border: 'none', borderRadius: '4px 0 0 4px', width: '24px', height: '60px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '-4px 0 10px rgba(0,255,204,0.3)'
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {isSidebarOpen && window.innerWidth <= 950 && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'absolute', left: '-24px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 1000, backgroundColor: 'rgba(0,255,204,0.8)', color: '#000',
              border: 'none', borderRadius: '4px 0 0 4px', width: '24px', height: '60px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Header */}
        <div style={{ padding: '0.5rem 0.8rem', backgroundColor: '#0d0d18', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00ffcc' }}>
            <ScanEye size={16} />
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
              {sel ? `傷票評估 — 病患 #${sel.id}` : 'START 分類系統'}
            </span>
          </div>
          {sel && (
            <button onClick={() => { setSelectedPatientId(null); setScan({ head: 0, chest: 0, hand: 0 }); }}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          )}
        </div>

        {sel ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: '2rem' }}>
            {/* Body + Scan Rows — side by side */}
            <div style={{ display: 'flex', gap: '0.6rem', padding: '0.7rem 0.8rem', borderBottom: '1px solid #1a1a2a', flexShrink: 0, alignItems: 'flex-start' }}>

              {/* SVG body */}
              <HumanBodySVG scannedParts={scan} onHover={handleScan} />

              {/* Scan zone rows */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
              <div style={{ fontSize: '0.65rem', color: anyScanned ? '#00ff96' : '#e6a800', fontWeight: 'bold', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                {isScanned ? '✓ 三項掃描完成' : anyScanned ? '⚡ 可依已知判定分類' : '移動滑鼠到人形圖上掃描'}
              </div>

                <ScanRow
                  icon="🧠"
                  label="意識狀態 (頭部)"
                  progress={scan.head}
                  value={mentalData?.value}
                  status={mentalData?.status}
                  symptom={mentalData?.symptom}
                />
                <ScanRow
                  icon="🫁"
                  label="呼吸頻率 (胸腔)"
                  progress={scan.chest}
                  value={respData?.value}
                  status={respData?.status}
                  symptom={respData?.symptom}
                />
                <ScanRow
                  icon="✋"
                  label="微血管充填 (末梢)"
                  progress={scan.hand}
                  value={capData?.value}
                  status={capData?.status}
                  symptom={capData?.symptom}
                />
              </div>
            </div>

            {/* Triage Strips */}
            <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
              <div style={{ fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold', marginBottom: '0.1rem', letterSpacing: '1px' }}>── 指定檢傷分類 ──</div>
              <TriageStrip color="black" symbol="○" label="死亡 MORGUE" onClick={() => handleTriage('black')} disabled={!anyScanned} />
              <TriageStrip color="red" symbol="I" label="極危險 IMMEDIATE" onClick={() => handleTriage('red')} disabled={!anyScanned} />
              <TriageStrip color="yellow" symbol="II" label="危險 DELAYED" onClick={() => handleTriage('yellow')} disabled={!anyScanned} />
              <TriageStrip color="green" symbol="III" label="輕傷 MINOR" onClick={() => handleTriage('green')} disabled={!anyScanned} />
            </div>
            </div>
        ) : (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem' }}>
            <User size={40} color="#1e1e2e" />
            <div style={{ color: '#2a2a3a', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.6 }}>
              點擊左側地圖上的<br />人形標記開始傷患評估
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
