import { useState, useEffect } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { X, Share, PlusSquare, Download } from 'lucide-react';

const DISMISS_KEY = 'gda_install_banner_dismissed';

function esIOS() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}
function yaInstalada() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrar, setMostrar] = useState(false);
  const [modoIOS, setModoIOS] = useState(false);

  useEffect(() => {
    if (yaInstalada()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    if (esIOS()) {
      setModoIOS(true);
      setMostrar(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMostrar(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstalar = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMostrar(false);
  };

  const handleCerrar = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 60,
      background: `linear-gradient(135deg, ${PALETTE.stripe}, ${PALETTE.pitchDark})`,
      border: '1px solid rgba(201,162,75,0.4)', borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)', display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <img src="/escudo.png" alt="" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {modoIOS ? (
          <>
            <div style={{ color: PALETTE.chalk, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
              Añade la app a tu pantalla de inicio
            </div>
            <div style={{ color: 'rgba(244,246,241,0.85)', fontSize: 12, fontFamily: fontStack.body, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              Toca <Share size={13} /> y luego <PlusSquare size={13} /> "Añadir a inicio"
            </div>
          </>
        ) : (
          <div style={{ color: PALETTE.chalk, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 13.5 }}>
            Instala la app para acceder más rápido
          </div>
        )}
      </div>
      {!modoIOS && (
        <Button variant="brass" onClick={handleInstalar} style={{ padding: '8px 12px', fontSize: 12.5, flexShrink: 0 }}>
          <Download size={14} /> Instalar
        </Button>
      )}
      <button onClick={handleCerrar} style={{ background: 'none', border: 'none', color: 'rgba(244,246,241,0.6)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}
