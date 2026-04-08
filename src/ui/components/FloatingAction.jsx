import React, { useState, useEffect } from 'react';
import { Clock, Play, Zap } from 'lucide-react';

export default function FloatingAction({ id, title, timeLeft, onExecute, initialX, initialY }) {
  // Use session storage or initial provided offset to avoid overlap
  const [position, setPosition] = useState({ 
    x: initialX || 70 + (Math.random() * 10), 
    y: initialY || 60 + (Math.random() * 20) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleStart = (e) => {
    setIsDragging(true);
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x * (window.innerWidth / 100),
      y: clientY - position.y * (window.innerHeight / 100)
    });
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    setPosition({
      x: ((clientX - dragStart.x) / window.innerWidth) * 100,
      y: ((clientY - dragStart.y) / window.innerHeight) * 100
    });
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart]);

  const isReady = timeLeft === 0;
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerHeight < 500);

  useEffect(() => {
    const checkSize = () => setIsSmallScreen(window.innerHeight < 500);
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const btnWidth = isSmallScreen ? '60px' : '85px';
  const iconSize = isSmallScreen ? 22 : 30;
  const zapSize = isSmallScreen ? 14 : 18;

  return (
    <div
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: 4000,
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div 
        onClick={(e) => { if (isReady && !isDragging) { e.stopPropagation(); onExecute(); } }}
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isSmallScreen ? '0px' : '2px',
          padding: isSmallScreen ? '4px' : '8px',
          width: btnWidth,
          borderRadius: '10px',
          backgroundColor: isReady ? 'rgba(0, 255, 204, 0.2)' : 'rgba(20, 20, 30, 0.7)',
          border: `2px solid ${isReady ? 'var(--color-green)' : 'var(--color-yellow)'}`,
          boxShadow: isReady ? '0 0 15px rgba(0, 255, 204, 0.4)' : 'none',
          cursor: isDragging ? 'grabbing' : (isReady ? 'pointer' : 'not-allowed'),
          transition: 'all 0.3s ease',
          transform: isReady && !isDragging ? 'scale(1.05)' : 'scale(1)',
          animation: isReady ? 'pulse-green 2s infinite' : 'none'
        }}
      >
        <div style={{ fontSize: isSmallScreen ? '0.5rem' : '0.6rem', color: isReady ? '#fff' : 'var(--color-yellow)', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px', marginBottom: isSmallScreen ? '0px' : '2px' }}>
          {title.slice(0, 6)}
        </div>
        
        {isReady ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-green)', borderRadius: '50%', width: `${iconSize}px`, height: `${iconSize}px` }}>
             <Zap size={zapSize} fill="#000" color="#000" />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isSmallScreen ? '0.8rem' : '1.1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
            <Clock size={isSmallScreen ? 10 : 12} color="var(--color-yellow)" />
            {timeLeft}s
          </div>
        )}
        
        <div style={{ fontSize: '0.5rem', color: isReady ? '#0ff' : '#888', marginTop: '2px' }}>
          {isReady ? 'READY' : 'CD'}
        </div>
      </div>

      <style>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 204, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 255, 204, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 204, 0); }
        }
      `}</style>
    </div>
  );
}
