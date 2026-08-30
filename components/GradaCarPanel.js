import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { formatNumeroSocio } from '../lib/socios';
import { Car, Users, Plus, Trash2, Check, X, MessageCircle, CheckCircle2 } from 'lucide-react';

function limpiarTelefono(t) {
  return t.replace(/[^\d+]/g, '');
}

async function enviarPushCoche({ cuentaId, title, body }) {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuentaId, title, body, url: '/calendario' }),
    });
  } catch (err) {
    console.error('No se pudo enviar el aviso:', err);
  }
}

function FotoMini({ foto, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'rgba(201,162,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${PALETTE.brass}55`,
    }}>
      {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Car size={size * 0.48} color={PALETTE.brass} />}
    </div>
  );
}

function ViajeCard({ viaje, sesion, misSocios, esMio, onCambio, confirm }) {
  const [expandido, setExpandido] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [solicitantes, setSolicitantes] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccion, setSeleccion] = useState(new Set());
  const [justoSolicitado, setJustoSolicitado] = useState(false);

  const completo = viaje.plazas_ocupadas >= viaje.plazas_totales;
  const plazasLibres = viaje.plazas_totales - viaje.plazas_ocupadas;

  const cargarMisSolicitudes = useCallback(async () => {
    const { data } = await supabase.rpc('mis_solicitudes_coche', { p_cuenta_id: sesion.id, p_partido_id: viaje.partido_id });
    setMisSolicitudes((data || []).filter((s) => s.viaje_id === viaje.id));
  }, [sesion.id, viaje.id, viaje.partido_id]);

  useEffect(() => { cargarMisSolicitudes(); }, [cargarMisSolicitudes]);

  const cargarSolicitantes = useCallback(async () => {
    const { data } = await supabase.rpc('listar_solicitudes_de_viaje', { p_cuenta_id: sesion.id, p_viaje_id: viaje.id });
    setSolicitantes(data || []);
  }, [sesion.id, viaje.id]);

  const handleAbrirSolicitantes = () => {
    const nuevoEstado = !expandido;
    setExpandido(nuevoEstado);
    if (nuevoEstado) cargarSolicitantes();
  };

  const handleResponder = async (solicitud, aceptar) => {
    setProcesando(true);
    const { error } = await supabase.rpc('responder_solicitud', { p_cuenta_id: sesion.id, p_solicitud_id: solicitud.id, p_aceptar: aceptar });
    setProcesando(false);
    if (error) { alert(error.message); return; }
    if (aceptar) {
      enviarPushCoche({
        cuentaId: solicitud.cuenta_id,
        title: '✅ ¡Plaza confirmada!',
        body: `El conductor ha confirmado tu plaza para el próximo partido.`,
      });
    }
    cargarSolicitantes();
    onCambio();
  };

  const handleEliminarViaje = async () => {
    if (!(await confirm('¿Eliminar este anuncio de coche compartido?'))) return;
    await supabase.rpc('eliminar_viaje_coche', { p_cuenta_id: sesion.id, p_viaje_id: viaje.id });
    onCambio();
  };

  const handleContactar = async () => {
    const { data: telefono } = await supabase.rpc('obtener_telefono_viaje', { p_viaje_id: viaje.id });
    if (!telefono) return;
    window.open(`https://wa.me/${limpiarTelefono(telefono)}`, '_blank');
  };

  const handleCancelar = async (solicitudId) => {
    if (!(await confirm('¿Cancelar tu solicitud de plaza?'))) return;
    setProcesando(true);
    await supabase.rpc('cancelar_solicitud', { p_cuenta_id: sesion.id, p_solicitud_id: solicitudId });
    setProcesando(false);
    setJustoSolicitado(false);
    cargarMisSolicitudes();
    onCambio();
  };

  const misSociosValidos = (misSocios || []).filter((s) => s.estado_solicitud === 'aprobado');
  const idsYaSolicitados = new Set(misSolicitudes.map((s) => s.socio_id));
  const misSociosDisponibles = misSociosValidos.filter((s) => !idsYaSolicitados.has(s.id));

  const abrirSeleccion = () => {
    setSeleccion(new Set());
    setJustoSolicitado(false);
    setSeleccionando(true);
  };

  const toggleCheckbox = (socioId) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(socioId)) nuevo.delete(socioId);
      else nuevo.add(socioId);
      return nuevo;
    });
  };

  const handleConfirmarSolicitud = async () => {
    if (seleccion.size === 0) return;
    setProcesando(true);
    const nombres = [];
    for (const socioId of seleccion) {
      await supabase.rpc('solicitar_plaza', { p_cuenta_id: sesion.id, p_socio_id: socioId, p_viaje_id: viaje.id });
      const socio = misSociosValidos.find((s) => s.id === socioId);
      if (socio) nombres.push(`${socio.nombre} ${socio.apellidos}`);
    }
    setProcesando(false);
    setSeleccionando(false);
    setJustoSolicitado(true);
    cargarMisSolicitudes();
    onCambio();

    enviarPushCoche({
      cuentaId: viaje.cuenta_id,
      title: '🚗 Nueva petición de plaza',
      body: `${nombres.join(', ')} ${nombres.length === 1 ? 'quiere' : 'quieren'} ir en tu coche al próximo partido.`,
    });
  };

  return (
    <div style={{
      background: completo ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${completo ? 'rgba(244,246,241,0.08)' : 'rgba(201,162,75,0.3)'}`,
      borderRadius: 16, padding: 16, position: 'relative', opacity: completo ? 0.7 : 1,
    }}>
      {completo && (
        <div style={{
          position: 'absolute', top: 14, right: 14, background: 'rgba(200,30,44,0.9)', color: PALETTE.chalk,
          fontFamily: fontStack.label, fontWeight: 800, fontSize: 11, letterSpacing: 1, padding: '3px 10px',
          borderRadius: 6, textTransform: 'uppercase',
        }}>
          Completo
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, filter: completo ? 'grayscale(1)' : 'none' }}>
        <FotoMini foto={viaje.conductor_foto} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 14.5, color: PALETTE.chalk }}>
            {viaje.conductor_nombre} {viaje.conductor_apellidos || ''}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} /> {plazasLibres > 0 ? `${plazasLibres} de ${viaje.plazas_totales} plazas libres` : `${viaje.plazas_totales} plazas · completo`}
          </div>
        </div>
        {viaje.precio && (
          <div style={{ fontFamily: fontStack.label, fontWeight: 800, fontSize: 15, color: completo ? 'rgba(244,246,241,0.4)' : PALETTE.brass }}>
            {Number(viaje.precio).toFixed(2)} €
          </div>
        )}
      </div>

      {viaje.comentario && (
        <p style={{ fontSize: 13, color: 'rgba(244,246,241,0.7)', margin: '0 0 12px', lineHeight: 1.5 }}>{viaje.comentario}</p>
      )}

      {esMio ? (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: expandido ? 10 : 0 }}>
            <Button variant="ghost" onClick={handleAbrirSolicitantes} style={{ flex: 1, fontSize: 12.5 }}>
              Ver solicitudes
            </Button>
            <Button variant="danger" onClick={handleEliminarViaje} style={{ fontSize: 12.5 }}>
              <Trash2 size={14} />
            </Button>
          </div>
          {expandido && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {solicitantes === null ? (
                <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center' }}>Cargando...</p>
              ) : solicitantes.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center' }}>Nadie ha pedido plaza todavía.</p>
              ) : (
                solicitantes.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>
                    <FotoMini foto={s.foto} size={32} />
                    <span style={{ flex: 1, fontSize: 13, color: PALETTE.chalk }}>{s.nombre} {s.apellidos}</span>
                    {s.estado === 'pendiente' ? (
                      <>
                        <button onClick={() => handleResponder(s, true)} disabled={procesando} style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 8, width: 30, height: 30, color: '#4ADE80', cursor: 'pointer' }}>
                          <Check size={14} style={{ margin: '0 auto' }} />
                        </button>
                        <button onClick={() => handleResponder(s, false)} disabled={procesando} style={{ background: 'rgba(200,30,44,0.15)', border: '1px solid rgba(200,30,44,0.4)', borderRadius: 8, width: 30, height: 30, color: '#ff8a8a', cursor: 'pointer' }}>
                          <X size={14} style={{ margin: '0 auto' }} />
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: fontStack.label, color: s.estado === 'aceptado' ? '#4ADE80' : '#ff8a8a', textTransform: 'uppercase' }}>
                        {s.estado === 'aceptado' ? 'Aceptado' : 'Rechazado'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {justoSolicitado && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.35)', borderRadius: 10, padding: '10px 12px', marginBottom: 10,
            }}>
              <CheckCircle2 size={16} color="#4ADE80" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ color: '#4ADE80', fontFamily: fontStack.label, fontWeight: 700, fontSize: 12.5 }}>
                Solicitud enviada. El conductor la confirmará en breve.
              </div>
            </div>
          )}

          {misSolicitudes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {misSolicitudes.map((s) => {
                const socio = misSociosValidos.find((m) => m.id === s.socio_id);
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>
                    <span style={{ flex: 1, fontSize: 12.5, color: PALETTE.chalk }}>{socio ? `${socio.nombre} ${socio.apellidos}` : 'Tu carnet'}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontFamily: fontStack.label, textTransform: 'uppercase',
                      color: s.estado === 'aceptado' ? '#4ADE80' : s.estado === 'rechazado' ? '#ff8a8a' : PALETTE.brass,
                    }}>
                      {s.estado === 'aceptado' ? 'Confirmado' : s.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                    <button onClick={() => handleCancelar(s.id)} disabled={procesando} style={{ background: 'none', border: 'none', color: 'rgba(244,246,241,0.5)', cursor: 'pointer', padding: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!completo && misSociosDisponibles.length > 0 && (
            !seleccionando ? (
              <Button variant="brass" onClick={abrirSeleccion} style={{ width: '100%', fontSize: 13, marginBottom: 8 }}>
                <Users size={14} /> Pedir plaza
              </Button>
            ) : (
              <div style={{ marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label, marginBottom: 8 }}>
                  Marca los carnets con los que quieres ir (máx. {plazasLibres} plaza{plazasLibres === 1 ? '' : 's'} libre{plazasLibres === 1 ? '' : 's'})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {misSociosDisponibles.map((s) => {
                    const marcado = seleccion.has(s.id);
                    const alcanzoLimite = seleccion.size >= plazasLibres && !marcado;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !alcanzoLimite && toggleCheckbox(s.id)}
                        disabled={alcanzoLimite}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                          cursor: alcanzoLimite ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%',
                          background: marcado ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${marcado ? 'rgba(74,222,128,0.4)' : 'rgba(244,246,241,0.15)'}`,
                          opacity: alcanzoLimite ? 0.4 : 1,
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: marcado ? '#4ADE80' : 'transparent', border: marcado ? 'none' : '1.5px solid rgba(244,246,241,0.35)',
                        }}>
                          {marcado && <Check size={13} color={PALETTE.ink} strokeWidth={3} />}
                        </div>
                        <FotoMini foto={s.foto} size={28} />
                        <span style={{ fontSize: 13, color: PALETTE.chalk }}>
                          {s.nombre} {s.apellidos} <span style={{ color: 'rgba(244,246,241,0.5)' }}>({formatNumeroSocio(s.numero_socio)})</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="ghost" disabled={procesando} onClick={() => setSeleccionando(false)} style={{ flex: 1, fontSize: 12.5 }}>Cancelar</Button>
                  <Button variant="primary" disabled={procesando || seleccion.size === 0} onClick={handleConfirmarSolicitud} style={{ flex: 1, fontSize: 12.5 }}>
                    {procesando ? 'Enviando...' : `Pedir ${seleccion.size || ''} plaza${seleccion.size === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </div>
            )
          )}

          <Button variant="ghost" onClick={handleContactar} style={{ width: '100%', fontSize: 13 }}>
            <MessageCircle size={15} /> Contactar por WhatsApp
          </Button>
        </div>
      )}
    </div>
  );
}

function NuevoViajeForm({ partidoId, sesion, misSocios, onCreado, onCancelar }) {
  const misSociosValidos = (misSocios || []).filter((s) => s.estado_solicitud === 'aprobado');
  const [socioId, setSocioId] = useState(misSociosValidos[0]?.id || '');
  const [plazas, setPlazas] = useState('');
  const [precio, setPrecio] = useState('');
  const [comentario, setComentario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleCrear = async () => {
    setError('');
    if (!socioId || !plazas || !telefono.trim()) {
      setError('Elige tu carnet, las plazas y el teléfono.');
      return;
    }
    setGuardando(true);
    const { error: dbError } = await supabase.rpc('crear_viaje_coche', {
      p_cuenta_id: sesion.id, p_partido_id: partidoId, p_socio_id: socioId,
      p_plazas: parseInt(plazas, 10), p_precio: precio ? parseFloat(precio) : null,
      p_comentario: comentario.trim() || null, p_telefono: telefono.trim(),
    });
    setGuardando(false);
    if (dbError) { setError(dbError.message); return; }

    enviarPushCoche({
      title: '🚗 Nuevo coche disponible',
      body: 'Alguien ha ofrecido coche compartido para el próximo partido. Échale un vistazo en GradaCar.',
    });

    onCreado();
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: 16, padding: 16 }}>
      <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 15, color: PALETTE.chalk, marginBottom: 12 }}>
        Ofrecer coche
      </div>

      {misSociosValidos.length > 1 && (
        <Field label="Tu carnet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {misSociosValidos.map((s) => (
              <button key={s.id} onClick={() => setSocioId(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                background: socioId === s.id ? 'rgba(201,162,75,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${socioId === s.id ? PALETTE.brass : 'rgba(244,246,241,0.15)'}`,
                textAlign: 'left', color: PALETTE.chalk, fontSize: 13,
              }}>
                <FotoMini foto={s.foto} size={28} />
                {s.nombre} {s.apellidos}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Plazas disponibles">
        <input type="number" min="1" style={inputStyle} value={plazas} onChange={(e) => setPlazas(e.target.value)} placeholder="Ej. 3" />
      </Field>
      <Field label="Precio por persona (opcional)">
        <input type="number" step="0.01" min="0" style={inputStyle} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej. 5.00" />
      </Field>
      <Field label="Comentario (opcional)">
        <input style={inputStyle} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej. Salgo desde la Plaza del Ayuntamiento" />
      </Field>
      <Field label="Tu teléfono de WhatsApp (solo lo verán quienes pidan plaza)">
        <input type="tel" style={inputStyle} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 600123456" />
      </Field>
      {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ghost" onClick={onCancelar} disabled={guardando} style={{ flex: 1 }}>Cancelar</Button>
        <Button variant="primary" onClick={handleCrear} disabled={guardando} style={{ flex: 1 }}>
          {guardando ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
}

export function GradaCarPanel({ partidoId, sesion, misSocios, confirm }) {
  const [viajes, setViajes] = useState(undefined);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('listar_viajes_coche', { p_partido_id: partidoId });
    setViajes(data || []);
  }, [partidoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const misSociosValidos = (misSocios || []).filter((s) => s.estado_solicitud === 'aprobado');
  if (misSociosValidos.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {viajes === undefined ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.5)' }}>Cargando...</div>
      ) : viajes.length === 0 && !creando ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
          <Car size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
          <p style={{ fontSize: 13.5 }}>Todavía nadie ha ofrecido coche para este partido.</p>
        </div>
      ) : (
        viajes.map((v) => (
          <ViajeCard key={v.id} viaje={v} sesion={sesion} misSocios={misSocios} esMio={v.cuenta_id === sesion.id} onCambio={cargar} confirm={confirm} />
        ))
      )}

      {creando ? (
        <NuevoViajeForm partidoId={partidoId} sesion={sesion} misSocios={misSocios} onCreado={() => { setCreando(false); cargar(); }} onCancelar={() => setCreando(false)} />
      ) : (
        <Button variant="brass" onClick={() => setCreando(true)} style={{ width: '100%' }}>
          <Plus size={16} /> Ofrecer coche para este partido
        </Button>
      )}
    </div>
  );
}
