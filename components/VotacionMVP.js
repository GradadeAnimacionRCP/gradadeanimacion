import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { Star, CheckCircle2 } from 'lucide-react';

export function VotacionMVP({ partido, sesion }) {
  const [abierta, setAbierta] = useState(null);
  const [jugadores, setJugadores] = useState(undefined);
  const [miVoto, setMiVoto] = useState(undefined);
  const [seleccion, setSeleccion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [justoVotado, setJustoVotado] = useState(false);
  const [resultado, setResultado] = useState(undefined);

  const cargar = useCallback(async () => {
    const { data: abiertaData } = await supabase.rpc('votacion_mvp_abierta', { p_partido_id: partido.id });
    setAbierta(abiertaData);

    if (abiertaData) {
      const [jugRes, votoRes] = await Promise.all([
        supabase.rpc('listar_jugadores'),
        supabase.rpc('mi_voto_mvp', { p_cuenta_id: sesion.id, p_partido_id: partido.id }),
      ]);
      setJugadores(jugRes.data || []);
      setMiVoto(votoRes.data || null);
      if (votoRes.data) setSeleccion(votoRes.data);
    } else {
      const { data: resultadoData } = await supabase
        .from('mvp_resultados').select('ganadores').eq('partido_id', partido.id).maybeSingle();
      setResultado(resultadoData?.ganadores || null);
    }
  }, [partido.id, sesion.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleVotar = async () => {
    if (!seleccion) return;
    setGuardando(true);
    const { error } = await supabase.rpc('votar_mvp', { p_cuenta_id: sesion.id, p_partido_id: partido.id, p_jugador_id: seleccion });
    setGuardando(false);
    if (error) return;
    setMiVoto(seleccion);
    setJustoVotado(true);
    cargar();
  };

  if (abierta === null) return null;
  if (!abierta && !resultado) return null;

  if (!abierta && resultado) {
    const podio = resultado.filter((r) => r.puesto <= 3).sort((a, b) => a.puesto - b.puesto);
    if (podio.length === 0) return null;
    const medallas = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return (
      <div style={{ background: 'rgba(201,162,75,0.08)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: 14, padding: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, fontWeight: 700, textTransform: 'uppercase' }}>
          <Star size={14} /> MVP del partido
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {podio.map((g) => (
            <div key={g.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: PALETTE.chalk }}>
              <span>{medallas[g.puesto]}</span>
              <span style={{ flex: 1, fontFamily: fontStack.heading, fontWeight: 700 }}>{g.nombre}</span>
              <span style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label }}>{g.votos} votos</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(201,162,75,0.06)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, fontWeight: 700, textTransform: 'uppercase' }}>
        <Star size={14} /> Vota al MVP del partido
      </div>

      {justoVotado && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ADE80', fontFamily: fontStack.label, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          <CheckCircle2 size={14} /> Voto registrado
        </div>
      )}

      {jugadores === undefined ? (
        <div style={{ textAlign: 'center', color: 'rgba(244,246,241,0.5)', fontSize: 13 }}>Cargando...</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 260, overflowY: 'auto' }}>
            {jugadores.map((j) => {
              const marcado = seleccion === j.id;
              return (
                <button key={j.id} onClick={() => setSeleccion(j.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                  background: marcado ? 'rgba(201,162,75,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${marcado ? PALETTE.brass : 'rgba(244,246,241,0.15)'}`, textAlign: 'left', width: '100%',
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)', fontFamily: fontStack.label, fontWeight: 800, fontSize: 11, color: PALETTE.brass,
                  }}>{j.dorsal}</span>
                  <span style={{ fontSize: 13.5, color: PALETTE.chalk, fontFamily: fontStack.body }}>{j.nombre}</span>
                </button>
              );
            })}
          </div>
          <Button variant="brass" disabled={!seleccion || guardando} onClick={handleVotar} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : miVoto ? 'Cambiar voto' : 'Votar'}
          </Button>
        </>
      )}
    </div>
  );
}
