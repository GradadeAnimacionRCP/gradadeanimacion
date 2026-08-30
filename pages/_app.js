import { useEffect } from 'react';
import '../styles/globals.css';
import { activarBloqueoImagenes } from '../lib/bloqueoImagenes';
import { InstallBanner } from '../components/InstallBanner';
import { PALETTE, fontStack } from '../styles/tema';
import { RotateCcw } from 'lucide-react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const limpiar = activarBloqueoImagenes();
    return limpiar;
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <InstallBanner />
      <div className="gda-aviso-horizontal" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(10,10,10,0.85)',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 30, textAlign: 'center',
      }}>
        <RotateCcw size={40} color={PALETTE.brass} />
        <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 700, fontSize: 18, lineHeight: 1.4 }}>
          Gira el móvil a vertical<br />para usar la app
        </div>
      </div>
    </>
  );
}
