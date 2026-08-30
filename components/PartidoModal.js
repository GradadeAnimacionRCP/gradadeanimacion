import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { Camera } from 'lucide-react';

function prepararEscudo(file) {
  const MAX_LADO = 300;
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
          const dataUrl = canvas.toDataURL('image/png');
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

export function PartidoModal({ partido, onClose, onSaved }) {
  const esNuevo = !partido.id;
  const [rival, setRival] = useState(partido.rival || '');
  const [escudoRival, setEscudoRival] = useState(partido.escudo_rival || null);
  const [esLocal, setEsLocal] = useState(partido.es_local !== undefined ? partido.es_local : true);
  const [fecha, setFecha] = useState(partido.fecha || '');
  const [hora, setHora] = useState(partido.hora || '');
  const [jornada, setJornada] = useState(partido.jornada || '');
  const [estadio, setEstadio] = useState(partido.estadio || '');
  const [resultado, setResultado] = useState(partido.resultado || '');
  const [puntosLocal, setPuntosLocal] = useState(partido.puntos_local || '');
  const [puntosRival, setPuntosRival] = useState(partido.puntos_rival || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleEscudo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try { setEscudoRival(await prepararEscudo(f)); } catch (err) { setError(err.message); }
  };

  const handleSave = async () => {
    if (!rival.trim()) return;
    setSaving(true);

    const horaNueva = hora || null;
    const resultadoNuevo = resultado.trim() || null;
    const horaCambio = !esNuevo && horaNueva && horaNueva !== partido.hora;
    const resultadoCambio = !esNuevo && resultadoNuevo && resultadoNuevo !== partido.resultado;

    const registro = {
      rival: rival.trim(), escudo_rival: escudoRival || null, es_local: esLocal, fecha: fecha || null, hora: horaNueva,
      jornada: jornada.trim() || null, estadio: estadio.trim() || null, resultado: resultadoNuevo,
      puntos_local: puntosLocal.trim() || null, puntos_rival: puntosRival.trim() || null,
    };

    const { error: dbError } = esNuevo
      ? await supabase.from('partidos').insert(registro)
      : await supabase.from('partidos').update(registro).eq('id', partido.id);

    setSaving(false);
    if (dbError) { setError('Error al guardar: ' + dbError.message); return; }

    if (resultadoCambio) {
      const [golesA, golesB] = resultadoNuevo.split('-').map((n) => parseInt(n.trim(), 10));
      let emoji = '🟡';
      let texto = 'empate';
      if (!isNaN(golesA) && !isNaN(golesB)) {
        const ganamos = esLocal ? golesA > golesB : golesB > golesA;
        const perdemos = esLocal ? golesA < golesB : golesB < golesA;
        if (ganamos) { emoji = '✅'; texto = 'victoria'; }
        else if (perdemos) { emoji = '❌'; texto = 'derrota'; }
      }
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${emoji} Racing Club Portuense ${resultadoNuevo}`,
          body: `${texto === 'empate' ? 'Empate' : texto === 'victoria' ? 'Victoria' : 'Derrota'} contra ${rival.trim()}`,
          url: '/calendario',
        }),
      }).catch(() => {});
    } else if (horaCambio) {
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⏰ Hora confirmada',
          body: `${esLocal ? 'Racing vs' : 'vs'} ${rival.trim()}: ${horaNueva.slice(0, 5)}`,
          url: '/calendario',
        }),
      }).catch(() => {});
    }

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
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Escudo del rival (opcional)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleEscudo}
            style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 56, height: 56, borderRadius: '50%', border: `2px dashed ${PALETTE.brass}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
            }}>
              {escudoRival ? <img src={escudoRival} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Camera size={20} color={PALETTE.brass} />}
            </div>
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>
              {escudoRival ? 'Cambiar' : 'Subir escudo'}
            </Button>
          </div>
        </div>

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
        <Field label="Campo / estadio (opcional, para el botón 'Cómo llegar')">
          <input style={inputStyle} value={estadio} onChange={(e) => setEstadio(e.target.value)} placeholder="Ej. Estadio El Rosal, El Puerto de Santa María" />
        </Field>
        <Field label="Resultado (rellenar después del partido)">
          <input style={inputStyle} value={resultado} onChange={(e) => setResultado(e.target.value)} placeholder="Ej. 2-1" />
        </Field>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Clasificación actual (opcional, la escribes tú)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={inputStyle} value={puntosLocal} onChange={(e) => setPuntosLocal(e.target.value)} placeholder="Racing: 12 pts (3º)" />
            <input style={inputStyle} value={puntosRival} onChange={(e) => setPuntosRival(e.target.value)} placeholder="Rival: 8 pts (7º)" />
          </div>
        </div>

        {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" disabled={saving || !rival.trim()} onClick={handleSave} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
