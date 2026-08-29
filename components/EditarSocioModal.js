import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';

const TIPOS_SOCIO = ['General', 'Juvenil', 'Fundador', 'Honorífico'];

export function EditarSocioModal({ socio, adminId, onClose, onSaved }) {
  const [nombre, setNombre] = useState(socio.nombre);
  const [apellidos, setApellidos] = useState(socio.apellidos);
  const [tipo, setTipo] = useState(socio.tipo || 'General');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.rpc('admin_editar_socio', {
      p_admin_id: adminId, p_id: socio.id, p_nombre: nombre, p_apellidos: apellidos, p_tipo: tipo, p_foto: socio.foto,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 420, border: '1px solid rgba(201,162,75,0.3)' }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 14px' }}>Editar socio</h3>
        <Field label="Nombre">
          <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Apellidos">
          <input style={inputStyle} value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
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
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}
