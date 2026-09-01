import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { CropModal } from './CropModal';
import { CARGOS } from '../lib/cargos';
import { Camera, Check } from 'lucide-react';

const TIPOS_SOCIO = ['General', 'Juvenil', 'Fundador', 'Honorífico'];

function prepararFotoParaRecorte(file) {
  const MAX_LADO = 1600;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Este formato de imagen no se puede abrir.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function EditarSocioModal({ socio, adminId, onClose, onSaved }) {
  const [nombre, setNombre] = useState(socio.nombre);
  const [apellidos, setApellidos] = useState(socio.apellidos);
  const [tipo, setTipo] = useState(socio.tipo || 'General');
  const [foto, setFoto] = useState(socio.foto || null);
  const [cargos, setCargos] = useState(socio.cargos || []);
  const [cropSrc, setCropSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setCropSrc(await prepararFotoParaRecorte(f)); } catch {}
  };

  const toggleCargo = (clave) => {
    setCargos((prev) => prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave]);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.rpc('admin_editar_socio', {
      p_admin_id: adminId, p_id: socio.id, p_nombre: nombre, p_apellidos: apellidos, p_tipo: tipo, p_foto: foto,
    });
    await supabase.from('socios').update({ cargos }).eq('id', socio.id);
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      {cropSrc && (
        <CropModal src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={(dataUrl) => { setFoto(dataUrl); setCropSrc(null); }} />
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(201,162,75,0.3)' }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 14px' }}>Editar socio</h3>
        <Field label="Nombre">
          <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Apellidos">
          <input style={inputStyle} value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </Field>
        <Field label="Fotografía">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto}
            style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 60, height: 60, borderRadius: 12, border: `2px dashed ${PALETTE.brass}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
            }}>
              {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={22} color={PALETTE.brass} />}
            </div>
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>
              {foto ? 'Cambiar' : 'Subir foto'}
            </Button>
          </div>
        </Field>
        <Field label="Tipo de socio">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIPOS_SOCIO.map((t) => (
              <button key={t} onClick={() => setTipo(t)} style={{
                padding: '6px 11px', borderRadius: 999, fontFamily: fontStack.label, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                background: tipo === t ? PALETTE.stripe : 'rgba(255,255,255,0.06)', color: tipo === t ? PALETTE.chalk : 'rgba(244,246,241,0.75)',
                border: `1px solid ${tipo === t ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
              }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Cargos o roles en la grada (puedes marcar varios)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(CARGOS).map(([clave, info]) => {
              const marcado = cargos.includes(clave);
              return (
                <button key={clave} onClick={() => toggleCargo(clave)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                  background: marcado ? 'rgba(200,30,44,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${marcado ? PALETTE.stripe : 'rgba(244,246,241,0.15)'}`, textAlign: 'left', width: '100%',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: marcado ? PALETTE.stripe : 'transparent', border: marcado ? 'none' : '1.5px solid rgba(244,246,241,0.35)',
                  }}>
                    {marcado && <Check size={13} color={PALETTE.chalk} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 16 }}>{info.emoji}</span>
                  <span style={{ fontSize: 13, color: PALETTE.chalk }}>{info.etiqueta}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}
