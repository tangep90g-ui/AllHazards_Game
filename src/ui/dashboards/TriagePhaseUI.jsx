import React, { useState, useEffect } from 'react';
import { User, ScanEye } from 'lucide-react';

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
  });

  return (
    <svg viewBox="0 0 90 200" width="90" height="200" style={{ display: 'block', flexShrink: 0 }}>
      {/* Head */}
      <ellipse cx="45" cy="17" rx="14" ry="15" {...zoneStyle('head')} onMouseMove={() => onHover('head')} />
      {/* Neck */}
      <rect x="40" y="30" width="10" height="9" fill="rgba(255,255,255,0.04)" stroke="#333" strokeWidth={1} />
      {/* Torso */}
      <rect x="24" y="39" width="42" height="60" rx="6" {...zoneStyle('chest')} onMouseMove={() => onHover('chest')} />
      {/* Left Upper Arm */}
      <rect x="10" y="39" width="13" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="#444" strokeWidth={1} />
      {/* Right Upper Arm */}
      <rect x="67" y="39" width="13" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="#444" strokeWidth={1} />
      {/* Left Hand */}
      <ellipse cx="16" cy="91" rx="8" ry="10" {...zoneStyle('hand')} onMouseMove={() => onHover('hand')} />
      {/* Right Hand */}
      <ellipse cx="74" cy="91" rx="8" ry="10" {...zoneStyle('hand')} onMouseMove={() => onHover('hand')} />
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
        width: '100%', padding: '0.5rem 0.8rem',
        backgroundColor: disabled ? 'rgba(60,60,60,0.3)' : bg[color],
        border: `1.5px solid ${disabled ? '#2a2a2a' : bg[color]}`,
        borderRadius: '3px', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.1s',
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: '900', color: tc, minWidth: '1.5rem', fontFamily: 'monospace' }}>{symbol}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: tc, letterSpacing: '1px' }}>{label}</span>
    </button>
  );
}

