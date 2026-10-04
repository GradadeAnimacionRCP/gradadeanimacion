import { useState, useEffect, useRef } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { ExternalLink } from 'lucide-react';

const ANCHO = 450;
const ALTO = 560;
const FAVORITO = '161';
const URL_WIDGET =
  'https://www.lapreferente.com/widgetClasificacion.php?comp=26702&colorFondo=F7F5F3&colorFondoCabecera=C9A24B&colorTextoCabecera=0A0A0A&anchoEscudos=18&fontSize=13&favorito=' +
  FAVORITO +
  '&ocultaEvolucion=1&ocultaPosicionAnterior=1';
const URL_WEB = 'https://www.lapreferente.com/E161/racing-club-portuense';

export function ClasificacionLiga() {
  const cajaRef = useRef(null);
  const [escala, setEscala] = useState(1);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const medir = () => {
      const caja = cajaRef.current;
      if (!caja) return;
      const disponible = caja.clientWidth;
      if (disponible > 0) setEscala(Math.min(1, disponible / ANCHO));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  return (
    <div style={{ maxWidth: ANCHO, margin: '0 auto' }}>
      <div
        ref={cajaRef}
        style={{
          position: 'relative', width: '100%', height: ALTO * escala, overflow: 'hidden',
          borderRadius: 14, background: '#F7F5F3', border: '1px solid rgba(201,162,75,0.45)',
        }}
      >
        {!cargado && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#555', fontSize: 13, fontFamily: fontStack.label,
          }}>
            Cargando clasificación...
          </div>
        )}
        <iframe
          title="Clasificación Tercera Federación Grupo 10"
          src={URL_WIDGET}
          width={ANCHO}
          height={ALTO}
          loading="lazy"
          onLoad={() => setCargado(true)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          style={{
            border: 0, position: 'absolute', top: 0, left: 0,
            transform: `scale(${escala})`, transformOrigin: 'top left',
          }}
        />
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, lineHeight: 1.6, color: 'rgba(244,246,241,0.45)', fontFamily: fontStack.label }}>
        Datos no oficiales, actualizados automáticamente.
        <br />
        Fuente:{' '}
        <a href={URL_WEB} target="_blank" rel="noopener noreferrer" style={{ color: PALETTE.brass, fontWeight: 700, textDecoration: 'none' }}>
          La Preferente <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
        </a>
      </div>
    </div>
  );
}
