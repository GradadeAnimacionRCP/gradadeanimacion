import { PALETTE, fontStack } from '../styles/tema';

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

export function PartidoCard({ partido }) {
  const pasado = partidoEsPasado(partido);
  const info = resultadoInfo(partido);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${info ? info.color + '55' : 'rgba(244,246,241,0.12)'}`,
      borderRadius: 14, padding: '14px 16px', opacity: pasado ? 0.85 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
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
      <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 16.5, color: PALETTE.chalk, lineHeight: 1.3 }}>
        {partido.es_local ? `Racing Club Portuense vs ${partido.rival}` : `${partido.rival} vs Racing Club Portuense`}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(244,246,241,0.65)', marginTop: 6, fontFamily: fontStack.label }}>
        {formatFechaPartido(partido.fecha, partido.hora)}
        {partido.estadio && ` · ${partido.estadio}`}
      </div>
      {info && (
        <div style={{
          marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${info.color}22`, border: `1px solid ${info.color}`, borderRadius: 8, padding: '4px 12px',
        }}>
          <span style={{ color: info.color, fontFamily: fontStack.heading, fontWeight: 800, fontSize: 16 }}>{partido.resultado}</span>
          <span style={{ color: info.color, fontFamily: fontStack.label, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{info.texto}</span>
        </div>
      )}
    </div>
  );
}
