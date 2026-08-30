import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { formatNumeroSocio } from '../lib/socios';
import { Users, ChevronDown, Check, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';

export function AsistenciaPartido({ partidoId, cuentaId, misSocios, confirm }) {
  const [asistentes, setAsistentes] = useState(undefined);
  const [verLista, setVerLista] = useState(false);
  const [modo, setModo] = useState('resumen'); // 'resumen' | 'seleccionando'
  const [seleccion, setSeleccion] = useState(new Set());
  const [guardando, setGuardando] = useState(false);
  const [justoConfirmado, setJustoConfirmado] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('listar_asistentes', { p_partido_id: partidoId });
    setAsistentes(data || []);
  }, [partidoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const misSociosValidos = (misSocios || []).filter((s) => s.estado_solicitud === 'aprobado');
  const idsAsistiendo = new Set((asistentes || []).filter((a) => misSociosValidos.some((s) => s.id === a.socio_id)).map((a) => a.socio_id));
  const misAsistentes = misSociosValidos.filter((s) => idsAsistiendo.has(s.id));

  if (misSociosValidos.length === 0) return null;

  const abrirSeleccion = () => {
    setSeleccion(new Set(idsAsistiendo));
    setJustoConfirmado(false);
    setModo('seleccionando');
  };

  const toggleCheckbox = (socioId) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(socioId)) nuevo.delete(socioId);
      else nuevo.add(socioId);
      return nuevo;
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const cambios = [];
    misSociosValidos.forEach((s) => {
      const estabaAntes = idsAsistiendo.has(s.id);
      const estaAhora = seleccion.has(s.id);
      if (estabaAntes !== estaAhora) cambios.push(s.id);
    });
    for (const socioId of cambios) {
      await supabase.rpc('toggle_asistencia', { p_cuenta_id: cuentaId, p_socio_id: socioId, p_partido_id: partidoId });
    }
    setGuardando(false);
    setModo('resumen');
    setJustoConfirmado(seleccion.size > 0);
    cargar();
  };

  const handleEliminarTodo = async () => {
    if (!(await confirm('¿Eliminar tu asistencia a este partido?'))) return;
    setGuardando(true);
    for (const socioId of misAsistentes.map((s) => s.id)) {
      await supabase.rpc('toggle_asistencia', { p_cuenta_id: cuentaId, p_socio_id: socioId, p_partido_id: partidoId });
    }
    setGuardando(false);
    setJustoConfirmado(false);
    cargar();
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <button onClick={() => setVerLista((v) => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: 0, marginBottom: 12,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: fontStack.label, fontWeight: 700, fontSize: 13, color: PALETTE.brass }}>
          <Users size={15} />
          {asistentes === undefined ? 'Cargando...' : `${asistentes.length} ${asistentes.length === 1 ? 'socio va' : 'socios van'} al próximo partido`}
        </span>
        <ChevronDown size={16} color="rgba(244,246,241,0.5)" style={{ transform: verLista ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {verLista && asistentes && asistentes.length > 0 && (
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(244,246,241,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {asistentes.map((a) => (
            <div key={a.socio_id} style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.75)', fontFamily: fontStack.body }}>
              {a.nombre} {a.apellidos}
            </div>
          ))}
        </div>
      )}

      {modo === 'resumen' && (
        misAsistentes.length === 0 ? (
          <Button variant="brass" onClick={abrirSeleccion} style={{ width: '100%' }}>
            <UserPlus size={15} /> Apuntarme
          </Button>
        ) : (
          <div>
            {justoConfirmado && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.35)', borderRadius: 10, padding: '10px 12px', marginBottom: 10,
              }}>
                <CheckCircle2 size={16} color="#4ADE80" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#4ADE80', fontFamily: fontStack.label, fontWeight: 700, fontSize: 12.5 }}>
                    ¡Asistencia confirmada!
                  </div>
                  <div style={{ color: 'rgba(244,246,241,0.7)', fontSize: 12, marginTop: 2, fontFamily: fontStack.body }}>
                    Apuntado: {misAsistentes.map((s) => `${s.nombre} ${s.apellidos}`).join(', ')}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" onClick={abrirSeleccion} style={{ flex: 1, fontSize: 13 }}>Editar</Button>
              <Button variant="danger" disabled={guardando} onClick={handleEliminarTodo} style={{ flex: 1, fontSize: 13 }}>
                <Trash2 size={14} /> Eliminar asistencia
              </Button>
            </div>
          </div>
        )
      )}

      {modo === 'seleccionando' && (
        <div>
          <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>
            ¿Quién de tus carnets va?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {misSociosValidos.map((s) => {
              const marcado = seleccion.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleCheckbox(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                    background: marcado ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${marcado ? 'rgba(74,222,128,0.4)' : 'rgba(244,246,241,0.15)'}`,
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: marcado ? '#4ADE80' : 'transparent', border: marcado ? 'none' : '1.5px solid rgba(244,246,241,0.35)',
                  }}>
                    {marcado && <Check size={13} color={PALETTE.ink} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, color: PALETTE.chalk, fontFamily: fontStack.body }}>
                    {s.nombre} {s.apellidos} <span style={{ color: 'rgba(244,246,241,0.5)' }}>({formatNumeroSocio(s.numero_socio)})</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" disabled={guardando} onClick={() => setModo('resumen')} style={{ flex: 1 }}>Cancelar</Button>
            <Button variant="primary" disabled={guardando} onClick={handleGuardar} style={{ flex: 1 }}>
              {guardando ? 'Guardando...' : 'Confirmar asistencia'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
