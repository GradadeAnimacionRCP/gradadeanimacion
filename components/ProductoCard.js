import { PALETTE, fontStack } from '../styles/tema';

export function ProductoCard({ producto }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)',
      borderRadius: 16, overflow: 'hidden', position: 'relative',
    }}>
      {producto.imagen && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
          <img src={producto.imagen} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: producto.agotado ? 'grayscale(1) brightness(0.6)' : 'none',
          }} />
          {producto.agotado && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
              background: 'rgba(200,30,44,0.92)', color: PALETTE.chalk, fontFamily: fontStack.label,
              fontWeight: 800, fontSize: 15, letterSpacing: 2, padding: '6px 18px', borderRadius: 6,
              textTransform: 'uppercase', boxShadow: '0 6px 16px -4px rgba(0,0,0,0.6)',
            }}>
              Agotado
            </div>
          )}
          {!producto.agotado && producto.proximamente && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
              background: 'rgba(201,162,75,0.95)', color: PALETTE.ink, fontFamily: fontStack.label,
              fontWeight: 800, fontSize: 15, letterSpacing: 2, padding: '6px 18px', borderRadius: 6,
              textTransform: 'uppercase', boxShadow: '0 6px 16px -4px rgba(0,0,0,0.6)',
            }}>
              Próximamente
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 15, color: PALETTE.chalk, marginBottom: 4 }}>
          {producto.nombre}
        </div>
        <div style={{ fontFamily: fontStack.label, fontWeight: 800, fontSize: 16, color: producto.agotado ? 'rgba(244,246,241,0.4)' : PALETTE.brass }}>
          {producto.precio.toFixed(2)} €
        </div>
      </div>
    </div>
  );
}
