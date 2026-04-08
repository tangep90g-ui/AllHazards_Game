import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../services/leaderboardService';
import { supabase } from '../../services/supabaseClient';

export default function AfterActionReportUI({ score, patients }) {
  const [nickname, setNickname] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const total = patients.length;
  const triaged = patients.filter(p => p.status !== 'unknown').length;
  
  // Calculate accuracy
  const correctlyTriaged = patients.filter(p => p.status !== 'unknown' && p.status === p.trueTriageStatus).length;
  const accuracy = triaged > 0 ? Math.round((correctlyTriaged / triaged) * 100) : 0;

  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime updates
    const channel = LeaderboardService.subscribeToChanges(() => {
      // When a change is detected, re-fetch the leaderboard to get the sorted list
      fetchLeaderboard();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await LeaderboardService.getTopScores();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await LeaderboardService.submitScore(nickname, score);
      if (result.success) {
        setUserRank(result.rank);
        setSubmitted(true);
        fetchLeaderboard(); // Refresh the list
      }
    } catch (err) {
      setError("提交失敗，請確認 Vercel 的 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY 設定正確，且已完成 Redeploy。");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'var(--bg-dark)', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '0.8rem',
      overflowY: 'auto',
      backgroundImage: 'radial-gradient(circle at center, rgba(0,255,204,0.05) 0%, transparent 70%)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-yellow)', backgroundColor: 'rgba(20, 20, 20, 0.95)' }}>
        <header style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <h2 style={{ color: 'var(--color-yellow)', margin: 0, fontSize: '1.2rem', letterSpacing: '2px' }}>任務結算報告 (AAR)</h2>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ALLHAZARDS COMMAND CENTER</div>
        </header>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '0.6rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>最終指揮評分</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-yellow)' }}>{score.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.6rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>全球即時名次</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-green)' }}>
              {submitted ? (userRank ? `#${userRank}` : '...') : '--'}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.6rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>檢傷正確率</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: accuracy > 80 ? 'var(--color-green)' : 'var(--color-red)' }}>{accuracy}%</div>
          </div>
        </div>

        {/* Global Leaderboard Section */}
        <section style={{ marginTop: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ color: 'var(--color-yellow)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
               🏆 全球英雄榜 (TOP 10)
            </h3>
            {submitted && <span style={{ fontSize: '0.7rem', color: 'var(--color-green)' }}>✓ 已提交紀錄</span>}
          </div>
          
          {!submitted ? (
            <form onSubmit={handleSubmitScore} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', backgroundColor: 'rgba(0,255,204,0.05)', padding: '0.6rem', borderRadius: '6px' }}>
              <input 
                type="text" 
                placeholder="輸入您的救護代號 (8字)..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value.toUpperCase().slice(0, 8))}
                required
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#000', color: '#fff', fontSize: '0.8rem' }}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !nickname}
                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-green)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {isSubmitting ? '提交中' : '提交紀錄'}
              </button>
            </form>
          ) : (
            <div style={{ marginBottom: '1rem', padding: '0.8rem', backgroundColor: 'rgba(0, 255, 204, 0.1)', borderRadius: '8px', textAlign: 'center', border: '1px solid #00ffcc' }}>
              <div style={{ fontSize: '0.8rem', color: '#00ffcc' }}>您的全球即時排名：<strong style={{ fontSize: '1.5rem', color: '#fff', marginLeft: '0.5rem' }}>#{userRank}</strong></div>
            </div>
          )}

          {error && <div style={{ color: 'var(--color-red)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>{error}</div>}

          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1a1a24', zIndex: 1 }}>
                <tr style={{ color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.6rem' }}>名次</th>
                  <th style={{ padding: '0.6rem' }}>救護代號</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>分數</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>日期</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    backgroundColor: (entry.name === nickname && submitted) ? 'rgba(0, 255, 204, 0.1)' : 'transparent'
                  }}>
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 'bold', color: entry.rank <= 3 ? 'var(--color-yellow)' : '#888' }}>
                      #{entry.rank}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem' }}>{entry.name}</td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: 'var(--color-green)', fontWeight: 'bold' }}>{entry.score.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontSize: '0.65rem', color: '#555' }}>{entry.date}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#555' }}>尚無紀錄</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            style={{ padding: '0.7rem 3rem', backgroundColor: 'transparent', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            返回指揮中心 (重新開始)
          </button>
        </div>
      </div>
    </div>
  );
}
