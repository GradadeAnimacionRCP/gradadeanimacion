import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { Camera, Trash2 } from 'lucide-react';

function prepararImagen(file) {
  const MAX_LADO = 1400;
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

export function NoticiaModal({ noticia, onClose, onSaved }) {
  const esNueva = !noticia.id;
  const [titulo, setTitulo] = useState(noticia.titulo || '');
  const [texto, setTexto] = useState(noticia.texto || '');
  const [imagen, setImagen] = useState(noticia.imagen || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try {
      setImagen(await prepararImagen(f));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (!titulo.trim() || !texto.trim()) return;
    setSaving(true);
    const registro = { titulo: titulo.trim(), texto: texto.trim(), imagen: imagen || null };
    const { error } = esNueva
      ? await supabase.from('noticias').insert(registro)
      : await supabase.from('noticias').update(registro).eq('id', noticia.id);
    setSaving(false);
    if (error) { setError('Error al guardar: ' + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(201,162,75,0.3)' }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 14px' }}>{esNueva ? 'Nueva noticia' : 'Editar noticia'}</h3>

        <Field label="Título">
          <input style={inputStyle} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. ¡Nueva equipación de la grada!" />
        </Field>
        <Field label="Texto">
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cuenta la noticia..." />
        </Field>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Foto (opcional)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
          {imagen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={imagen} alt="" style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 8, border: `1px solid ${PALETTE.brass}` }} />
              <Button variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 12.5 }}>Cambiar</Button>
              <Button variant="ghost" onClick={() => setImagen(null)} style={{ fontSize: 12.5 }}><Trash2 size={14} /></Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => fileRef.current?.click()} style={{ width: '100%' }}><Camera size={15} /> Añadir foto</Button>
          )}
        </div>

        {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving || !titulo.trim() || !texto.trim()} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Publicar'}</Button>
        </div>
      </div>
    </div>
  );
}
