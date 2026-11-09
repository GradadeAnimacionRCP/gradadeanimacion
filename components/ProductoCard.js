import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion } from './Layout';
import { PALETTE, fontStack } from '../styles/tema';

const VIGENCIA_RESERVAS_MS = 2 * 60 * 1000;
let reservasCache = null;
let reservasPromesa = null;

function cargarReservas(cuentaId) {
  if (reservasCache && reservasCache.cuentaId === cuentaId && Date.now() - reservasCache.t < VIGENCIA_RESERVAS_MS) {
    return Promise.resolve(reservasCache.mapa);
  }
  if (reservasPromesa && reservasPromesa.cuentaId === cuentaId) return reservasPromesa.promesa;
  const promesa = supabase.rpc('mis_reservas_productos', { p_cuenta_id: cuentaId }).then(({ data, error }) => {
    const mapa = {};
    if (!error) {
      (data || []).forEach((r) => { mapa[String(r.producto_id)] = r.cantidad; });
      reservasCache = { cuentaId, mapa, t: Date.now() };
    }
    reservasPromesa = null;
    return mapa;
  });
  reservasPromesa = { cuentaId, promesa };
  return promesa;
}

function recordarReserva(cuentaId, idProducto, cantidad) {
  if (!reservasCache || reservasCache.cuentaId !== cuentaId) return;
  if (cantidad > 0) reservasCache.mapa[idProducto] = cantidad;
  else delete reservasCache.mapa[idProducto];
}

function avisarAdmins({ title, body }) {
  fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soloAdmins: true, title, body, url: '/admin' }),
  }).catch(() => {});
}

const botonMini = (activo) => ({
  flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: fontStack.label, fontWeight: 700, fontSize: 12.5,
  border: `1px solid ${activo ? PALETTE.brass : 'rgba(244,246,241,0.2)'}`,
  background: activo ? PALETTE.brass : 'rgba(255,255,255,0.04)',
  color: activo ? PALETTE.ink : 'rgba(244,246,241,0.75)',
});

const botonRedondo = {
  width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontWeight: 800, lineHeight: 1,
  border: '1px solid rgba(244,246,241,0.25)', background: 'rgba(255,255,255,0.06)', color: PALETTE.chalk,
};

