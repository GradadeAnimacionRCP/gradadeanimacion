import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { Target, CheckCircle2 } from 'lucide-react';

function partidoYaEmpezo(partido) {
  if (!partido.fecha) return false;
  const objetivo = new Date(`${partido.fecha}T${partido.hora || '23:59:59'}`);
  return objetivo.getTime() <= Date.now();
}

export function PrediccionPartido({ partido, sesion }) {
  const [prediccion, setPrediccion] = useState(undefined);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [justoGuardado, setJustoGuardado] = useState(false);

  const cerrado = partidoYaEmpezo(partido);

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('mi_prediccion', { p_cuenta_id: sesion.id, p_partido_id: partido.id });
    const p = data && data[0] ? data[0] : null;
    setPrediccion(p);
    if (p) { setGolesLocal(String(p.goles_local)); setGolesVisitante(String(p.goles_visitante)); }
  }, [sesion.id, partido.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async () => {
    setError('');
    if (golesLocal === '' || golesVisitante === '') { setError('Rellena los dos marcadores.'); return; }
    setGuardando(true);
    const { error: dbError } = await supabase.rpc('guardar_prediccion', {
      p_cuenta_id: sesion.id, p_partido_id: partido.id,
      p_goles_local: parseInt(golesLocal, 10), p_goles_visitante: parseInt(golesVisitante, 10),
    });
    setGuardando(false);
    if (dbError) { setError(dbError.message); return; }
    setEditando(false);
    setJustoGuardado(true);
    cargar();
  };

  if (cerrado && !prediccion) return null;

  const nombreLocal = partido.es_local ? 'Racing' : partido.rival;
  const nombreVisitante = partido.es_local ? partido.rival : 'Racing';

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontFamily: fontStack.label, fontSize: 12.5, color: PALETTE.brass, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        <Target size={14} /> Predicción
      </div>

      {cerrado ? (
        <div style={{ textAlign: 'center', fontSize: 13.5, color: PALETTE.chalk, fontFamily: fontStack.heading, fontWeight: 700 }}>
          Predijiste: {prediccion.goles_local} - {prediccion.goles_visitante}
        </div>
      ) : !prediccion || editando ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label, marginBottom: 6 }}>{nombreLocal}</div>
              <input type="number" min="0" value={golesLocal} onChange={(e) => setGolesLocal(e.target.value)}
                style={{ width: 54, height: 54, textAlign: 'center', fontSize: 22, fontFamily: fontStack.heading, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${PALETTE.brass}55`, borderRadius: 10, color: PALETTE.chalk }} />
            </div>
            <div style={{ fontFamily: fontStack.display, fontSize: 18, color: 'rgba(244,246,241,0.35)', marginTop: 20 }}>-</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label, marginBottom: 6 }}>{nombreVisitante}</div>
              <input type="number" min="0" value={golesVisitante} onChange={(e) => setGolesVisitante(e.target.value)}
                style={{ width: 54, height: 54, textAlign: 'center', fontSize: 22, fontFamily: fontStack.heading, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${PALETTE.brass}55`, borderRadius: 10, color: PALETTE.chalk }} />
            </div>
          </div>
          {error && <div style={{ color: '#ff8a8a', fontSize: 12.5, textAlign: 'center', marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            {editando && (
              <Button variant="ghost" disabled={guardando} onClick={() => setEditando(false)} style={{ flex: 1, fontSize: 13 }}>Cancelar</Button>
            )}
            <Button variant="brass" disabled={guardando} onClick={handleGuardar} style={{ flex: 1, fontSize: 13 }}>
              {guardando ? 'Guardando...' : 'Guardar predicción'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {justoGuardado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ADE80', fontFamily: fontStack.label, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <CheckCircle2 size={14} /> Predicción guardada
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: PALETTE.chalk, fontFamily: fontStack.heading, fontWeight: 700 }}>
              {prediccion.goles_local} - {prediccion.goles_visitante}
            </span>
            <Button variant="ghost" onClick={() => setEditando(true)} style={{ fontSize: 12.5 }}>Cambiar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
