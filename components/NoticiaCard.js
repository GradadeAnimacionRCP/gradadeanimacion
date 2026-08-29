import { PALETTE, fontStack } from '../styles/tema';
import { formatFecha } from '../lib/socios';

export function NoticiaCard({ noticia }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, overflow: 'hidden' }}>
      {noticia.imagen && (
        <img src={noticia.imagen} alt="" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label, marginBottom: 6 }}>
          {formatFecha(noticia.fecha)}
        </div>
        <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 17, color: PALETTE.chalk, marginBottom: 6, lineHeight: 1.3 }}>
          {noticia.titulo}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(244,246,241,0.8)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {noticia.texto}
        </div>
      </div>
    </div>
  );
}
