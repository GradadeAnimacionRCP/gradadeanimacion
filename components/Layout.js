import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getSesionGuardada, borrarSesion, tienePasswordTemporal } from '../lib/session';
import { PALETTE, fontStack } from '../styles/tema';
import { Home, CreditCard, Calendar, Newspaper, Lock, ShieldCheck, AlertTriangle, Lock as LockIcon, Trophy, Euro } from 'lucide-react';
import { useDiaPartido } from '../lib/diaPartido';
import { BotonSoporte } from './BotonSoporte';
import { CartelSorteo } from './CartelSorteo';

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

let cuotaCache = { id: null, valor: undefined, t: 0 };

export function useCuotaPendiente(sesion) {
  const [desde, setDesde] = useState(() => (sesion && cuotaCache.id === sesion.id ? cuotaCache.valor : undefined));
  useEffect(() => {
    if (!sesion) return;
    if (cuotaCache.id === sesion.id && Date.now() - cuotaCache.t < 60000) {
      setDesde(cuotaCache.valor);
      return;
    }
    supabase.rpc('cuota_pendiente_cuenta', { p_cuenta_id: sesion.id }).then(({ data, error }) => {
      if (error) return;
      cuotaCache = { id: sesion.id, valor: data || null, t: Date.now() };
      setDesde(data || null);
    });
  }, [sesion?.id]);
  return desde;
}

function diasRestantesCuota(desde) {
  return 7 - Math.floor((Date.now() - new Date(desde).getTime()) / 86400000);
}

export function Layout({ sesion, children }) {
  const router = useRouter();
  const [avisoTemporal, setAvisoTemporal] = useState(false);
  const tieneCarnet = useTieneCarnet(sesion);
  const pendientesGradaCar = usePendientesGradaCar(sesion);
  const partidoHoy = useDiaPartido();
  const cuotaDesde = useCuotaPendiente(sesion);

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

  const cuotaPendiente = !!cuotaDesde;
  const esRutaLibre = (ruta) => ruta === '/cuenta' || (!!sesion?.is_admin && ruta === '/admin');
  const bloqueoCuota = cuotaPendiente && !esRutaLibre(router.pathname);
  const diasRestantes = cuotaPendiente ? diasRestantesCuota(cuotaDesde) : null;
  const bloqueado = paginaActualBloqueada || bloqueoCuota;

  useEffect(() => {
    if (bloqueado) {
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
  }, [bloqueado]);

  const textoPlazo = diasRestantes === null ? '' : diasRestantes > 0
    ? `Te quedan ${diasRestantes} día${diasRestantes === 1 ? '' : 's'} para regularizarlo; si no se resuelve, tu cuenta se inhabilitará.`
    : 'El plazo de 7 días ha terminado. Contacta cuanto antes para evitar que se inhabilite tu cuenta.';

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
        <div className="gda-dia-partido-banner" style={{
          background: 'linear-gradient(90deg, rgba(201,162,75,0.25), rgba(200,30,44,0.3), rgba(201,162,75,0.25), rgba(200,30,44,0.3))',
          borderBottom: `1px solid ${PALETTE.brass}`,
          color: PALETTE.chalk, fontSize: 12.5, textAlign: 'center', padding: '9px 14px',
          fontFamily: fontStack.label, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Trophy size={15} color={PALETTE.brass} />
          ¡Hoy juega el Racing! vs {partidoHoy.rival}{partidoHoy.hora ? ` · ${partidoHoy.hora.slice(0, 5)}` : ''}
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
      {cuotaPendiente && esRutaLibre(router.pathname) && (
        <div style={{
          background: 'rgba(200,30,44,0.15)', borderBottom: '1px solid rgba(200,30,44,0.5)',
          color: '#ffb3b3', fontSize: 12.5, textAlign: 'center', padding: '10px 14px', lineHeight: 1.5,
          fontFamily: fontStack.label, fontWeight: 700,
        }}>
          💶 Cuota anual pendiente (10 €). Contacta con un administrador o desde el grupo de WhatsApp. {textoPlazo}
        </div>
      )}
      <div style={{ flex: 1, paddingBottom: 70, position: 'relative', overflow: bloqueado ? 'hidden' : 'visible' }}>
        {router.pathname === '/inicio' && !bloqueoCuota && <CartelSorteo />}
        <div style={{ height: bloqueado ? '100vh' : 'auto', overflow: bloqueado ? 'hidden' : 'visible' }}>
          {children}
        </div>
        {bloqueoCuota ? (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom, 8px))',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            background: 'rgba(10,10,10,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 14, padding: 30, textAlign: 'center', zIndex: 40,
          }}>
            <Euro size={34} color={PALETTE.brass} />
            <div>
              <div style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
                Tienes que pagar la cuota anual
              </div>
              <div style={{ fontFamily: fontStack.label, color: 'rgba(244,246,241,0.75)', fontSize: 13, lineHeight: 1.6, maxWidth: 300 }}>
                Hemos detectado que no has pagado la cuota anual de 10 € de la Grada de Animación. Ponte en contacto con un administrador o desde el grupo de WhatsApp.
              </div>
              <div style={{ fontFamily: fontStack.label, color: diasRestantes > 0 ? '#FFD27A' : '#ff8a8a', fontSize: 12.5, fontWeight: 700, lineHeight: 1.5, maxWidth: 300, marginTop: 10 }}>
                {textoPlazo}
              </div>
            </div>
            <div style={{ width: '100%', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/cuenta" style={{
                background: PALETTE.brass, color: PALETTE.ink, fontFamily: fontStack.label, fontWeight: 700,
                fontSize: 13, padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
              }}>
                Ir a Cuenta
              </Link>
              <BotonSoporte sesion={sesion} mensaje={`Hola, soy ${sesion?.usuario || ''} y quiero regularizar la cuota anual de la Grada de Animación.`} />
            </div>
          </div>
        ) : paginaActualBloqueada && (
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
      <nav className={partidoHoy ? 'gda-nav-dia-partido' : ''} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: 'rgba(7,40,28,0.92)', backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${partidoHoy ? PALETTE.brass : 'rgba(201,162,75,0.25)'}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)', zIndex: 30,
      }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = router.pathname === t.href;
          const bloqueadaTab = (t.requiereCarnet && tieneCarnet === false) || (cuotaPendiente && !esRutaLibre(t.href));
          return (
            <Link key={t.href} href={t.href} style={{
              flex: 1, padding: '10px 4px 8px', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? PALETTE.stripeSoft : bloqueadaTab ? 'rgba(244,246,241,0.25)' : 'rgba(244,246,241,0.55)',
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
