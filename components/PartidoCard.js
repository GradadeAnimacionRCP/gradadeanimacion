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

export function PartidoCard({ partido }) {
  const pasado = partidoEsPasado(partido);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)',
      borderRadius: 14, padding: '14px 16px', opacity: pasado ? 0.7 : 1,
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
      {pasado && partido.resultado && (
        <div style={{ marginTop: 10, display: 'inline-block', background: PALETTE.brass, color: PALETTE.ink, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 15, padding: '3px 12px', borderRadius: 8 }}>
          {partido.resultado}
        </div>
      )}
    </div>
  );
}