export function ProductoCard({ producto }) {
  const sesion = useSesion();
  const [miCantidad, setMiCantidad] = useState(0);
  const [eligiendo, setEligiendo] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const idProducto = String(producto.id);
  const disponible = !producto.agotado && !producto.proximamente;
  const quedanPocas = disponible && !!producto.quedan_pocas;

  useEffect(() => {
    if (!sesion || !disponible) return;
    let cancelado = false;
    cargarReservas(sesion.id).then((mapa) => {
      if (!cancelado) setMiCantidad(mapa[idProducto] || 0);
    });
    return () => { cancelado = true; };
  }, [sesion?.id, idProducto, disponible]);

  const abrirSelector = () => {
    setError('');
    setCantidad(miCantidad > 0 ? miCantidad : 1);
    setEligiendo(true);
  };

  const reservar = async () => {
    setEnviando(true);
    setError('');
    const { data, error: dbError } = await supabase.rpc('reservar_producto', {
      p_cuenta_id: sesion.id, p_producto_id: idProducto, p_cantidad: cantidad, p_nombre: sesion.usuario || '',
    });
    setEnviando(false);
    if (dbError) { setError(dbError.message); return; }
    const nombre = data || sesion.usuario || 'Un socio';
    const eraCambio = miCantidad > 0;
    recordarReserva(sesion.id, idProducto, cantidad);
    setMiCantidad(cantidad);
    setEligiendo(false);
    avisarAdmins({
      title: eraCambio ? '🛍️ Reserva modificada' : '🛍️ Nueva reserva',
      body: eraCambio
        ? `${nombre} ha cambiado su reserva a ${cantidad} × ${producto.nombre}`
        : `${nombre} ha reservado ${cantidad} × ${producto.nombre}`,
    });
  };

  const cancelarReserva = async () => {
    if (!window.confirm('¿Cancelar tu reserva?')) return;
    setEnviando(true);
    setError('');
    const { data, error: dbError } = await supabase.rpc('cancelar_reserva_producto', {
      p_cuenta_id: sesion.id, p_producto_id: idProducto,
    });
    setEnviando(false);
    if (dbError) { setError(dbError.message); return; }
    const nombre = data || sesion.usuario || 'Un socio';
    recordarReserva(sesion.id, idProducto, 0);
    setMiCantidad(0);
    setEligiendo(false);
    avisarAdmins({
      title: '❌ Reserva cancelada',
      body: `${nombre} ha cancelado su reserva de ${producto.nombre}`,
    });
  };

  const etiquetaPocas = (
    <div style={{
      background: 'rgba(255,140,0,0.95)', color: PALETTE.ink, fontFamily: fontStack.label,
      fontWeight: 800, fontSize: 11.5, letterSpacing: 0.5, padding: '4px 10px', borderRadius: 999,
      textTransform: 'uppercase', boxShadow: '0 4px 10px -3px rgba(0,0,0,0.6)', display: 'inline-block',
    }}>
      ⏳ ¡Quedan pocas!
    </div>
  );

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)',
      borderRadius: 16, overflow: 'hidden', position: 'relative',
    }}>
      {producto.imagen && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
          <img src={producto.imagen} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: producto.agotado ? 'grayscale(1) brightness(0.6)' : 'none',
          }} />
          {producto.agotado && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
              background: 'rgba(200,30,44,0.92)', color: PALETTE.chalk, fontFamily: fontStack.label,
              fontWeight: 800, fontSize: 15, letterSpacing: 2, padding: '6px 18px', borderRadius: 6,
              textTransform: 'uppercase', boxShadow: '0 6px 16px -4px rgba(0,0,0,0.6)',
            }}>
              Agotado
            </div>
          )}
          {!producto.agotado && producto.proximamente && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
              background: 'rgba(201,162,75,0.95)', color: PALETTE.ink, fontFamily: fontStack.label,
              fontWeight: 800, fontSize: 15, letterSpacing: 2, padding: '6px 18px', borderRadius: 6,
              textTransform: 'uppercase', boxShadow: '0 6px 16px -4px rgba(0,0,0,0.6)',
            }}>
              Próximamente
            </div>
          )}
          {quedanPocas && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>{etiquetaPocas}</div>
          )}
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        {quedanPocas && !producto.imagen && <div style={{ marginBottom: 8 }}>{etiquetaPocas}</div>}
        <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 15, color: PALETTE.chalk, marginBottom: 4 }}>
          {producto.nombre}
        </div>
        <div style={{ fontFamily: fontStack.label, fontWeight: 800, fontSize: 16, color: producto.agotado ? 'rgba(244,246,241,0.4)' : PALETTE.brass }}>
          {Number(producto.precio).toFixed(2)} €
        </div>

        {disponible && sesion && (
          <div style={{ marginTop: 10 }}>
            {eligiendo ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 }}>
                  <button type="button" style={botonRedondo} onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
                  <span style={{ fontFamily: fontStack.heading, fontWeight: 800, fontSize: 18, color: PALETTE.chalk, minWidth: 22, textAlign: 'center' }}>{cantidad}</span>
                  <button type="button" style={botonRedondo} onClick={() => setCantidad((c) => Math.min(10, c + 1))}>+</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" disabled={enviando} style={botonMini(true)} onClick={reservar}>
                    {enviando ? '...' : 'Confirmar'}
                  </button>
                  <button type="button" disabled={enviando} style={botonMini(false)} onClick={() => setEligiendo(false)}>
                    Atrás
                  </button>
                </div>
              </div>
            ) : miCantidad > 0 ? (
              <div>
                <div style={{
                  textAlign: 'center', padding: '7px 8px', borderRadius: 8, marginBottom: 6,
                  background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.4)',
                  color: '#4ADE80', fontFamily: fontStack.label, fontWeight: 800, fontSize: 12.5,
                }}>
                  ✅ Reservado × {miCantidad}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" disabled={enviando} style={botonMini(false)} onClick={abrirSelector}>Cambiar</button>
                  <button type="button" disabled={enviando} style={botonMini(false)} onClick={cancelarReserva}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button type="button" style={{ ...botonMini(true), width: '100%', padding: '9px 6px', fontSize: 13 }} onClick={abrirSelector}>
                🛍️ Reservar
              </button>
            )}
            {error && <div style={{ color: '#ff8a8a', fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
