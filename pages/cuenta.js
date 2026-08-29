import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { borrarSesion } from '../lib/session';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field } from '../components/UI';
import { LogOut } from 'lucide-react';

const CLAVE_MAESTRA = 'gradacereceda2026'; // debe coincidir con la que pusiste en la base de datos

export default function CuentaPage() {
  const sesion = useSesion();

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passNueva2, setPassNueva2] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const [claveMaestra, setClaveMaestra] = useState('');
  const [mostrarClaveMaestra, setMostrarClaveMaestra] = useState(false);
  const [errorClave, setErrorClave] = useState('');

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
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
    setPassActual(''); setPassNueva(''); setPassNueva2('');
    setMsg('Contraseña actualizada correctamente.');
  };

  const handleConvertirEnAdmin = async () => {
    setErrorClave('');
    if (claveMaestra !== CLAVE_MAESTRA) { setErrorClave('Clave incorrecta.'); return; }
    const { data } = await supabase.rpc('intentar_autopromocion', { p_id: sesion.id, p_clave: claveMaestra }).select();
    window.location.reload();
  };

  const handleLogout = () => {
    if (!confirm('¿Cerrar sesión en este dispositivo?')) return;
    borrarSesion();
    window.location.href = '/';
  };

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '20px 18px 40px' }}>
        <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 20, marginBottom: 4 }}>Mi cuenta</h2>
        <p style={{ color: 'rgba(244,246,241,0.65)', fontSize: 14, marginTop: 0, marginBottom: 20 }}>
          Sesión iniciada como <strong style={{ color: PALETTE.brass }}>{sesion.usuario}</strong>{sesion.is_admin ? ' · admin' : ''}
        </p>

        <div style={{ ...authCardStyle, marginBottom: 18 }}>
          <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 15.5, margin: '0 0 12px' }}>Cambiar contraseña</h3>
          <form onSubmit={handleCambiarPassword}>
            <Field label="Contraseña actual">
              <input type="password" style={inputStyle} value={passActual} onChange={(e) => setPassActual(e.target.value)} />
            </Field>
            <Field label="Nueva contraseña">
              <input type="password" style={inputStyle} value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
            </Field>
            <Field label="Repite la nueva contraseña">
              <input type="password" style={inputStyle} value={passNueva2} onChange={(e) => setPassNueva2(e.target.value)} />
            </Field>
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

        <Button variant="ghost" onClick={handleLogout} style={{ width: '100%' }}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </Layout>
  );
}
