import React from 'react';
import { gameState } from '../../core/StateManager';
import { LocateFixed, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DispatchMapUI() {
  const scenario = gameState.getState().currentScenario;
  const dispatch = scenario?.dispatchData || {
    location: "第 7 區 - 商業混合大樓",
    report: "發生嚴重氣爆，建築物部分崩塌。回報現場燃燒中，目視逾 10 人員受困與倒臥街區，亟需救援！",
    suggestion: "救護 91 (ALS 車輛) 作為先遣小隊 (First Responder)。"
  };

  const handleAccept = () => {
    gameState.initResponsePhase(true);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      overflowY: 'auto',
      padding: '1rem 0'
    }}>
      
      <div style={{ 
        position: 'fixed', inset: 0, 
        backgroundImage: `url(${scenario?.bgImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        filter: 'brightness(0.3) blur(2px)',
        zIndex: 0 
      }} />

      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at center, rgba(255,0,0,0.15) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 1 }} />

      <div className="glass-panel" style={{ 
        padding: '1.2rem', borderRadius: '12px', zIndex: 10, textAlign: 'center', 
        width: '94%', maxWidth: '600px', border: '2px solid var(--color-red)',
        backgroundColor: 'rgba(10, 10, 15, 0.9)', backdropFilter: 'blur(10px)',
        boxShadow: '0 0 30px rgba(255, 0, 0, 0.2)',
        margin: 'auto'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <AlertTriangle size={32} color="var(--color-red)" style={{ animation: 'pulse 1s infinite' }} />
          <div>
            <h1 style={{ color: '#fff', letterSpacing: '1px', fontSize: '1.2rem', margin: 0 }}>緊急調度派遣</h1>
            <h2 style={{ color: 'var(--color-red)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', fontSize: '0.8rem', margin: 0 }}>高優先級警報</h2>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.8rem', borderRadius: '8px', textAlign: 'left', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: '0.6rem', display: 'flex', gap: '0.6rem' }}>
             <LocateFixed size={16} color="#00ffcc" />
             <div>
               <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>地點 (LOCATION)</div>
               <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{dispatch.location}</div>
             </div>
          </div>

          <div style={{ marginBottom: '0.6rem', display: 'flex', gap: '0.6rem' }}>
             <ShieldAlert size={16} color="var(--color-red)" />
             <div>
               <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>報案內容</div>
               <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', lineHeight: '1.4' }}>{dispatch.report}</div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.6rem' }}>
             <div style={{ width: '16px' }} />
             <div>
               <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>建議派遣</div>
               <div style={{ color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold' }}>{dispatch.suggestion}</div>
             </div>
          </div>
        </div>

        <button 
          className="button-pulse"
          style={{ 
            width: '100%', padding: '0.8rem', backgroundColor: 'var(--color-red)', color: '#fff', 
            border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: '900', 
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px'
          }}
          onClick={handleAccept}
        >
          接受任務，立即出發
        </button>
      </div>
    </div>
  );
}
