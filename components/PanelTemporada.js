import { useState, useEffect } from 'react';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { anioTemporadaActual, getFondoTemporada, setFondoTemporada, eliminarFondoTemporada, prepararImagenFondo } from '../lib/temporada';
import { Camera, Trash2 } from 'lucide-react';

function TarjetaTemporada({ anio, esActual, fondo, subiendo, onElegir, onQuitar }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 600, fontSize: 15.5 }}>
          Temporada {anio - 1}/{anio}{' '}
          {esActual === true && <span style={{ color: PALETTE.brass, fontSize: 12, fontWeight: 700 }}>· en curso</span>}
          {esActual === false && <span style={{ color: '#6fa8ff', fontSize: 12, fontWeight: 700 }}>· próxima</span>}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)' }}>
          {fondo ? 'Foto personalizada' : 'Todavía sin foto propia'}
        </div>
      </div>
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 12 }}>
        {fondo && <img src={fondo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="brass" disabled={subiendo} onClick={onElegir} style={{ flex: 1 }}>
          <Camera size={15} /> {subiendo ? 'Subiendo...' : fondo ? 'Cambiar foto' : 'Poner foto'}
        </Button>
        {fondo && (
          <Button variant="ghost" disabled={subiendo} onClick={onQuitar}><Trash2 size={15} /></Button>
        )}
      </div>
    </div>
  );
}

export function PanelTemporada() {
  const anioActual = anioTemporadaActual();
  const anioSiguiente = anioActual + 1;
  const [fondos, setFondos] = useState({});
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(null);
  const [error, setError] = useState('');

  const [anioManual, setAnioManual] = useState('');
  const [fondoManual, setFondoManual] = useState(null);
  const [buscadoManual, setBuscadoManual] = useState(null);

  const cargar = async () => {
    const [actual, siguiente] = await Promise.all([
      getFondoTemporada(anioActual), getFondoTemporada(anioSiguiente),
    ]);
    setFondos({ [anioActual]: actual, [anioSiguiente]: siguiente });
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleElegir = (anio) => {
    setError('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setSubiendo(anio);
      try {
        const dataUrl = await prepararImagenFondo(f);
        await setFondoTemporada(anio, dataUrl);
        if (anio === anioActual || anio === anioSiguiente) await cargar();
        if (anio === buscadoManual) setFondoManual(dataUrl);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubiendo(null);
      }
    };
    input.click();
  };

  const handleQuitar = async (anio) => {
    if (!confirm(`¿Quitar la foto personalizada de la temporada ${anio - 1}/${anio}?`)) return;
    await eliminarFondoTemporada(anio);
    if (anio === anioActual || anio === anioSiguiente) await cargar();
    if (anio === buscadoManual) setFondoManual(null);
  };

  const handleBuscarManual = async () => {
    const anio = parseInt(anioManual, 10);
    if (!anio) return;
    setBuscadoManual(anio);
    setFondoManual(await getFondoTemporada(anio));
  };

  if (loading) return <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 30 }}>Cargando...</div>;

  return (
    <div>
      <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', lineHeight: 1.5, marginBottom: 16 }}>
        Cada temporada tiene su propia foto de fondo. Puedes preparar la de la próxima temporada con antelación: nadie la verá antes de tiempo, solo aparece en el carnet de quien renueve después del 1 de agosto.
      </p>
      {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <TarjetaTemporada anio={anioActual} esActual fondo={fondos[anioActual]} subiendo={subiendo === anioActual}
        onElegir={() => handleElegir(anioActual)} onQuitar={() => handleQuitar(anioActual)} />
      <TarjetaTemporada anio={anioSiguiente} esActual={false} fondo={fondos[anioSiguiente]} subiendo={subiendo === anioSiguiente}
        onElegir={() => handleElegir(anioSiguiente)} onQuitar={() => handleQuitar(anioSiguiente)} />

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginTop: 8 }}>
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5, marginBottom: 10 }}>
          Editar otra temporada (avanzado)
        </div>
        <p style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
          Útil para pruebas o para corregir una temporada antigua. Introduce el año en que caduca esa temporada (por ejemplo, 2026 para la temporada 2025/2026).
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="number" style={{ ...inputStyle, flex: 1 }} placeholder="Ej. 2026" value={anioManual} onChange={(e) => setAnioManual(e.target.value)} />
          <Button variant="ghost" onClick={handleBuscarManual}>Buscar</Button>
        </div>
        {buscadoManual && (
          <TarjetaTemporada anio={buscadoManual} esActual={null} fondo={fondoManual} subiendo={subiendo === buscadoManual}
            onElegir={() => handleElegir(buscadoManual)} onQuitar={() => handleQuitar(buscadoManual)} />
        )}
      </div>
    </div>
  );
}
