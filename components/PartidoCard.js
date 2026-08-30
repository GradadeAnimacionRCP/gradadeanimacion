import { PALETTE, fontStack } from '../styles/tema';
import { Shield, MapPin, Navigation } from 'lucide-react';

const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export function formatFechaPartido(fecha, hora) {
  if (!fecha) return 'Fecha por confirmar';
  const d = new Date(`${fecha}T00:00:00`);
  const texto = `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
  return hora ? `${texto} · ${hora.slice(0, 5)}` : `${texto} · hora por confirmar`;
}

export function partidoEsPasado(partido) {
  if (!partido.fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(`${partido.fecha}T00:00:00`).getTime() < hoy.getTime();
}

function resultadoInfo(partido) {
  if (!partido.resultado) return null;
  const partes = partido.resultado.split('-').map((n) => parseInt(n.trim(), 10));
  if (partes.length !== 2 || partes.some(isNaN)) return null;
  const [golesA, golesB] = partes;
  if (golesA === golesB) return { color: '#FFD24C', texto: 'Empate' };
  const ganamos = partido.es_local ? golesA > golesB : golesB > golesA;
  return ganamos ? { color: '#4ADE80', texto: 'Victoria' } : { color: '#ff6b6b', texto: 'Derrota' };
}

function Escudo(props) {
  var src = props.src;
  var size = props.size || 56;
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(244,246,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Shield size={size * 0.5} color="rgba(244,246,241,0.35)" />
    </div>
  );
}

export function PartidoCard(props) {
  var partido = props.partido;
  var destacado = props.destacado || false;
  var pasado = partidoEsPasado(partido);
  var info = resultadoInfo(partido);
  var escudoLocal = partido.es_local ? '/escudo.png' : partido.escudo_rival;
  var escudoVisitante = partido.es_local ? partido.escudo_rival : '/escudo.png';
  var puntosLocal = partido.es_local ? partido.puntos_local : partido.puntos_rival;
  var puntosVisitante = partido.es_local ? partido.puntos_rival : partido.puntos_local;

  return (
    <div style={{
      background: destacado ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
      border: '1px solid ' + (info ? info.color + '55' : destacado ? 'rgba(201,162,75,0.4)' : 'rgba(244,246,241,0.12)'),
      borderRadius: 18, padding: '18px 16px', opacity: pasado ? 0.85 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: fontStack.label, fontWeight: 700, fontSize: 11.5, letterSpacing: 1,
          textTransform: 'uppercase', color: partido.es_local ? PALETTE.brass : '#6fa8ff',
        }}>
          {partido.es_local ? '🏠 En casa' : '✈️ Fuera'}
        </span>
        {partido.jornada && (
          <span style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label }}>Jornada {partido.jornada}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Escudo src={escudoLocal} />
          <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 13, color: PALETTE.chalk, textAlign: 'center' }}>
            {partido.es_local ? 'Racing Club Portuense' : partido.rival}
          </div>
          {puntosLocal && <div style={{ fontSize: 10.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label }}>{puntosLocal}</div>}
        </div>

        <div style={{ fontFamily: fontStack.display, fontSize: 20, color: 'rgba(244,246,241,0.35)', flexShrink: 0 }}>VS</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Escudo src={escudoVisitante} />
          <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 13, color: PALETTE.chalk, textAlign: 'center' }}>
            {partido.es_local ? partido.rival : 'Racing Club Portuense'}
          </div>
          {puntosVisitante && <div style={{ fontSize: 10.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label }}>{puntosVisitante}</div>}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(244,246,241,0.7)', marginTop: 16, fontFamily: fontStack.label }}>
        {formatFechaPartido(partido.fecha, partido.hora)}
      </div>

      {info && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: info.color + '22', border: '1px solid ' + info.color, borderRadius: 8, padding: '4px 12px',
          }}>
            <span style={{ color: info.color, fontFamily: fontStack.heading, fontWeight: 800, fontSize: 16 }}>{partido.resultado}</span>
            <span style={{ color: info.color, fontFamily: fontStack.label, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{info.texto}</span>
          </div>
        </div>
      )}

      {partido.estadio && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: !pasado ? 12 : 0, color: 'rgba(244,246,241,0.55)', fontSize: 12, fontFamily: fontStack.label }}>
          <MapPin size={13} /> {partido.estadio}
        </div>
      )}

      {!pasado && partido.estadio && (
        <a href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(partido.estadio)} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
            padding: '10px 0', borderRadius: 10, textDecoration: 'none',
            background: 'rgba(201,162,75,0.12)', border: '1px solid rgba(201,162,75,0.35)',
            color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
          }}>
          <Navigation size={15} /> Cómo llegar
        </a>
      )}
    </div>
  );
}
