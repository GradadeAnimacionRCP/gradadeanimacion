import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Star, Trophy } from 'lucide-react';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export function ListaRankingMVP() {
  const [ranking, setRanking] = useState(undefined);
  const [historial, setHistorial] = useState(undefined);

  useEffect(() => {
    supabase.rpc('ranking_mvp').then(({ data }) => setRanking(data || []));
    supabase.rpc('mvp_historial_jornadas').then(({ data }) => setHistorial(data || []));
  }, []);

  if (ranking === undefined) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.5)' }}>Cargando...</div>;
  }

    if (ranking.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
        <Star size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p style={{ fontSize: 13.5 }}>Todavía no se ha cerrado ninguna votación de MVP.</p>
      </div>
    );
  }

  return (
    <div>
      {historial && historial.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {historial.map((h) => {
            const puestos = { 1: [], 2: [], 3: [] };
            (h.ganadores || []).forEach((g) => { if (puestos[g.puesto]) puestos[g.puesto].push(g); });
            const etiquetaPuesto = { 1: '🥇 Primer puesto', 2: '🥈 Segundo puesto', 3: '🥉 Tercer puesto' };
            return (
              <div key={h.partido_id} style={{ background: 'rgba(201,162,75,0.08)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, fontWeight: 800, textTransform: 'uppercase' }}>
                  <Trophy size={14} /> {h.jornada ? `Jornada ${h.jornada}` : 'MVP'} · vs {h.rival}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3].map((p) =>
                    puestos[p].length > 0 && (
                      <div key={p} style={{ fontSize: 13, color: PALETTE.chalk, fontFamily: fontStack.body }}>
                        <span style={{ fontWeight: 700 }}>{etiquetaPuesto[p]}:</span>{' '}
                        {puestos[p].map((g) => g.nombre).join(' / ')} — {puestos[p][0].puntos} {puestos[p][0].puntos === 1 ? 'punto' : 'puntos'}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
        Clasificación acumulada
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ranking.map((r, idx) => (
        <div key={r.jugador_id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: idx < 3 ? 'rgba(201,162,75,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${idx < 3 ? 'rgba(201,162,75,0.3)' : 'rgba(244,246,241,0.1)'}`,
        }}>
          <span style={{ width: 26, textAlign: 'center', fontSize: idx < 3 ? 18 : 13, fontFamily: fontStack.heading, fontWeight: 700, color: idx < 3 ? PALETTE.brass : 'rgba(244,246,241,0.5)' }}>
            {idx < 3 ? MEDALLAS[idx] : idx + 1}
          </span>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', fontFamily: fontStack.label, fontWeight: 800, fontSize: 10, color: PALETTE.brass,
          }}>{r.dorsal}</span>
          <span style={{ flex: 1, fontSize: 13.5, color: PALETTE.chalk, fontFamily: fontStack.body }}>{r.nombre}</span>
          {Number(r.veces_mvp) > 0 && (
            <span style={{ fontSize: 11, color: PALETTE.brass, fontFamily: fontStack.label }}>👑 {r.veces_mvp}</span>
          )}
          <span style={{ fontSize: 13, color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700 }}>{r.puntos} pts</span>
        </div>
      ))}
      </div>
    </div>
  );
}
