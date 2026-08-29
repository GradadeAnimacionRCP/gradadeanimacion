import { fontStack, PALETTE } from '../styles/tema';

export function LoadingCrest({ size = 64, texto }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div className="gda-loading-pulse" style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.brass}66 0%, transparent 70%)`,
        }} />
        <img src="/escudo.png" alt="" className="gda-loading-spin" style={{ width: '100%', height: '100%', position: 'relative', display: 'block' }} />
      </div>
      {texto && (
        <div style={{ color: 'rgba(244,246,241,0.75)', fontFamily: fontStack.label, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textAlign: 'center' }}>
          {texto}
        </div>
      )}
    </div>
  );
}
