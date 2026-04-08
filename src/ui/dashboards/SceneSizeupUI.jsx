import React, { useState, useEffect } from 'react';
import { gameState } from '../../core/StateManager';
import { RadioTower, HeartPulse, Ambulance, CheckCircle2 } from 'lucide-react';

export default function SceneSizeupUI() {
  const [activeToken, setActiveToken] = useState(null);
  const [placedTokens, setPlacedTokens] = useState({}); // { id: { x, y, zone, score } }
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const tokens = [
    { id: 'ICP', name: '現場指揮站 (ICP)', icon: <RadioTower size={32} color="#00ffcc" />, desc: '需遠離危害，並擁有全景視野。', rule: { hot: 10, warm: 100, cold: 300 } },
    { id: 'TREATMENT', name: '紅黃綠處置站 (Treatment Area)', icon: <HeartPulse size={32} color="var(--color-yellow)" />, desc: '靠近脫困熱區但應有緩衝防護。', rule: { hot: 10, warm: 300, cold: 150 } },
    { id: 'STAGING', name: '車輛集結區 (Staging Area)', icon: <Ambulance size={32} color="#fff" />, desc: '需安全且交通動線流暢之處。', rule: { hot: 10, warm: 50, cold: 300 } }
  ];

  const handleMapClick = (e) => {
    if (!activeToken) return;

    // Calculate percentage coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Determine Zone based on distance from center (50, 50)
    const dist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
    let zone = 'cold';
    if (dist < 15) zone = 'hot';
    else if (dist < 35) zone = 'warm';

    const tokenConfig = tokens.find(t => t.id === activeToken);
    const scoreEarned = tokenConfig.rule[zone];

    setPlacedTokens(prev => ({
      ...prev,
      [activeToken]: { x, y, zone, score: scoreEarned }
    }));
    
    // Clear active selection
    setActiveToken(null);
  };

  const allPlaced = Object.keys(placedTokens).length === tokens.length;

  const handleStart = () => {
    if (!allPlaced) return;
    
    const timeSpent = (Date.now() - startTime) / 1000;
    let timeBonus = 0;
    if (timeSpent < 10) timeBonus = 500;
    else if (timeSpent < 20) timeBonus = 200;
    else if (timeSpent < 30) timeBonus = 50;

    let baseScore = 0;
    Object.values(placedTokens).forEach(t => baseScore += t.score);

    const totalEarned = baseScore + timeBonus;

    // Convert placedTokens to state format
    const assets = Object.entries(placedTokens).map(([id, data]) => ({
        id, x: data.x, y: data.y, type: id
    }));
    
    // Transition to COMMAND_CENTER via StateManager
    gameState.completeSetupPhase(totalEarned, assets);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#07070b', display: 'flex', overflowY: 'auto' }}>
      
      {/* Left Sidebar: Token Selector (Optimized for Landscape) */}
      <aside style={{ width: '32%', minWidth: '220px', backgroundColor: 'rgba(15, 15, 20, 0.98)', borderRight: '1px solid var(--border-neon)', display: 'flex', flexDirection: 'column', padding: '1rem', zIndex: 10, overflowY: 'auto' }}>
        <h1 style={{ color: '#00ffcc', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem' }}><CheckCircle2 size={18} /> 戰術配置</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', lineHeight: 1.4, marginBottom: '1rem' }}>
          請選擇設施並在地圖上指定佈置點。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
          {tokens.map(token => {
            const isPlaced = placedTokens[token.id];
            const isSelected = activeToken === token.id;

            let bgColor = 'rgba(255,255,255,0.03)';
            if (isSelected) bgColor = 'rgba(0, 255, 204, 0.15)';
            if (isPlaced) bgColor = 'rgba(0,0,0,0.4)';

            return (
              <div 
                key={token.id}
                onClick={() => !isPlaced && setActiveToken(token.id)}
                style={{
                  padding: '0.8rem',
                  backgroundColor: bgColor,
                  border: isSelected ? '1.5px solid #00ffcc' : (isPlaced ? '1px solid #333' : '1px solid rgba(255,255,255,0.1)'),
                  borderRadius: '8px',
                  cursor: isPlaced ? 'default' : 'pointer',
                  opacity: isPlaced ? 0.6 : 1,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <div style={{ opacity: isPlaced ? 0.3 : 1 }}>{React.cloneElement(token.icon, { size: 20 })}</div>
                  <div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '0.8rem' }}>{token.name}</h3>
                  </div>
                </div>

                {isPlaced && (
                  <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-green)', fontWeight: 'bold', fontSize: '0.6rem' }}>
                    +{placedTokens[token.id].score}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allPlaced && (
           <button 
             onClick={handleStart}
             style={{ padding: '0.8rem', backgroundColor: '#00ffcc', color: '#000', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}
           >
             確認配置
           </button>
        )}
      </aside>

      {/* Right Area: Interactive Map */}
      <main style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* The Tactical Map representation */}
        <div 
          onClick={handleMapClick}
          style={{
            position: 'absolute',
            inset: '3rem',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: activeToken ? 'crosshair' : 'default',
            boxShadow: '0 0 50px rgba(0,0,0,0.8)'
          }}
        >
          {/* Base Grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#1a1a24', backgroundImage: 'radial-gradient(circle at center, rgba(0,255,0,0.05) 0%, transparent 80%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

           {/* Zones Visualization */}
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', borderRadius: '50%', border: '2px dashed var(--color-yellow)', backgroundColor: 'rgba(255, 204, 0, 0.05)' }} />
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', height: '30%', borderRadius: '50%', border: '2px dashed var(--color-red)', backgroundColor: 'rgba(255, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ color: 'var(--color-red)', fontWeight: 'bold', letterSpacing: '4px' }}>災變原爆點</span>
           </div>

           {/* Placed Tokens Rendering */}
           {Object.keys(placedTokens).map(tokenId => {
             const { x, y, score } = placedTokens[tokenId];
             const t = tokens.find(tk => tk.id === tokenId);
             return (
               <div key={tokenId} style={{
                 position: 'absolute', top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)',
                 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none' // allow clicking through
               }}>
                 <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.8)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                    {React.cloneElement(t.icon, { size: 30 })}
                 </div>
                 <div style={{ backgroundColor: 'var(--color-green)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                   +{score}
                 </div>
               </div>
             );
           })}

        </div>

      </main>

    </div>
  );
}
