import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from '../components/UI';
import { formatNumeroSocio, formatFecha, estadoMember, ESTADO_LABEL, ESTADO_COLOR } from '../lib/socios';
import { UserPlus, Check, X, Users, RefreshCw, FlaskConical, AlertTriangle } from 'lucide-react';

const TIPOS_SOCIO = ['General', 'Juvenil', 'Fundador', 'Honorífico'];

function tabPillStyle(active) {
  return {
    flex: 1, padding: '10px 0', borderRadius: 10,
    border: `1px solid ${active ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
    background: active ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
    fontFamily: fontStack.label, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };
}

export default function Admin() {
  const sesion = useSesion();
  const [socios, setSocios] = useState(undefined);
  const [tipoSeleccion, setTipoSeleccion] = useState({});
  const [procesando, setProcesando] = useState(null);
  const [tab, setTab] = useState('altas');

  const cargar = useCallback(async () => {
    if (!sesion) return;
    const { data, error } = await supabase.rpc('admin_listar_socios', { p_admin_id: sesion.id });
    if (!error) setSocios(data || []);
  }, [sesion]);

  useEffect(() => {
    if (!sesion || !sesion.is_admin) return;
    cargar();
    const interval = setInterval(cargar, 8000);
    return () => clearInterval(interval);
  }, [sesion, cargar]);

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
  }
  if (!sesion || !sesion.is_admin) {
    return (
      <Layout sesion={sesion}>
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(244,246,241,0.7)' }}>No tienes permiso para ver esta página.</div>
      </Layout>
    );
  }

  const pendientes = (socios || []).filter((s) => s.estado_solicitud === 'pendiente');
  const pendientesPago = (socios || []).filter((s) => s.estado_solicitud === 'aprobado' && estadoMember(s) === 'caducado');
  const resto = (socios || []).filter((s) => s.estado_solicitud !== 'pendiente' && !(s.estado_solicitud === 'aprobado' && estadoMember(s) === 'caducado'));

  const handleAprobar = async (s) => {
    setProcesando(s.id);
    await supabase.rpc('aprobar_socio', { p_admin_id: sesion.id, p_id: s.id, p_tipo: tipoSeleccion[s.id] || 'General' });
    setProcesando(null);
    cargar();
  };
  const handleRechazar = async (s) => {
    if (!confirm(`¿Rechazar la solicitud de ${s.nombre} ${s.apellidos}?`)) return;
    setProcesando(s.id);
    await supabase.rpc('rechazar_socio', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };
  const handleMarcarPagado = async (s) => {
    if (!confirm(`¿Confirmas que ${s.nombre} ${s.apellidos} ha pagado la cuota? Se renovará su carnet un año.`)) return;
    setProcesando(s.id);
    await supabase.rpc('marcar_pagado_y_renovar', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };
  const handleForzarCaducidad = async (s) => {
    if (!confirm(`[Prueba] ¿Forzar la caducidad de ${s.nombre} ${s.apellidos}?`)) return;
    setProcesando(s.id);
    await supabase.rpc('admin_forzar_caducidad', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '16px 14px 50px' }}>
        <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 20, marginBottom: 16 }}>
          Panel de socios {socios ? `(${resto.length})` : ''}
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setTab('altas')} style={tabPillStyle(tab === 'altas')}>
            Altas {pendientes.length > 0 ? `(${pendientes.length})` : ''}
          </button>
          <button onClick={() => setTab('renovaciones')} style={tabPillStyle(tab === 'renovaciones')}>
            Renov. {pendientesPago.length > 0 ? `(${pendientesPago.length})` : ''}
          </button>
          <button onClick={() => setTab('socios')} style={tabPillStyle(tab === 'socios')}>Socios</button>
        </div>

        {socios === undefined && <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 40 }}>Cargando...</div>}

        {socios !== undefined && tab === 'altas' && (
          pendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
              <UserPlus size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendientes.map((s) => {
                const tipoActual = tipoSeleccion[s.id] || 'General';
                return (
                  <div key={s.id} style={{ background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.4)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14 }}>{s.nombre} {s.apellidos}</div>
                      <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                        {formatNumeroSocio(s.numero_socio)} · solicitado {formatFecha(s.fecha_solicitud)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TIPOS_SOCIO.map((t) => (
                        <button key={t} onClick={() => setTipoSeleccion((prev) => ({ ...prev, [s.id]: t }))}
                          style={{ padding: '6px 11px', borderRadius: 999, fontFamily: fontStack.label, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            background: tipoActual === t ? PALETTE.stripe : 'rgba(255,255,255,0.06)', color: tipoActual === t ? PALETTE.chalk : 'rgba(244,246,241,0.75)',
                            border: `1px solid ${tipoActual === t ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}` }}>{t}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="primary" disabled={procesando === s.id} onClick={() => handleAprobar(s)} style={{ flex: 1, fontSize: 12.5 }}>
                        <Check size={14} /> Aceptar como {tipoActual}
                      </Button>
                      <Button variant="danger" disabled={procesando === s.id} onClick={() => handleRechazar(s)} style={{ fontSize: 12.5 }}>
                        <X size={14} /> Rechazar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {socios !== undefined && tab === 'renovaciones' && (
          pendientesPago.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
              <RefreshCw size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>No hay carnets pendientes de renovar.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendientesPago.map((s) => (
                <div key={s.id} style={{ background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.4)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14 }}>{s.nombre} {s.apellidos}</div>
                    <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                      {formatNumeroSocio(s.numero_socio)} · caducó {formatFecha(s.fecha_caducidad)}
                    </div>
                  </div>
                  <Button variant="primary" disabled={procesando === s.id} onClick={() => handleMarcarPagado(s)} style={{ fontSize: 12.5 }}>
                    <Check size={14} /> Marcar pagado y renovar
                  </Button>
                </div>
              ))}
            </div>
          )
        )}

        {socios !== undefined && tab === 'socios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resto.map((s) => {
              const est = estadoMember(s);
              const rechazado = s.estado_solicitud === 'rechazado';
              return (
                <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Users size={18} opacity={0.5} />
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>{s.nombre} {s.apellidos}</div>
                    <div style={{ fontSize: 12.5, color: rechazado ? '#ff8a8a' : ESTADO_COLOR[est], fontFamily: fontStack.label, fontWeight: 700 }}>
                      {formatNumeroSocio(s.numero_socio)} · {rechazado ? 'Rechazado' : ESTADO_LABEL[est]}
                    </div>
                  </div>
                  <button onClick={() => handleForzarCaducidad(s)} title="[Prueba] Forzar caducidad"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: PALETTE.brass, cursor: 'pointer' }}>
                    <FlaskConical size={15} style={{ margin: '0 auto' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
