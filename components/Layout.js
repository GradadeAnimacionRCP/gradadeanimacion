import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getSesionGuardada, borrarSesion } from '../lib/session';
import { PALETTE, fontStack } from '../styles/tema';
import { Home, CreditCard, Calendar, Newspaper, Lock, ShieldCheck } from 'lucide-react';

export function useSesion() {
  const router = useRouter();
  const [sesion, setSesion] = useState(undefined);

  useEffect(() => {
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
          setSesion(data);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Error comprobando sesión:', err);
        setSesion(null);
      });
  }, []);

  return sesion;
}

export function Layout({ sesion, children }) {
  const router = useRouter();

  const tabs = [
    { href: '/inicio', label: 'Inicio', icon: Home },
    { href: '/carnets', label: 'Mis carnets', icon: CreditCard },
    { href: '/calendario', label: 'Calendario', icon: Calendar },
    { href: '/noticias', label: 'Noticias', icon: Newspaper },
    { href: '/cuenta', label: 'Cuenta', icon: Lock },
    ...(sesion?.is_admin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(circle at 50% -10%, ${PALETTE.pitch} 0%, ${PALETTE.ink} 65%)`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, paddingBottom: 70 }}>
        {children}
      </div>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: 'rgba(7,40,28,0.92)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(201,162,75,0.25)', paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = router.pathname === t.href;
          return (
            <Link key={t.href} href={t.href} style={{
              flex: 1, padding: '10px 4px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? PALETTE.stripeSoft : 'rgba(244,246,241,0.55)', textDecoration: 'none',
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
