import { useState, useCallback, useRef } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { AlertTriangle } from 'lucide-react';

export function useConfirm() {
  const [estado, setEstado] = useState(null); // { mensaje, resolve } | null
  const resolveRef = useRef(null);

  const confirmar = useCallback((mensaje) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setEstado({ mensaje });
    });
  }, []);

  const handleSi = () => {
    resolveRef.current?.(true);
    setEstado(null);
  };
  const handleNo = () => {
    resolveRef.current?.(false);
    setEstado(null);
  };

  const ConfirmUI = estado ? (
    <div onClick={handleNo} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: `linear-gradient(160deg, ${PALETTE.pitch} 0%, ${PALETTE.pitchDark} 85%)`,
        border: '1px solid rgba(201,162,75,0.4)', borderRadius: 18, padding: 24,
        width: '100%', maxWidth: 340, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.6)', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
          background: 'rgba(255,176,32,0.12)', border: `2px solid ${PALETTE.brass}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={24} color={PALETTE.brass} />
        </div>
        <p style={{ color: PALETTE.chalk, fontSize: 15, lineHeight: 1.5, margin: '0 0 20px', fontFamily: fontStack.body }}>
          {estado.mensaje}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={handleNo} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="danger" onClick={handleSi} style={{ flex: 1 }}>Confirmar</Button>
        </div>
      </div>
    </div>
  ) : null;

  return [confirmar, ConfirmUI];
}
