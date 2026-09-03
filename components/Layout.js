import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getSesionGuardada, borrarSesion, tienePasswordTemporal } from '../lib/session';
import { PALETTE, fontStack } from '../styles/tema';
import { Home, CreditCard, Calendar, Newspaper, Lock, ShieldCheck, AlertTriangle, Lock as LockIcon, Trophy } from 'lucide-react';
import { useDiaPartido } from '../lib/diaPartido';

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
  const [tiene, setTiene] = useState(null);
  useEffect(() => {
    if (!sesion) return;
    supabase.rpc('mis_socios', { p_cuenta_id: sesion.id }).then(({ data }) => {
      const aprobados = (data || []).filter((s) => s.estado_solicitud === 'aprobado');
      setTiene(aprobados.length > 0);
    });
  }, [sesion?.id]);
  return tiene;
}

export function usePendientesGradaCar(sesion) {
  const [pendientes, setPendientes] = useState(0);
  useEffect(() => {
    if (!sesion) return;
    const cargar = () => {
      supabase.rpc('contar_pendientes_gradacar', { p_cuenta_id: sesion.id }).then(({ data }) => {
        setPendientes(data || 0);
      });
    };
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, [sesion?.id]);
  return pendientes;
}

export function Layout({ sesion, children }) {
  const router = useRouter();
  const [avisoTemporal, setAvisoTemporal] = useState(false);
  const tieneCarnet = useTieneCarnet(sesion);
  const pendientesGradaCar = usePendientesGradaCar(sesion);
  const partidoHoy = useDiaPartido();

  useEffect(() => {
    setAvisoTemporal(tienePasswordTemporal());
  }, [router.pathname]);

  const tabs = [
    { href: '/inicio', label: 'Inicio', icon: Home, requiereCarnet: false, badge: false },
    { href: '/carnets', label: 'Mis carnets', icon: CreditCard, requiereCarnet: false, badge: false },
    { href: '/calendario', label: 'Calendario', icon: Calendar, requiereCarnet: true, badge: pendientesGradaCar > 0 },
    { href: '/noticias', label: 'Noticias', icon: Newspaper, requiereCarnet: true, badge: false },
    { href: '/cuenta', label: 'Cuenta', icon: Lock, requiereCarnet: false, badge: false },
    ...(sesion?.is_admin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck, requiereCarnet: false, badge: false }] : []),
  ];

  const paginaActualBloqueada = tabs.find((t) => t.href === router.pathname)?.requiereCarnet && tieneCarnet === false;

  useEffect(() => {
    if (paginaActualBloqueada) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [paginaActualBloqueada]);

  return (
    <div style={{
      minHeight: '100vh',
      background: partidoHoy
        ? `radial-gradient(circle at 50% -10%, #4a1005 0%, ${PALETTE.ink} 65%)`
        : `radial-gradient(circle at 50% -10%, ${PALETTE.pitch} 0%, ${PALETTE.ink} 65%)`,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {partidoHoy && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(201,162,75,0.2), rgba(200,30,44,0.25), rgba(201,162,75,0.2))',
          borderBottom: `1px solid ${PALETTE.brass}`,
          color: PALETTE.chalk, fontSize: 12.5, textAlign: 'center', padding: '9px 14px',
          fontFamily: fontStack.label, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Trophy size={15} color={PALETTE.brass} />
          ¡Hoy juega el Racing! {partidoHoy.es_local ? 'vs' : 'en'} {partidoHoy.rival}{partidoHoy.hora ? ` · ${partidoHoy.hora.slice(0, 5)}` : ''}
        </div>
      )}
      {avisoTemporal && (
        <div style={{
          background: 'rgba(255,176,32,0.15)', borderBottom: '1px solid rgba(255,176,32,0.4)',
          color: '#FFD27A', fontSize: 12.5, textAlign: 'center', padding: '10px 14px',
          fontFamily: fontStack.label, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <AlertTriangle size={15} /> Estás usando una contraseña temporal. Cámbiala en "Cuenta" cuanto antes.
        </div>
      )}
      <div style={{ flex: 1, paddingBottom: 70, position: 'relative', overflow: paginaActualBloqueada ? 'hidden' : 'visible' }}>
        <div style={{ height: paginaActualBloqueada ? '100vh' : 'auto', overflow: paginaActualBloqueada ? 'hidden' : 'visible' }}>
          {children}
        </div>
        {paginaActualBloqueada && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            background: 'rgba(10,10,10,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 14, padding: 30, paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
            textAlign: 'center', zIndex: 40,
          }}>
            <LockIcon size={32} color={PALETTE.brass} />
            <div>
              <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                Necesitas un carnet aprobado para ver esto
              </div>
              <div style={{ fontFamily: fontStack.label, color: 'rgba(244,246,241,0.7)', fontSize: 13, lineHeight: 1.5 }}>
                Date de alta desde "Inicio", o espera a que un admin valide tu solicitud
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
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: 'rgba(7,40,28,0.92)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(201,162,75,0.25)', paddingBottom: 'env(safe-area-inset-bottom, 8px)', zIndex: 30,
      }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = router.pathname === t.href;
          const bloqueada = t.requiereCarnet && tieneCarnet === false;
          return (
            <Link key={t.href} href={t.href} style={{
              flex: 1, padding: '10px 4px 8px', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? PALETTE.stripeSoft : bloqueada ? 'rgba(244,246,241,0.25)' : 'rgba(244,246,241,0.55)',
              textDecoration: 'none',
            }}>
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {t.badge && (
                  <span style={{
                    position: 'absolute', top: -2, right: -4, width: 9, height: 9, borderRadius: '50%',
                    background: PALETTE.flare, border: `2px solid ${PALETTE.pitchDark}`,
                  }} />
                )}
              </div>
              <span style={{ fontFamily: fontStack.label, fontSize: 11.5, fontWeight: 700 }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
