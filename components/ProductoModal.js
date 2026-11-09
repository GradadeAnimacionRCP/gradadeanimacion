import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion } from './Layout';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { Camera, Trash2 } from 'lucide-react';

function prepararImagenProducto(file) {
  const MAX_LADO = 1200;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = document.createElement('img');
      img.style.position = 'fixed';
      img.style.top = '-9999px';
      img.style.opacity = '0';
      const limpiar = () => { if (img.parentNode) img.parentNode.removeChild(img); };
      img.onerror = () => { limpiar(); reject(new Error('Formato de imagen no admitido.')); };
      img.onload = () => {
        try {
          const ancho = img.naturalWidth || img.width;
          const alto = img.naturalHeight || img.height;
          const escala = Math.min(1, MAX_LADO / Math.max(ancho, alto));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(ancho * escala);
          canvas.height = Math.round(alto * escala);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          limpiar();
          resolve(dataUrl);
        } catch (err) {
          limpiar();
          reject(new Error('No se pudo procesar la imagen.'));
        }
      };
      document.body.appendChild(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function avisarATodos({ title, body }) {
  fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, url: '/noticias' }),
  }).catch(() => {});
}

export function ProductoModal({ producto, onClose, onSaved }) {
  const sesion = useSesion();
  const esNuevo = !producto.id;
  const [nombre, setNombre] = useState(producto.nombre || '');
  const [precio, setPrecio] = useState(producto.precio || '');
  const [imagen, setImagen] = useState(producto.imagen || null);
  const [agotado, setAgotado] = useState(producto.agotado || false);
  const [proximamente, setProximamente] = useState(producto.proximamente || false);
  const [quedanPocas, setQuedanPocas] = useState(producto.quedan_pocas || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reservas, setReservas] = useState(undefined);
  const fileRef = useRef(null);

  const cargarReservas = useCallback(async () => {
    if (esNuevo || !sesion) return;
    const { data, error: dbError } = await supabase.rpc('admin_reservas_producto', {
      p_admin_id: sesion.id, p_producto_id: String(producto.id),
    });
    setReservas(dbError ? [] : (data || []));
  }, [esNuevo, sesion?.id, producto.id]);

  useEffect(() => { cargarReservas(); }, [cargarReservas]);

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try { setImagen(await prepararImagenProducto(f)); } catch (err) { setError(err.message); }
  };

  const handleAgotado = (valor) => {
    setAgotado(valor);
    if (valor) setQuedanPocas(false);
  };

  const handleBorrarReserva = async (r) => {
    if (!window.confirm(`¿Quitar la reserva de ${r.nombre} (${r.cantidad} ud.)? Úsalo cuando ya la haya recogido o ya no la quiera.`)) return;
    const { error: dbError } = await supabase.rpc('admin_borrar_reserva', { p_admin_id: sesion.id, p_reserva_id: r.id });
    if (dbError) { setError('No se pudo quitar la reserva: ' + dbError.message); return; }
    cargarReservas();
  };

  const handleSave = async () => {
    if (!nombre.trim() || !precio) return;
    setSaving(true);
    const precioNum = parseFloat(precio);
    const registro = {
      nombre: nombre.trim(), precio: precioNum, imagen: imagen || null,
      agotado, proximamente, quedan_pocas: agotado ? false : quedanPocas,
    };
    const { error } = esNuevo
      ? await supabase.from('productos').insert(registro)
      : await supabase.from('productos').update(registro).eq('id', producto.id);
    setSaving(false);
    if (error) { setError('Error al guardar: ' + error.message); return; }

    const antesAgotado = !!producto.agotado;
    const antesProximamente = !!producto.proximamente;
    const antesPocas = !!producto.quedan_pocas;
    const nombreLimpio = nombre.trim();
    let aviso = null;

    if (esNuevo) {
      if (proximamente) aviso = { title: '🛍️ Próximamente en la tienda', body: nombreLimpio };
      else if (!agotado) aviso = { title: '🛍️ Nuevo en la tienda', body: `${nombreLimpio} · ${precioNum.toFixed(2)} €` };
    } else if (agotado && !antesAgotado) {
      aviso = { title: '❌ Agotado', body: `${nombreLimpio} se ha agotado` };
    } else if (!agotado && !proximamente && antesProximamente) {
      aviso = { title: '🔥 ¡Ya disponible!', body: `${nombreLimpio} ya está en la tienda. ¡Resérvalo!` };
    } else if (!agotado && !proximamente && quedanPocas && !antesPocas) {
      aviso = { title: '⏳ ¡Quedan pocas!', body: `Quedan pocas unidades de ${nombreLimpio}` };
    }
    if (aviso) avisarATodos(aviso);

    onSaved();
  };

  const totalUnidades = (reservas || []).reduce((suma, r) => suma + r.cantidad, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(201,162,75,0.3)' }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 14px' }}>{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h3>

        <Field label="Nombre">
          <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Bufanda oficial" />
        </Field>
        <Field label="Precio (€)">
          <input type="number" step="0.01" min="0" style={inputStyle} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej. 15.00" />
        </Field>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Foto</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto}
            style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
          {imagen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={imagen} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: `1px solid ${PALETTE.brass}` }} />
              <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>Cambiar</Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} style={{ width: '100%' }}><Camera size={15} /> Añadir foto</Button>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(244,246,241,0.8)', marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={proximamente} onChange={(e) => setProximamente(e.target.checked)} />
          Marcar como "Próximamente"
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(244,246,241,0.8)', marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={quedanPocas} disabled={agotado} onChange={(e) => setQuedanPocas(e.target.checked)} />
          Marcar como "¡Quedan pocas!"
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(244,246,241,0.8)', marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={agotado} onChange={(e) => handleAgotado(e.target.checked)} />
          Marcar como agotado
        </label>

        <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', marginBottom: 16, lineHeight: 1.5 }}>
          Al guardar, los socios reciben una notificación solo si cambia algo importante: producto nuevo, ya disponible, quedan pocas o agotado.
        </div>

        {!esNuevo && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)' }}>
            <div style={{ fontFamily: fontStack.label, fontWeight: 800, fontSize: 12, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Reservas {reservas !== undefined && reservas.length > 0 ? `· ${totalUnidades} ud. de ${reservas.length} socio${reservas.length === 1 ? '' : 's'}` : ''}
            </div>
            {reservas === undefined ? (
              <div style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)' }}>Cargando...</div>
            ) : reservas.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)' }}>Todavía no hay reservas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reservas.map((r) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: PALETTE.chalk }}>
                    <span style={{ flex: 1, minWidth: 0 }}>{r.nombre}</span>
                    <span style={{ fontFamily: fontStack.label, fontWeight: 800, color: PALETTE.brass }}>× {r.cantidad}</span>
                    <button type="button" title="Quitar reserva" onClick={() => handleBorrarReserva(r)}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', borderRadius: 8, width: 30, height: 30, color: '#ff8a8a', cursor: 'pointer' }}>
                      <Trash2 size={14} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving || !nombre.trim() || !precio} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}
