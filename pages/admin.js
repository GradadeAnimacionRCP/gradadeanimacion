import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack, authCardStyle } from '../styles/tema';
import { Button } from '../components/UI';
import { formatNumeroSocio, formatFecha } from '../lib/socios';
import { UserPlus, Check, X, Users } from 'lucide-react';

const TIPOS_SOCIO = ['General', 'Juvenil', 'Fundador', 'Honorífico'];

export default function Admin() {
  const sesion = useSesion();
  const [socios, setSocios] = useState(undefined);
  const [tipoSeleccion, setTipoSeleccion] = useState({});
  const [procesando, setProcesando] = useState(null);

  const cargar = useCallback(async () => {
    if (!sesion) return;
    const { data, error } = await supabase.rpc('admin_listar_socios', { p_admin_id: sesion.id });
    if (!error) setSocios(data || []);
  }, [sesion]);

  useEffect(() => {
    if (sesion === null) return;
    if (sesion && !sesion.is_admin) return;
    cargar();
    const interval = setInterval(cargar, 8000);
    return () => clearInterval(interval);
  }, [sesion, cargar]);

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
  }
  if (sesion === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8a8a', fontFamily: fontStack.label }}>No se pudo comprobar tu sesión.</div>;
  }
  if (!sesion.is_admin) {
    return (
      <Layout sesion={sesion}>
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(244,246,241,0.7)' }}>No tienes permiso para ver esta página.</div>
      </Layout>
    );
  }

  const pendientes = (socios || []).filter((s) => s.estado_solicitud === 'pendiente');
  const resto = (socios || []).filter((s) => s.estado_solicitud !== 'pendiente');

  const handleAprobar = async (s) => {
    setProcesando(s.id);
    const tipo = tipoSeleccion[s.id] || 'General';
    await supabase.rpc('aprobar_socio', { p_admin_id: sesion.id, p_id: s.id, p_tipo: tipo });
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

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '16px 14px 50px' }}>
        <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 20, marginBottom: 16 }}>
          Panel de socios {socios ? `(${resto.length})` : ''}
        </h2>

        {pendientes.length > 0 && (
          <div style={{ background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.4)', borderRadius: 14, padding: 14, marginBottom: 20 }}>
            <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: '0 0 12px', color: PALETTE.chalk }}>
              Solicitudes pendientes ({pendientes.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendientes.map((s) => {
                const tipoActual = tipoSeleccion[s.id] || 'General';
                return (
                  <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14 }}>{s.nombre} {s.apellidos}</div>
                      <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                        {formatNumeroSocio(s.numero_socio)} · solicitado {formatFecha(s.fecha_solicitud)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TIPOS_SOCIO.map((t) => (
                        <button key={t} onClick={() => setTipoSeleccion((prev) => ({ ...prev, [s.id]: t }))}
                          style={{
                            padding: '6px 11px', borderRadius: 999, fontFamily: fontStack.label, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            background: tipoActual === t ? PALETTE.stripe : 'rgba(255,255,255,0.06)',
                            color: tipoActual === t ? PALETTE.chalk : 'rgba(244,246,241,0.75)',
                            border: `1px solid ${tipoActual === t ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
                          }}>{t}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="primary" disabled={procesando === s.id} onClick={() => handleAprobar(s)} style={{ padding: '7px 12px', fontSize: 12.5, flex: 1 }}>
                        <Check size={14} /> Aceptar como {tipoActual}
                      </Button>
                      <Button variant="danger" disabled={procesando === s.id} onClick={() => handleRechazar(s)} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                        <X size={14} /> Rechazar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {socios === undefined && <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 40 }}>Cargando...</div>}

        {socios !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resto.map((s) => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={18} opacity={0.5} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>{s.nombre} {s.apellidos}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.65)', fontFamily: fontStack.label }}>
                    {formatNumeroSocio(s.numero_socio)} · {s.estado_solicitud === 'rechazado' ? 'Rechazado' : (s.tipo || 'General')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
