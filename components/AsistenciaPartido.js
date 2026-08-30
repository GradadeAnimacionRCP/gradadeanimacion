import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { formatNumeroSocio } from '../lib/socios';
import { Users, ChevronDown, Check } from 'lucide-react';

export function AsistenciaPartido({ partidoId, cuentaId, misSocios }) {
  const [asistentes, setAsistentes] = useState(undefined);
  const [verLista, setVerLista] = useState(false);
  const [procesando, setProcesando] = useState(null);

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('listar_asistentes', { p_partido_id: partidoId });
    setAsistentes(data || []);
  }, [partidoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const misSociosValidos = (misSocios || []).filter((s) => s.estado_solicitud === 'aprobado');
  const idsAsistiendo = new Set((asistentes || []).map((a) => a.socio_id));

  const handleToggle = async (socioId) => {
    setProcesando(socioId);
    await supabase.rpc('toggle_asistencia', { p_cuenta_id: cuentaId, p_socio_id: socioId, p_partido_id: partidoId });
    setProcesando(null);
    cargar();
  };

  if (misSociosValidos.length === 0) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <button onClick={() => setVerLista((v) => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: fontStack.label, fontWeight: 700, fontSize: 13, color: PALETTE.brass }}>
          <Users size={15} />
          {asistentes === undefined ? 'Cargando...' : `${asistentes.length} ${asistentes.length === 1 ? 'socio va' : 'socios van'}`}
        </span>
        <ChevronDown size={16} color="rgba(244,246,241,0.5)" style={{ transform: verLista ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {verLista && asistentes && asistentes.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(244,246,241,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {asistentes.map((a) => (
            <div key={a.socio_id} style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.75)', fontFamily: fontStack.body }}>
              {a.nombre} {a.apellidos}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(244,246,241,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          ¿Quién de tus carnets va?
        </div>
        {misSociosValidos.map((s) => {
          const voy = idsAsistiendo.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => handleToggle(s.id)}
              disabled={procesando === s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                background: voy ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${voy ? 'rgba(74,222,128,0.4)' : 'rgba(244,246,241,0.15)'}`,
                textAlign: 'left', width: '100%',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: voy ? '#4ADE80' : 'transparent', border: voy ? 'none' : '1.5px solid rgba(244,246,241,0.35)',
              }}>
                {voy && <Check size={13} color={PALETTE.ink} strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 13, color: PALETTE.chalk, fontFamily: fontStack.body }}>
                {s.nombre} {s.apellidos} <span style={{ color: 'rgba(244,246,241,0.5)' }}>({formatNumeroSocio(s.numero_socio)})</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
