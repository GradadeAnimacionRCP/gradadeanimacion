import { useState, useEffect } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { LoadingCrest } from './LoadingCrest';
import { ListOrdered, ExternalLink } from 'lucide-react';

const FUENTE_WEB = 'https://www.lapreferente.com/E161/racing-club-portuense';
const NUM = { width: 26, textAlign: 'center', flexShrink: 0 };

function formatoDG(n) {
  return n > 0 ? `+${n}` : String(n);
}

export function ClasificacionLiga() {
  const [datos, setDatos] = useState(undefined);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let activo = true;
    fetch('/api/clasificacion')
      .then((r) => r.json())
      .then((d) => {
        if (!activo) return;
        if (d.error || !d.equipos) setFallo(true);
        else setDatos(d);
      })
      .catch(() => { if (activo) setFallo(true); });
    return () => { activo = false; };
  }, []);

  if (fallo) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: 'rgba(244,246,241,0.65)' }}>
        <ListOrdered size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p style={{ fontSize: 13.5, marginTop: 0 }}>Ahora mismo no se ha podido cargar la clasificación.</p>
        <a href={FUENTE_WEB} target="_blank" rel="noopener noreferrer" style={{ color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700, fontSize: 13 }}>
          Verla en La Preferente
        </a>
      </div>
    );
  }

  if (datos === undefined) {
    return (
      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <LoadingCrest texto="Cargando clasificación..." />
      </div>
    );
  }

  const hora = new Date(datos.actualizado).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px 8px', fontFamily: fontStack.label, fontSize: 10.5, fontWeight: 800, color: 'rgba(244,246,241,0.5)', textTransform: 'uppercase' }}>
        <span style={{ width: 20 }}>#</span>
        <span style={{ flex: 1 }}>Equipo</span>
        <span style={NUM}>PJ</span>
        <span style={NUM}>G</span>
        <span style={NUM}>E</span>
        <span style={NUM}>P</span>
        <span style={{ ...NUM, width: 30 }}>DG</span>
        <span style={{ ...NUM, width: 30, color: PALETTE.brass }}>PT</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {datos.equipos.map((e, idx) => {
          const esRacing = /racing/i.test(e.nombre);
          return (
            <div key={e.pos} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderRadius: 10,
              background: esRacing ? 'rgba(201,162,75,0.15)' : idx % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)',
              border: `1px solid ${esRacing ? PALETTE.brass : 'transparent'}`,
              fontFamily: fontStack.label, fontSize: 12.5, color: PALETTE.chalk,
            }}>
              <span style={{ width: 20, fontWeight: 800, color: esRacing ? PALETTE.brass : 'rgba(244,246,241,0.55)' }}>{e.pos}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: esRacing ? 800 : 600 }}>{e.nombre}</span>
              <span style={NUM}>{e.pj}</span>
              <span style={NUM}>{e.pg}</span>
              <span style={NUM}>{e.pe}</span>
              <span style={NUM}>{e.pp}</span>
              <span style={{ ...NUM, width: 30, color: 'rgba(244,246,241,0.7)' }}>{formatoDG(e.dg)}</span>
              <span style={{ ...NUM, width: 30, fontWeight: 800, color: PALETTE.brass }}>{e.pt}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, lineHeight: 1.6, color: 'rgba(244,246,241,0.45)', fontFamily: fontStack.label }}>
        Datos no oficiales · actualizados a las {hora}{datos.obsoleto ? ' (última lectura guardada)' : ''}
        <br />
        Fuente:{' '}
        <a href={datos.fuente || FUENTE_WEB} target="_blank" rel="noopener noreferrer" style={{ color: PALETTE.brass, fontWeight: 700, textDecoration: 'none' }}>
          La Preferente <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
        </a>
      </div>
    </div>
  );
}
