import { PALETTE, fontStack } from '../styles/tema';
import { estadoMember, formatFecha, formatNumeroSocio, temporadaLabel, ESTADO_COLOR, ESTADO_LABEL } from '../lib/socios';
import { Users } from 'lucide-react';

export function CarnetCard({ socio }) {
  const est = estadoMember(socio);
  const nombreCompleto = `${socio.nombre} ${socio.apellidos}`.toUpperCase();

  return (
    <div style={{
      width: '100%', maxWidth: 380, margin: '0 auto', borderRadius: 22, overflow: 'hidden',
      background: `linear-gradient(160deg, ${PALETTE.pitch} 0%, ${PALETTE.pitchDark} 75%)`,
      boxShadow: '0 18px 45px -12px rgba(0,0,0,0.55)',
      border: '1px solid rgba(201,162,75,0.35)', fontFamily: fontStack.body, color: PALETTE.chalk,
    }}>
      <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/escudo.png" alt="" style={{ width: 34, height: 34 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fontStack.heading, fontWeight: 700, letterSpacing: 1.2, fontSize: 15 }}>GRADA DE ANIMACIÓN</div>
          <div style={{ fontFamily: fontStack.label, fontWeight: 600, letterSpacing: 2, fontSize: 11.5, color: PALETTE.brass, textTransform: 'uppercase' }}>Racing Club Portuense</div>
        </div>
      </div>

      <div style={{ borderTop: '2px dashed rgba(201,162,75,0.3)', margin: '0 18px' }} />

      <div style={{ padding: '16px 18px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
          border: `2px solid ${PALETTE.brass}`, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {socio.foto ? (
            <img src={socio.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Users size={30} color={PALETTE.chalk} opacity={0.5} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fontStack.label, fontSize: 11, letterSpacing: 1.5, color: PALETTE.stripeSoft, textTransform: 'uppercase', fontWeight: 700 }}>Socio de la grada</div>
          <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 16.5, lineHeight: 1.18, wordBreak: 'break-word' }}>{nombreCompleto}</div>
          <div style={{ marginTop: 6, display: 'inline-block', background: PALETTE.brass, color: PALETTE.ink, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 14, letterSpacing: 1, padding: '2px 10px', borderRadius: 6 }}>
            Nº {formatNumeroSocio(socio.numero_socio)}
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 18px 4px', display: 'flex', justifyContent: 'space-between', fontFamily: fontStack.label, fontSize: 12.5, color: 'rgba(244,246,241,0.75)' }}>
        <span>Alta: {formatFecha(socio.fecha_alta)}</span>
        <span>{socio.tipo || 'General'}</span>
        <span style={{ color: ESTADO_COLOR[est] }}>{ESTADO_LABEL[est]}</span>
      </div>
      <div style={{ padding: '0 18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11.5, fontFamily: fontStack.label }}>
        <span style={{ color: 'rgba(244,246,241,0.5)' }}>Válido hasta {formatFecha(socio.fecha_caducidad)}</span>
        <span style={{ color: PALETTE.brass, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Temporada {temporadaLabel(socio.fecha_caducidad)}</span>
      </div>
    </div>
  );
}
