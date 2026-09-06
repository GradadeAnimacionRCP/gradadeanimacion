import { PALETTE, fontStack } from '../styles/tema';
import { Radio } from 'lucide-react';

export function MarcadorEnVivo({ partido }) {
  if (!partido.en_directo) return null;

  return (
    <div style={{
      background: 'rgba(200,30,44,0.12)', border: '1px solid rgba(200,30,44,0.5)',
      borderRadius: 14, padding: '14px 16px', textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
        color: PALETTE.stripe, fontFamily: fontStack.label, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
      }}>
        <Radio size={13} className="gda-loading-pulse" /> En directo
      </div>
      <div style={{ fontFamily: fontStack.heading, fontWeight: 800, fontSize: 34, color: PALETTE.chalk }}>
        {partido.marcador_en_vivo || '0 - 0'}
      </div>
      {partido.minuto_en_vivo && (
        <div style={{ fontFamily: fontStack.label, fontSize: 13, color: 'rgba(244,246,241,0.6)', marginTop: 4 }}>
          {partido.minuto_en_vivo}'
        </div>
      )}
    </div>
  );
}
