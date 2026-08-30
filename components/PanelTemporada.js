import { useState, useEffect } from 'react';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button, Field } from './UI';
import { anioTemporadaActual, getFondoTemporada, setFondoTemporada, eliminarFondoTemporada, prepararImagenFondo } from '../lib/temporada';
import { getEscudoRacing, setEscudoRacing, prepararEscudo } from '../lib/config';
import { Camera, Trash2 } from 'lucide-react';

function TarjetaTemporada({ anio, etiqueta, colorEtiqueta, fondo, subiendo, onElegir, onQuitar }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 600, fontSize: 15.5 }}>
          Temporada {anio - 1}/{anio}{' '}
          {etiqueta && <span style={{ color: colorEtiqueta, fontSize: 12, fontWeight: 700 }}>· {etiqueta}</span>}
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
  const anioAnterior = anioActual - 1;
  const [fondos, setFondos] = useState({});
  const [escudoRacing, setEscudoRacingState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(null);
  const [error, setError] = useState('');

  const [anioManual, setAnioManual] = useState('');
  const [fondoManual, setFondoManual] = useState(null);
  const [buscadoManual, setBuscadoManual] = useState(null);

  const cargar = async () => {
    const [anterior, actual, siguiente, escudo] = await Promise.all([
      getFondoTemporada(anioAnterior), getFondoTemporada(anioActual), getFondoTemporada(anioSiguiente), getEscudoRacing(),
    ]);
    setFondos({ [anioAnterior]: anterior, [anioActual]: actual, [anioSiguiente]: siguiente });
    setEscudoRacingState(escudo);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const anioEsFijo = (anio) => anio === anioAnterior || anio === anioActual || anio === anioSiguiente;

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
        if (anioEsFijo(anio)) await cargar();
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
    if (anioEsFijo(anio)) await cargar();
    if (anio === buscadoManual) setFondoManual(null);
  };

  const handleBuscarManual = async () => {
    const anio = parseInt(anioManual, 10);
    if (!anio) return;
    setBuscadoManual(anio);
    setFondoManual(await getFondoTemporada(anio));
  };

  const handleElegirEscudo = () => {
    setError('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setSubiendo('escudo');
      try {
        const dataUrl = await prepararEscudo(f);
        await setEscudoRacing(dataUrl);
        setEscudoRacingState(dataUrl);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubiendo(null);
      }
    };
    input.click();
  };

  if (loading) return <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 30 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 600, fontSize: 15.5, marginBottom: 10 }}>
          Escudo del Racing (para el Calendario)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,246,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {escudoRacing ? <img src={escudoRacing} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, color: 'rgba(244,246,241,0.4)' }}>Sin foto</span>}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)', margin: 0, lineHeight: 1.5 }}>
            Este escudo se usará en todos los partidos del Calendario, en vez del icono genérico.
          </p>
        </div>
        <Button variant="brass" disabled={subiendo === 'escudo'} onClick={handleElegirEscudo} style={{ width: '100%' }}>
          <Camera size={15} /> {subiendo === 'escudo' ? 'Subiendo...' : escudoRacing ? 'Cambiar escudo' : 'Subir escudo'}
        </Button>
      </div>

      <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', lineHeight: 1.5, marginBottom: 16 }}>
        Cada temporada tiene su propia foto de fondo. La de la "temporada anterior" es la que ven los carnets caducados que todavía no se han renovado; puedes preparar la de la próxima con antelación sin que nadie la vea antes de tiempo.
      </p>
      {error && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <TarjetaTemporada anio={anioAnterior} etiqueta="anterior" colorEtiqueta="#FFB020" fondo={fondos[anioAnterior]} subiendo={subiendo === anioAnterior}
        onElegir={() => handleElegir(anioAnterior)} onQuitar={() => handleQuitar(anioAnterior)} />
      <TarjetaTemporada anio={anioActual} etiqueta="en curso" colorEtiqueta={PALETTE.brass} fondo={fondos[anioActual]} subiendo={subiendo === anioActual}
        onElegir={() => handleElegir(anioActual)} onQuitar={() => handleQuitar(anioActual)} />
      <TarjetaTemporada anio={anioSiguiente} etiqueta="próxima" colorEtiqueta="#6fa8ff" fondo={fondos[anioSiguiente]} subiendo={subiendo === anioSiguiente}
        onElegir={() => handleElegir(anioSiguiente)} onQuitar={() => handleQuitar(anioSiguiente)} />

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginTop: 8 }}>
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 600, fontSize: 14.5, marginBottom: 10 }}>
          Editar una temporada más antigua (avanzado)
        </div>
        <p style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
          Solo para corregir fotos de temporadas ya archivadas, más allá de las tres de arriba.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="number" style={{ ...inputStyle, flex: 1 }} placeholder="Ej. 2025" value={anioManual} onChange={(e) => setAnioManual(e.target.value)} />
          <Button variant="ghost" onClick={handleBuscarManual}>Buscar</Button>
        </div>
        {buscadoManual && (
          <TarjetaTemporada anio={buscadoManual} fondo={fondoManual} subiendo={subiendo === buscadoManual}
            onElegir={() => handleElegir(buscadoManual)} onQuitar={() => handleQuitar(buscadoManual)} />
        )}
      </div>
    </div>
  );
}
