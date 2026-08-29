import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { Camera } from 'lucide-react';

function prepararImagenProducto(file) {
  const MAX_LADO = 1200;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no admitido.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function ProductoModal({ producto, onClose, onSaved }) {
  const esNuevo = !producto.id;
  const [nombre, setNombre] = useState(producto.nombre || '');
  const [precio, setPrecio] = useState(producto.precio || '');
  const [imagen, setImagen] = useState(producto.imagen || null);
  const [agotado, setAgotado] = useState(producto.agotado || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try { setImagen(await prepararImagenProducto(f)); } catch (err) { setError(err.message); }
  };

  const handleSave = async () => {
    if (!nombre.trim() || !precio) return;
    setSaving(true);
    const registro = { nombre: nombre.trim(), precio: parseFloat(precio), imagen: imagen || null, agotado };
    const { error } = esNuevo
      ? await supabase.from('productos').insert(registro)
      : await supabase.from('productos').update(registro).eq('id', producto.id);
    setSaving(false);
    if (error) { setError('Error al guardar: ' + error.message); return; }
    onSaved();
  };

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

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(244,246,241,0.8)', marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={agotado} onChange={(e) => setAgotado(e.target.checked)} />
          Marcar como agotado
        </label>

        {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving || !nombre.trim() || !precio} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}
