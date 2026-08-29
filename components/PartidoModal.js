import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';

export function PartidoModal({ partido, onClose, onSaved }) {
  const esNuevo = !partido.id;
  const [rival, setRival] = useState(partido.rival || '');
  const [esLocal, setEsLocal] = useState(partido.es_local !== undefined ? partido.es_local : true);
  const [fecha, setFecha] = useState(partido.fecha || '');
  const [hora, setHora] = useState(partido.hora || '');
  const [jornada, setJornada] = useState(partido.jornada || '');
  const [estadio, setEstadio] = useState(partido.estadio || '');
  const [resultado, setResultado] = useState(partido.resultado || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!rival.trim()) return;
    setSaving(true);
    const registro = {
      rival: rival.trim(), es_local: esLocal, fecha: fecha || null, hora: hora || null,
      jornada: jornada.trim() || null, estadio: estadio.trim() || null, resultado: resultado.trim() || null,
    };
       const { error } = esNuevo
      ? await supabase.from('partidos').insert(registro)
      : await supabase.from('partidos').update(registro).eq('id', partido.id);
    setSaving(false);
    if (error) { alert('Error al guardar: ' + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(201,162,75,0.3)' }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 14px' }}>{esNuevo ? 'Añadir partido' : 'Editar partido'}</h3>

        <Field label="Rival">
          <input style={inputStyle} value={rival} onChange={(e) => setRival(e.target.value)} placeholder="Nombre del equipo rival" />
        </Field>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Campo</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setEsLocal(true)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${esLocal ? PALETTE.brass : 'rgba(244,246,241,0.2)'}`,
              background: esLocal ? 'rgba(201,162,75,0.15)' : 'rgba(255,255,255,0.04)',
              color: esLocal ? PALETTE.brass : 'rgba(244,246,241,0.65)', fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
            }}>🏠 En casa</button>
            <button type="button" onClick={() => setEsLocal(false)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${!esLocal ? '#6fa8ff' : 'rgba(244,246,241,0.2)'}`,
              background: !esLocal ? 'rgba(80,150,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: !esLocal ? '#6fa8ff' : 'rgba(244,246,241,0.65)', fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
            }}>✈️ Fuera</button>
          </div>
        </div>

        <Field label="Fecha (si se sabe)">
          <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Hora (si se sabe)">
          <input type="time" style={inputStyle} value={hora} onChange={(e) => setHora(e.target.value)} />
        </Field>
        <Field label="Jornada (opcional)">
          <input style={inputStyle} value={jornada} onChange={(e) => setJornada(e.target.value)} placeholder="Ej. 5" />
        </Field>
        <Field label="Campo / estadio (opcional)">
          <input style={inputStyle} value={estadio} onChange={(e) => setEstadio(e.target.value)} placeholder="Ej. El Rosal" />
        </Field>
        <Field label="Resultado (rellenar después del partido)">
          <input style={inputStyle} value={resultado} onChange={(e) => setResultado(e.target.value)} placeholder="Ej. 2-1" />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving || !rival.trim()} onClick={handleSave} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}
