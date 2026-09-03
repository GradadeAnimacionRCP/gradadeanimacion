import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Trophy } from 'lucide-react';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export function RankingPredicciones() {
  const [ranking, setRanking] = useState(undefined);

  useEffect(() => {
    supabase.rpc('ranking_predicciones').then(({ data }) => setRanking(data || []));
  }, []);

  if (ranking === undefined) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.5)' }}>Cargando...</div>;
  }

  if (ranking.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
        <Trophy size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p style={{ fontSize: 13.5 }}>Todavía no hay predicciones con resultado para hacer ranking.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ranking.map((r, idx) => (
        <div key={r.cuenta_id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: idx < 3 ? 'rgba(201,162,75,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${idx < 3 ? 'rgba(201,162,75,0.3)' : 'rgba(244,246,241,0.1)'}`,
        }}>
          <span style={{ width: 26, textAlign: 'center', fontSize: idx < 3 ? 18 : 13, fontFamily: fontStack.heading, fontWeight: 700, color: idx < 3 ? PALETTE.brass : 'rgba(244,246,241,0.5)' }}>
            {idx < 3 ? MEDALLAS[idx] : idx + 1}
          </span>
          <span style={{ flex: 1, fontSize: 13.5, color: PALETTE.chalk, fontFamily: fontStack.body }}>{r.usuario}</span>
          <span style={{ fontSize: 13, color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700 }}>
            {r.aciertos} {r.aciertos === 1 ? 'acierto' : 'aciertos'}
          </span>
        </div>
      ))}
    </div>
  );
}
