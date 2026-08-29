import { EditarSocioModal } from '../components/EditarSocioModal';
import { PartidoModal } from '../components/PartidoModal';
import { NoticiaModal } from '../components/NoticiaModal';
import { PanelTemporada } from '../components/PanelTemporada';
import { Pencil, Trash2, Calendar, Plus, Newspaper, UserCog, ShieldCheck, Camera } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button } from '../components/UI';
import { formatNumeroSocio, formatFecha, estadoMember, ESTADO_LABEL, ESTADO_COLOR } from '../lib/socios';
import { formatFechaPartido } from '../components/PartidoCard';
import { UserPlus, Check, X, Users, RefreshCw, AlertTriangle } from 'lucide-react';

const TIPOS_SOCIO = ['General', 'Juvenil', 'Fundador', 'Honorífico'];

function filtrar(lista, query, campoFn) {
  const q = query.trim().toLowerCase();
  if (!q) return lista;
  return lista.filter((item) => campoFn(item).toLowerCase().includes(q));
}

export default function Admin() {
  const sesion = useSesion();
  const [socios, setSocios] = useState(undefined);
  const [tipoSeleccion, setTipoSeleccion] = useState({});
  const [procesando, setProcesando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [tab, setTab] = useState('altas');

  const [partidos, setPartidos] = useState(undefined);
  const [editandoPartido, setEditandoPartido] = useState(null);

  const [noticias, setNoticias] = useState(undefined);
  const [editandoNoticia, setEditandoNoticia] = useState(null);

  const [usuarios, setUsuarios] = useState(undefined);
  const [tempPasswords, setTempPasswords] = useState({});

  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const [querySolicitudes, setQuerySolicitudes] = useState('');
  const [queryRenovaciones, setQueryRenovaciones] = useState('');
  const [querySocios, setQuerySocios] = useState('');
  const [queryUsuarios, setQueryUsuarios] = useState('');

  const cargar = useCallback(async () => {
    if (!sesion) return;
    const { data, error } = await supabase.rpc('admin_listar_socios', { p_admin_id: sesion.id });
    if (!error) setSocios(data || []);
  }, [sesion]);

  const cargarPartidos = useCallback(async () => {
    const { data } = await supabase.from('partidos').select('*').order('fecha', { ascending: true, nullsFirst: false });
    setPartidos(data || []);
  }, []);

  const cargarNoticias = useCallback(async () => {
    const { data } = await supabase.from('noticias').select('*').order('fecha', { ascending: false });
    setNoticias(data || []);
  }, []);

  const cargarUsuarios = useCallback(async () => {
    if (!sesion) return;
    const { data, error } = await supabase.rpc('admin_listar_usuarios', { p_admin_id: sesion.id });
    if (!error) setUsuarios(data || []);
  }, [sesion]);

  useEffect(() => {
    if (!sesion || !sesion.is_admin) return;
    cargar();
    cargarPartidos();
    cargarNoticias();
    cargarUsuarios();
    const interval = setInterval(cargar, 8000);
    return () => clearInterval(interval);
  }, [sesion, cargar, cargarPartidos, cargarNoticias, cargarUsuarios]);

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
  const traspasos = (socios || []).filter((s) => s.traspaso_cuenta_destino);
  const resto = (socios || []).filter((s) =>
    s.estado_solicitud !== 'pendiente' &&
    !(s.estado_solicitud === 'aprobado' && estadoMember(s) === 'caducado') &&
    !s.traspaso_cuenta_destino
  );

  const campoBusqueda = (s) => `${s.nombre} ${s.apellidos} ${formatNumeroSocio(s.numero_socio)}`;
  const pendientesFiltrados = filtrar(pendientes, querySolicitudes, campoBusqueda);
  const pendientesPagoFiltrados = filtrar(pendientesPago, queryRenovaciones, campoBusqueda);
  const restoFiltrado = filtrar(resto, querySocios, campoBusqueda);
  const usuariosFiltrados = filtrar(usuarios || [], queryUsuarios, (u) => u.usuario);

  const ADMIN_TABS = [
    { id: 'altas', label: 'Altas', icon: UserPlus, badge: pendientes.length },
    { id: 'renovaciones', label: 'Renovaciones', icon: RefreshCw, badge: pendientesPago.length },
    { id: 'socios', label: 'Socios', icon: Users, badge: traspasos.length },
    { id: 'calendario', label: 'Calendario', icon: Calendar, badge: 0 },
    { id: 'noticias', label: 'Noticias', icon: Newspaper, badge: 0 },
    { id: 'usuarios', label: 'Usuarios', icon: UserCog, badge: (usuarios || []).filter((u) => u.reset_requested).length },
    { id: 'temporada', label: 'Temporada', icon: Camera, badge: 0 },
    { id: 'verificar', label: 'Comprobar', icon: ShieldCheck, badge: 0 },
  ];

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
  const handleToggleActivo = async (s) => {
    setProcesando(s.id);
    await supabase.rpc('admin_toggle_activo', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };
  const handleEliminar = async (s) => {
    if (!confirm(`¿Eliminar el carnet ${formatNumeroSocio(s.numero_socio)} (${s.nombre} ${s.apellidos})? Esta acción no se puede deshacer.`)) return;
    setProcesando(s.id);
    await supabase.rpc('admin_eliminar_socio', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };
  const handleAceptarTraspaso = async (s) => {
    if (!confirm(`¿Trasladar el carnet ${formatNumeroSocio(s.numero_socio)} (${s.nombre} ${s.apellidos}) a la nueva cuenta? La cuenta anterior dejará de tener acceso a él.`)) return;
    setProcesando(s.id);
    await supabase.rpc('admin_confirmar_traspaso', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };
  const handleRechazarTraspaso = async (s) => {
    if (!confirm(`¿Rechazar la solicitud de traspaso del carnet ${formatNumeroSocio(s.numero_socio)}? Seguirá en la cuenta actual.`)) return;
    setProcesando(s.id);
    await supabase.rpc('admin_rechazar_traspaso', { p_admin_id: sesion.id, p_id: s.id });
    setProcesando(null);
    cargar();
  };

  const handleEliminarPartido = async (p) => {
    if (!confirm(`¿Eliminar el partido contra ${p.rival}?`)) return;
    await supabase.from('partidos').delete().eq('id', p.id);
    cargarPartidos();
  };

  const handleEliminarNoticia = async (n) => {
    if (!confirm(`¿Eliminar la noticia "${n.titulo}"?`)) return;
    await supabase.from('noticias').delete().eq('id', n.id);
    cargarNoticias();
  };

  const handleAsignarTemporal = async (u) => {
    const valor = (tempPasswords[u.id] || '').trim();
    if (valor.length < 4) return;
    if (!confirm(`¿Asignar "${valor}" como contraseña temporal de ${u.usuario}? Debes comunicársela tú por otro medio.`)) return;
    await supabase.rpc('asignar_password_temporal', { p_admin_id: sesion.id, p_id: u.id, p_temp: valor });
    setTempPasswords((prev) => ({ ...prev, [u.id]: '' }));
    cargarUsuarios();
  };
  const handleToggleAdmin = async (u) => {
    const mensaje = u.is_admin ? `¿Quitar el acceso de administrador a ${u.usuario}?` : `¿Convertir a ${u.usuario} en administrador?`;
    if (!confirm(mensaje)) return;
    await supabase.rpc('admin_toggle_admin', { p_admin_id: sesion.id, p_target_id: u.id });
    cargarUsuarios();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const numero = parseInt(verifyId.trim().toUpperCase().replace('GDA-', ''), 10);
    const { data } = await supabase.rpc('buscar_socio', { p_numero: numero, p_apellidos: '' });
    setVerifyResult(data && data[0] ? data[0] : 'not-found');
  };

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '16px 14px 50px' }}>
        <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 20, marginBottom: 16 }}>
          Panel de socios {socios ? `(${resto.length})` : ''}
        </h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}>
          {ADMIN_TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                position: 'relative', flex: '0 0 auto', minWidth: 76, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 5, padding: '10px 10px', borderRadius: 12, cursor: 'pointer',
                background: active ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? PALETTE.stripe : 'rgba(244,246,241,0.12)'}`,
                color: active ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
              }}>
                {t.badge > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6, minWidth: 16, height: 16, borderRadius: 999,
                    background: PALETTE.flare, color: PALETTE.chalk, fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    fontFamily: fontStack.label, boxShadow: `0 0 0 2px ${PALETTE.pitchDark}`,
                  }}>
                    {t.badge > 99 ? '99+' : t.badge}
                  </span>
                )}
                <Icon size={19} />
                <span style={{ fontFamily: fontStack.label, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {socios === undefined && (tab === 'altas' || tab === 'renovaciones' || tab === 'socios') && (
          <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 40 }}>Cargando...</div>
        )}

        {socios !== undefined && tab === 'altas' && (
          <>
            {pendientes.length > 3 && (
              <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Buscar por nombre o número..."
                value={querySolicitudes} onChange={(e) => setQuerySolicitudes(e.target.value)} />
            )}
            {pendientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
                <UserPlus size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>No hay solicitudes pendientes.</p>
              </div>
            ) : pendientesFiltrados.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center', padding: '6px 0' }}>Ningún resultado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendientesFiltrados.map((s) => {
                  const tipoActual = tipoSeleccion[s.id] || 'General';
                  return (
                    <div key={s.id} style={{ background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.4)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.foto ? <img src={s.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} opacity={0.5} />}
                        </div>
                        <div>
                          <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14 }}>{s.nombre} {s.apellidos}</div>
                          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                            {formatNumeroSocio(s.numero_socio)} · solicitado {formatFecha(s.fecha_solicitud)}
                          </div>
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
            )}
          </>
        )}

        {socios !== undefined && tab === 'renovaciones' && (
          <>
            {pendientesPago.length > 3 && (
              <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Buscar por nombre o número..."
                value={queryRenovaciones} onChange={(e) => setQueryRenovaciones(e.target.value)} />
            )}
            {pendientesPago.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
                <RefreshCw size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>No hay carnets pendientes de renovar.</p>
              </div>
            ) : pendientesPagoFiltrados.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center', padding: '6px 0' }}>Ningún resultado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendientesPagoFiltrados.map((s) => (
                  <div key={s.id} style={{ background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.4)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
                    {s.solicitud_renovacion_fecha && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(201,162,75,0.08)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: 10, padding: '8px 10px' }}>
                        {s.solicitud_renovacion_comprobante && (
                          <img src={s.solicitud_renovacion_comprobante} alt="Comprobante"
                            onClick={() => setImagenAmpliada(s.solicitud_renovacion_comprobante)}
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: `1px solid ${PALETTE.brass}`, cursor: 'pointer' }} />
                        )}
                        <div style={{ fontSize: 12, color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700 }}>
                          Solicitó renovación el {formatFecha(s.solicitud_renovacion_fecha)}
                          {!s.solicitud_renovacion_comprobante && ' · sin comprobante'}
                          {s.solicitud_renovacion_comprobante && ' · toca la foto para ampliarla'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {socios !== undefined && tab === 'socios' && (
          <>
            {traspasos.length > 0 && (
              <div style={{ background: 'rgba(30,120,220,0.08)', border: '1px solid rgba(80,150,255,0.4)', borderRadius: 14, padding: 14, marginBottom: 20 }}>
                <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: '0 0 8px', color: PALETTE.chalk }}>
                  Solicitudes de traspaso ({traspasos.length})
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 12, lineHeight: 1.5 }}>
                  Alguien ha pedido usar uno de estos carnets desde otra cuenta. Es personal e intransferible: solo pasa si lo confirmas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {traspasos.map((s) => (
                    <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14 }}>{s.nombre} {s.apellidos}</div>
                        <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                          {formatNumeroSocio(s.numero_socio)} · solicitado {formatFecha(s.traspaso_fecha)}
                        </div>
                      </div>
                      <Button variant="primary" disabled={procesando === s.id} onClick={() => handleAceptarTraspaso(s)} style={{ fontSize: 12.5 }}>
                        <Check size={14} /> Confirmar
                      </Button>
                      <Button variant="danger" disabled={procesando === s.id} onClick={() => handleRechazarTraspaso(s)} style={{ fontSize: 12.5 }}>
                        <X size={14} /> Rechazar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resto.length > 3 && (
              <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Buscar por nombre o número..."
                value={querySocios} onChange={(e) => setQuerySocios(e.target.value)} />
            )}
            {resto.length > 0 && restoFiltrado.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center', padding: '6px 0' }}>Ningún resultado.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {restoFiltrado.map((s) => {
                const est = estadoMember(s);
                const rechazado = s.estado_solicitud === 'rechazado';
                return (
                  <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.foto ? <img src={s.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={16} opacity={0.5} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>{s.nombre} {s.apellidos}</div>
                      <div style={{ fontSize: 12.5, color: rechazado ? '#ff8a8a' : ESTADO_COLOR[est], fontFamily: fontStack.label, fontWeight: 700 }}>
                        {formatNumeroSocio(s.numero_socio)} · {rechazado ? 'Rechazado' : ESTADO_LABEL[est]}
                      </div>
                    </div>
                    <button onClick={() => setEditando(s)} title="Editar"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: PALETTE.chalk, cursor: 'pointer' }}>
                      <Pencil size={15} style={{ margin: '0 auto' }} />
                    </button>
                    <button onClick={() => handleToggleActivo(s)} title="Activar/Suspender"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: PALETTE.chalk, cursor: 'pointer' }}>
                      {s.activo === false ? <Check size={15} style={{ margin: '0 auto' }} /> : <AlertTriangle size={15} style={{ margin: '0 auto' }} />}
                    </button>
                    <button onClick={() => handleEliminar(s)} title="Eliminar"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: '#ff8a8a', cursor: 'pointer' }}>
                      <Trash2 size={15} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'calendario' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: fontStack.heading, fontSize: 16, margin: 0, color: PALETTE.chalk }}>
                Calendario ({partidos === undefined ? '…' : partidos.length})
              </h3>
              <Button variant="brass" onClick={() => setEditandoPartido({})} style={{ padding: '7px 12px', fontSize: 13 }}>
                <Plus size={15} /> Añadir
              </Button>
            </div>

            {partidos === undefined && <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 30 }}>Cargando...</div>}

            {partidos !== undefined && partidos.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
                <Calendar size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>Todavía no has añadido ningún partido.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(partidos || []).map((p) => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>{p.es_local ? '🏠' : '✈️'} vs {p.rival}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
                      {formatFechaPartido(p.fecha, p.hora)}{p.jornada ? ` · Jornada ${p.jornada}` : ''}{p.resultado ? ` · ${p.resultado}` : ''}
                    </div>
                  </div>
                  <button onClick={() => setEditandoPartido(p)} title="Editar"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: PALETTE.chalk, cursor: 'pointer' }}>
                    <Pencil size={15} style={{ margin: '0 auto' }} />
                  </button>
                  <button onClick={() => handleEliminarPartido(p)} title="Eliminar"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: '#ff8a8a', cursor: 'pointer' }}>
                    <Trash2 size={15} style={{ margin: '0 auto' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'noticias' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: fontStack.heading, fontSize: 16, margin: 0, color: PALETTE.chalk }}>
                Noticias ({noticias === undefined ? '…' : noticias.length})
              </h3>
              <Button variant="brass" onClick={() => setEditandoNoticia({})} style={{ padding: '7px 12px', fontSize: 13 }}>
                <Plus size={15} /> Publicar
              </Button>
            </div>

            {noticias === undefined && <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 30 }}>Cargando...</div>}
            {noticias !== undefined && noticias.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.55)' }}>
                <Newspaper size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>Todavía no has publicado ninguna noticia.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(noticias || []).map((n) => (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {n.imagen && <img src={n.imagen} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>{n.titulo}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>{formatFecha(n.fecha)}</div>
                  </div>
                  <button onClick={() => setEditandoNoticia(n)} title="Editar"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: PALETTE.chalk, cursor: 'pointer' }}>
                    <Pencil size={15} style={{ margin: '0 auto' }} />
                  </button>
                  <button onClick={() => handleEliminarNoticia(n)} title="Eliminar"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 32, height: 32, color: '#ff8a8a', cursor: 'pointer' }}>
                    <Trash2 size={15} style={{ margin: '0 auto' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'usuarios' && (
          <div>
            <h3 style={{ fontFamily: fontStack.heading, fontSize: 16, margin: '0 0 14px', color: PALETTE.chalk }}>
              Cuentas registradas ({usuarios === undefined ? '…' : usuarios.length})
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)', marginTop: -8, marginBottom: 14, lineHeight: 1.5 }}>
              Este número cuenta personas registradas (usuarios), no carnets.
            </p>

            {(usuarios || []).length > 3 && (
              <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Buscar por usuario..."
                value={queryUsuarios} onChange={(e) => setQueryUsuarios(e.target.value)} />
            )}

            {usuarios === undefined && <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 30 }}>Cargando...</div>}
            {usuarios !== undefined && usuarios.length > 0 && usuariosFiltrados.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center', padding: '6px 0' }}>Ningún resultado.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {usuariosFiltrados.map((u) => (
                <div key={u.id} style={{
                  background: u.reset_requested ? 'rgba(255,90,31,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${u.reset_requested ? 'rgba(255,90,31,0.4)' : 'rgba(244,246,241,0.1)'}`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5 }}>
                        {u.usuario} {u.is_admin && <span style={{ color: PALETTE.brass, fontSize: 11.5, fontFamily: fontStack.label, fontWeight: 700 }}>· ADMIN</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label }}>
                        Registrado {formatFecha(u.created_at)}
                      </div>
                    </div>
                    <Button variant={u.is_admin ? 'ghost' : 'brass'} onClick={() => handleToggleAdmin(u)} style={{ padding: '6px 11px', fontSize: 12.5 }}>
                      {u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                    </Button>
                  </div>

                  {u.reset_requested && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,90,31,0.25)' }}>
                      <div style={{ fontSize: 12.5, color: PALETTE.flare, fontWeight: 700, marginBottom: 8, fontFamily: fontStack.label }}>
                        ⚠ Ha solicitado recuperar su contraseña
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13.5 }} placeholder="Contraseña temporal"
                          value={tempPasswords[u.id] || ''} onChange={(e) => setTempPasswords((prev) => ({ ...prev, [u.id]: e.target.value }))} />
                        <Button variant="primary" onClick={() => handleAsignarTemporal(u)} style={{ padding: '8px 12px', fontSize: 12.5 }}>Asignar</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'temporada' && <PanelTemporada />}

        {tab === 'verificar' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShieldCheck size={17} color={PALETTE.brass} />
              <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: 0, color: PALETTE.chalk }}>Comprobar validez de un carnet</h3>
            </div>
            <form onSubmit={handleVerify} style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="GDA-0001" value={verifyId} onChange={(e) => setVerifyId(e.target.value)} />
              <Button type="submit" variant="primary" style={{ padding: '10px 14px' }}>Buscar</Button>
            </form>
            {verifyResult === 'not-found' && <div style={{ color: '#ff8a8a', marginTop: 10, fontSize: 13.5 }}>No existe ningún carnet con ese número.</div>}
            {verifyResult && verifyResult !== 'not-found' && (
              <div style={{ marginTop: 12, fontSize: 14, color: PALETTE.chalk }}>
                <div><strong>{verifyResult.nombre} {verifyResult.apellidos}</strong></div>
                <div style={{ color: 'rgba(244,246,241,0.65)' }}>Alta: {formatFecha(verifyResult.fecha_alta)}</div>
                {verifyResult.estado_solicitud === 'pendiente' && <div style={{ color: PALETTE.brass, fontWeight: 700, marginTop: 4 }}>⏳ Pendiente de validar</div>}
                {verifyResult.estado_solicitud === 'rechazado' && <div style={{ color: '#ff8a8a', fontWeight: 700, marginTop: 4 }}>✕ Rechazado</div>}
                {verifyResult.estado_solicitud === 'aprobado' && (
                  <>
                    <div style={{ color: 'rgba(244,246,241,0.65)' }}>Válido hasta: {formatFecha(verifyResult.fecha_caducidad)}</div>
                    <div style={{ color: ESTADO_COLOR[estadoMember(verifyResult)], fontWeight: 700, marginTop: 4 }}>
                      {estadoMember(verifyResult) === 'activo' ? '✓ Carnet válido' : `⚠ Carnet ${ESTADO_LABEL[estadoMember(verifyResult)].toLowerCase()}`}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {editando && (
        <EditarSocioModal socio={editando} adminId={sesion.id} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); cargar(); }} />
      )}
      {editandoPartido && (
        <PartidoModal partido={editandoPartido} onClose={() => setEditandoPartido(null)} onSaved={() => { setEditandoPartido(null); cargarPartidos(); }} />
      )}
      {editandoNoticia && (
        <NoticiaModal noticia={editandoNoticia} onClose={() => setEditandoNoticia(null)} onSaved={() => { setEditandoNoticia(null); cargarNoticias(); }} />
      )}
      {imagenAmpliada && (
        <div onClick={() => setImagenAmpliada(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 95,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'pointer',
        }}>
          <img src={imagenAmpliada} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
        </div>
      )}
    </Layout>
  );
}
