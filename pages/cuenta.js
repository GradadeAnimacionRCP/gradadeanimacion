import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { useConfirm } from '../components/ConfirmModal';
import { LoadingCrest } from '../components/LoadingCrest';
import { borrarSesion, marcarPasswordTemporal } from '../lib/session';
import { activarNotificaciones } from '../lib/push';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field, CampoPassword } from '../components/UI';
import { LogOut, Bell } from 'lucide-react';

const CLAVE_MAESTRA = 'CAMBIA-ESTA-CLAVE-2027'; // debe coincidir con la que pusiste en la base de datos

export default function CuentaPage() {
  const sesion = useSesion();
  const [confirm, ConfirmUI] = useConfirm();

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passNueva2, setPassNueva2] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const [claveMaestra, setClaveMaestra] = useState('');
  const [mostrarClaveMaestra, setMostrarClaveMaestra] = useState(false);
  const [errorClave, setErrorClave] = useState('');

  const [activandoNotif, setActivandoNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifError, setNotifError] = useState(false);

  if (sesion === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingCrest texto="Cargando..." />
      </div>
    );
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrMsg(''); setMsg('');
    if (!passActual) { setErrMsg('Introduce tu contraseña actual para verificar que eres tú.'); return; }
    if (passNueva !== passNueva2) { setErrMsg('Las contraseñas nuevas no coinciden.'); return; }
    setCambiando(true);
    const { error } = await supabase.rpc('cambiar_password', {
      p_id: sesion.id, p_password_actual: passActual, p_password_nueva: passNueva,
    });
    setCambiando(false);
    if (error) { setErrMsg(error.message); return; }
    marcarPasswordTemporal(false);
    setPassActual(''); setPassNueva(''); setPassNueva2('');
    setMsg('Contraseña actualizada correctamente.');
  };

  const handleConvertirEnAdmin = async () => {
    setErrorClave('');
    if (claveMaestra !== CLAVE_MAESTRA) { setErrorClave('Clave incorrecta.'); return; }
    await supabase.rpc('intentar_autopromocion', { p_id: sesion.id, p_clave: claveMaestra });
    window.location.reload();
  };

  const handleActivarNotif = async () => {
    setActivandoNotif(true);
    setNotifMsg('');
    try {
      await activarNotificaciones(sesion.id);
      setNotifError(false);
      setNotifMsg('¡Avisos activados! Ya te llegarán las notificaciones a este dispositivo.');
    } catch (err) {
      setNotifError(true);
      setNotifMsg(err.message);
    } finally {
      setActivandoNotif(false);
    }
  };

  const handleLogout = async () => {
    if (!(await confirm('¿Cerrar sesión en este dispositivo?'))) return;
    borrarSesion();
    marcarPasswordTemporal(false);
    window.location.href = '/';
  };

  return (
    <Layout sesion={sesion}>
      {ConfirmUI}
      <div style={{ padding: '20px 18px 40px' }}>
        <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 20, marginBottom: 4 }}>Mi cuenta</h2>
        <p style={{ color: 'rgba(244,246,241,0.65)', fontSize: 14, marginTop: 0, marginBottom: 20 }}>
          Sesión iniciada como <strong style={{ color: PALETTE.brass }}>{sesion.usuario}</strong>{sesion.is_admin ? ' · admin' : ''}
        </p>

        <div style={{ ...authCardStyle, marginBottom: 18 }}>
          <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 15.5, margin: '0 0 12px' }}>Cambiar contraseña</h3>
          <form onSubmit={handleCambiarPassword}>
            <CampoPassword label="Contraseña actual" value={passActual} onChange={(e) => setPassActual(e.target.value)} autoComplete="current-password" />
            <CampoPassword label="Nueva contraseña" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} autoComplete="new-password" />
            <CampoPassword label="Repite la nueva contraseña" value={passNueva2} onChange={(e) => setPassNueva2(e.target.value)} autoComplete="new-password" />
            {errMsg && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{errMsg}</div>}
            {msg && <div style={{ color: PALETTE.brass, fontSize: 13, marginBottom: 10 }}>{msg}</div>}
            <Button type="submit" variant="brass" disabled={cambiando} style={{ width: '100%' }}>
              {cambiando ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </div>

        {!sesion.is_admin && (
          <div style={{ ...authCardStyle, marginBottom: 18 }}>
            {!mostrarClaveMaestra ? (
              <button onClick={() => setMostrarClaveMaestra(true)} style={{ background: 'none', border: 'none', color: 'rgba(244,246,241,0.5)', fontSize: 12.5, cursor: 'pointer', padding: 0 }}>
                ¿Eres el administrador de la grada?
              </button>
            ) : (
              <>
                <Field label="Clave maestra">
                  <input type="password" style={inputStyle} value={claveMaestra} onChange={(e) => setClaveMaestra(e.target.value)} />
                </Field>
                {errorClave && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 10 }}>{errorClave}</div>}
                <Button variant="ghost" onClick={handleConvertirEnAdmin} style={{ width: '100%' }}>Convertir esta cuenta en admin</Button>
              </>
            )}
          </div>
        )}

        <div style={{ ...authCardStyle, marginBottom: 18 }}>
          <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 15.5, margin: '0 0 12px' }}>Avisos</h3>
          <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
            Actívalos para enterarte al momento de noticias, tu carnet aprobado, partidos y renovaciones.
          </p>
          {notifMsg && <div style={{ color: notifError ? '#ff8a8a' : PALETTE.brass, fontSize: 13, marginBottom: 10 }}>{notifMsg}</div>}
          <Button variant="brass" onClick={handleActivarNotif} disabled={activandoNotif} style={{ width: '100%' }}>
            <Bell size={16} /> {activandoNotif ? 'Activando...' : 'Activar notificaciones'}
          </Button>
        </div>

        <Button variant="ghost" onClick={handleLogout} style={{ width: '100%' }}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </Layout>
  );
}
