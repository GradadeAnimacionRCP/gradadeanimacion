import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getSesionGuardada, borrarSesion, tienePasswordTemporal } from '../lib/session';
import { PALETTE, fontStack } from '../styles/tema';
import { InstallBanner } from './InstallBanner';
import { Home, CreditCard, Calendar, Newspaper, Lock, ShieldCheck, AlertTriangle, Lock as LockIcon } from 'lucide-react';

let sesionCache = undefined;

export function invalidarSesionCache() {
  sesionCache = undefined;
}

export function useSesion() {
  const router = useRouter();
  const [sesion, setSesion] = useState(sesionCache);

  useEffect(() => {
    if (sesionCache !== undefined) {
      setSesion(sesionCache);
      return;
    }

    const id = getSesionGuardada();
    if (!id) {
      router.replace('/');
      return;
    }

    const timeoutId = setTimeout(() => {
      setSesion((actual) => (actual === undefined ? null : actual));
    }, 10000);

    supabase.rpc('obtener_usuario', { p_id: id })
      .then(({ data, error }) => {
        clearTimeout(timeoutId);
        if (error || !data) {
          borrarSesion();
          router.replace('/');
        } else {
          sesionCache = data;
          setSesion(data);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Error comprobando sesión:', err);
        sesionCache = null;
        setSesion(null);
      });
  }, []);

  return sesion;
}

export function useTieneCarnet(sesion) {
  const [tiene, setTiene] = useState(null); // null = comprobando, true/false = ya se sabe
  useEffect(() => {
    if (!sesion) return;
    supabase.rpc('mis_socios', { p_cuenta_id: sesion.id }).then(({ data }) => {
      setTiene((data || []).length > 0);
    });
  }, [sesion?.id]);
  return tiene;
}

export function Layout({ sesion, children }) {
  const router = useRouter();
  const [avisoTemporal, setAvisoTemporal] = useState(false);
  const tieneCarnet = useTieneCarnet(sesion);

  useEffect(() => {
    setAvisoTemporal(tienePasswordTemporal());
  }, [router.pathname]);

  const tabs = [
    { href: '/inicio', label: 'Inicio', icon: Home, requiereCarnet: false },
    { href: '/carnets', label: 'Mis carnets', icon: CreditCard, requiereCarnet: false },
    { href: '/calendario', label: 'Calendario', icon: Calendar, requiereCarnet: true },
    { href: '/noticias', label: 'Noticias', icon: Newspaper, requiereCarnet: true },
    { href: '/cuenta', label: 'Cuenta', icon: Lock, requiereCarnet: false },
    ...(sesion?.is_admin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck, requiereCarnet: false }] : []),
  ];

  const paginaActualBloqueada = tabs.find((t) => t.href === router.pathname)?.requiereCarnet && tieneCarnet === false;

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(circle at 50% -10%, ${PALETTE.pitch} 0%, ${PALETTE.ink} 65%)`,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {avisoTemporal && (
        <div style={{
          background: 'rgba(255,176,32,0.15)', borderBottom: '1px solid rgba(255,176,32,0.4)',
          color: '#FFD27A', fontSize: 12.5, textAlign: 'center', padding: '10px 14px',
          fontFamily: fontStack.label, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <AlertTriangle size={15} /> Estás usando una contraseña temporal. Cámbiala en "Cuenta" cuanto antes.
        </div>
      )}
      <div style={{ flex: 1, paddingBottom: 70, position: 'relative' }}>
        {children}
        {paginaActualBloqueada && (
          <div style={{
            position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            background: 'rgba(10,10,10,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 14, padding: 30, textAlign: 'center', zIndex: 20,
          }}>
            <LockIcon size={32} color={PALETTE.brass} />
            <div>
              <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                Necesitas un carnet para ver esto
              </div>
              <div style={{ fontFamily: fontStack.label, color: 'rgba(244,246,241,0.7)', fontSize: 13, lineHeight: 1.5 }}>
                Date de alta o añade un carnet existente desde "Inicio"
              </div>
            </div>
            <Link href="/inicio" style={{
              background: PALETTE.brass, color: PALETTE.ink, fontFamily: fontStack.label, fontWeight: 700,
              fontSize: 13, padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
            }}>
              Ir a Inicio
            </Link>
          </div>
        )}
      </div>
      <InstallBanner />
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: 'rgba(7,40,28,0.92)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(201,162,75,0.25)', paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = router.pathname === t.href;
          const bloqueada = t.requiereCarnet && tieneCarnet === false;
          return (
            <Link key={t.href} href={t.href} style={{
              flex: 1, padding: '10px 4px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? PALETTE.stripeSoft : bloqueada ? 'rgba(244,246,241,0.25)' : 'rgba(244,246,241,0.55)',
              textDecoration: 'none',
            }}>
              <Icon size={20} />
              <span style={{ fontFamily: fontStack.label, fontSize: 11.5, fontWeight: 700 }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