// Inline scan row
function ScanRow({ icon, label, progress, value, status, symptom }) {
  const done = progress >= 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', opacity: done ? 1 : 0.3 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: '#888' }}>{label}</span>
            <span style={{ fontSize: '0.65rem', color: done ? '#00ffcc' : '#444' }}>{done ? '完成' : `${progress}%`}</span>
          </div>
          <div style={{ height: '3px', backgroundColor: '#1a1a2a', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: done ? '#00ff96' : '#e6a800', transition: 'width 0.2s' }} />
          </div>
        </div>
      </div>
      {done && (
        <div style={{ marginLeft: '1.4rem', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{value}</span>
          <span style={{ fontSize: '0.7rem', color: status?.startsWith('🟢') ? '#00ff96' : status?.startsWith('🟡') ? '#ffcc00' : '#ff4444' }}>{status}</span>
        </div>
      )}
    </div>
  );
}

export default function TriagePhaseUI({ selectedPatientId, setSelectedPatientId }) {
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [scan, setScan] = useState({ head: 0, chest: 0, hand: 0 });

  useEffect(() => {
    const onState = (s) => setGameStateData(s);
    const onOk = () => { setFeedbackMsg({ text: '✓ 判定正確 +100', c: '#00ff96' }); setTimeout(() => setFeedbackMsg(null), 2000); };
    const onErr = () => { setFeedbackMsg({ text: '✗ 判定錯誤 -50', c: '#ff4444' }); setTimeout(() => setFeedbackMsg(null), 2000); };
    globalEvents.on('STATE_UPDATE', onState);
    globalEvents.on('TRIAGE_CORRECT', onOk);
    globalEvents.on('TRIAGE_INCORRECT', onErr);
    return () => {
      globalEvents.off('STATE_UPDATE', onState);
      globalEvents.off('TRIAGE_CORRECT', onOk);
      globalEvents.off('TRIAGE_INCORRECT', onErr);
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
  const anyScanned = scan.head >= 100 || scan.chest >= 100 || scan.hand >= 100;
  const isScanned = scan.head >= 100 && scan.chest >= 100 && scan.hand >= 100;

  const respData = sel ? {
    value: sel.vitals.resp === 0 ? '無呼吸' : `${sel.vitals.resp}/分`,
    status: sel.vitals.resp === 0 ? '🔴 停止' : sel.vitals.resp > 30 ? '🔴 過速' : '🟢 正常',
    symptom: sel.vitals.traumaSymptom
  } : null;

  const capData = sel ? {
    value: sel.vitals.crt === 0 ? '無法偵測' : `${sel.vitals.crt}s`,
    status: sel.vitals.crt === 0 ? '🔴 異常' : sel.vitals.crt > 2.0 ? '🔴 延遲 (>2s)' : '🟢 正常 (<2s)',
  } : null;

  const mentalData = sel ? {
    value: sel.vitals.mentalRaw === 'unconscious' ? '無反應' : '有反應',
    status: sel.vitals.mentalRaw === 'unconscious' ? '🔴 昏迷' : 
            sel.vitals.mentalRaw === 'confused_immobile' ? '🟡 意識混亂' : 
            sel.vitals.mentalRaw === 'obedient_immobile' ? '🟡 有反應/無法行走' : '🟢 清醒/能行走',
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* feedback toast overlay inside the panel */}
      {feedbackMsg && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', right: '10px',
          backgroundColor: 'rgba(0,0,0,0.95)', border: `1px solid ${feedbackMsg.c}`,
          color: feedbackMsg.c, padding: '0.4rem', borderRadius: '4px',
          fontWeight: 'bold', fontSize: '0.75rem', zIndex: 100, textAlign: 'center'
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0.8rem', backgroundColor: '#0d0d18', borderBottom: '1px solid #1e1e2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00ffcc' }}>
          <ScanEye size={16} />
          <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
            {sel ? `傷票評估 — 病患 #${sel.id}` : 'START 分類模式'}
          </span>
        </div>
      </div>

      {sel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.8rem', overflowY: 'auto' }}>
          
          <div style={{ fontSize: '0.65rem', color: anyScanned ? '#00ff96' : '#e6a800', fontWeight: 'bold' }}>
            {isScanned ? '✓ 評估資料已就緒' : '移動滑鼠至人體圖進行評估'}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
            <HumanBodySVG scannedParts={scan} onHover={handleScan} />
            <div style={{ flex: 1 }}>
              <ScanRow icon="🧠" label="意識狀態" progress={scan.head} value={mentalData?.value} status={mentalData?.status} />
              <ScanRow icon="🫁" label="呼吸頻率" progress={scan.chest} value={respData?.value} status={respData?.status} />
              <ScanRow icon="✋" label="微血管充填" progress={scan.hand} value={capData?.value} status={capData?.status} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold' }}>── 指定等級 ──</div>
            <TriageStrip color="black" symbol="○" label="死亡 MORGUE" onClick={() => handleTriage('black')} disabled={!anyScanned} />
            <TriageStrip color="red" symbol="I" label="重傷 IMMEDIATE" onClick={() => handleTriage('red')} disabled={!anyScanned} />
            <TriageStrip color="yellow" symbol="II" label="中傷 DELAYED" onClick={() => handleTriage('yellow')} disabled={!anyScanned} />
            <TriageStrip color="green" symbol="III" label="輕傷 MINOR" onClick={() => handleTriage('green')} disabled={!anyScanned} />
            <button onClick={() => setSelectedPatientId(null)} style={{ border: 'none', background: '#222', color: '#888', padding: '0.4rem', cursor: 'pointer', borderRadius: '3px', fontSize: '0.75rem' }}>取消選取</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#2a2a3a', padding: '1rem' }}>
          <User size={48} />
          <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>請在地圖上選擇傷患<br/>開始評估</p>
        </div>
      )}
    </div>
  );
}
