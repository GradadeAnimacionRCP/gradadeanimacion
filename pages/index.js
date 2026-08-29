import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { guardarSesion, getSesionGuardada, marcarPasswordTemporal } from '../lib/session';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field, PageWrapper, CampoPassword } from '../components/UI';

const RECORDAR_KEY = 'gda_usuario_recordado';

function tabPillStyle(active) {
  return {
    flex: 1, padding: '10px 0', borderRadius: 10,
    border: `1px solid ${active ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
    background: active ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
    fontFamily: fontStack.label, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };
}

export default function Home() {
  const router = useRouter();
  const [comprobando, setComprobando] = useState(true);
  const [modo, setModo] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const id = getSesionGuardada();
    if (id) { router.replace('/inicio'); return; }
    const recordado = typeof window !== 'undefined' ? localStorage.getItem(RECORDAR_KEY) : null;
    if (recordado) setUsuario(recordado);
    setComprobando(false);
  }, []);

  const limpiarMensajes = () => { setError(''); setInfo(''); };

  const guardarRecordado = () => {
    if (recordar) localStorage.setItem(RECORDAR_KEY, usuario);
    else localStorage.removeItem(RECORDAR_KEY);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data, error } = await supabase.rpc('iniciar_sesion', { p_usuario: usuario, p_password: password });
      if (error) { setError(error.message); setCargando(false); return; }
      if (!data || !data[0]) { setError('No se pudo iniciar sesión. Inténtalo de nuevo.'); setCargando(false); return; }
      guardarRecordado();
      marcarPasswordTemporal(!!data[0].debe_cambiar);
      guardarSesion(data[0].id);
      window.location.href = '/inicio';
    } catch (err) {
      setError('Error inesperado: ' + (err && err.message ? err.message : 'desconocido'));
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    setCargando(true);
    try {
      const { data, error } = await supabase.rpc('registrar_usuario', { p_usuario: usuario, p_password: password });
      if (error) { setError(error.message); setCargando(false); return; }
      if (!data || !data[0]) { setError('No se pudo crear la cuenta. Inténtalo de nuevo.'); setCargando(false); return; }
      guardarRecordado();
      marcarPasswordTemporal(false);
      guardarSesion(data[0].id);
      window.location.href = '/inicio';
    } catch (err) {
      setError('Error inesperado: ' + (err && err.message ? err.message : 'desconocido'));
      setCargando(false);
    }
  };

  const handleOlvide = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (!usuario.trim()) { setError('Introduce tu nombre de usuario.'); return; }
    setCargando(true);
    const { error } = await supabase.rpc('solicitar_reset', { p_usuario: usuario });
    setCargando(false);
    if (error) { setError(error.message); return; }
    setInfo('Solicitud enviada. Un admin de la grada te asignará una contraseña temporal; vuelve a intentarlo con ella cuando te avise.');
  };

  if (comprobando) {
    return (
      <PageWrapper>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
            <img src="/escudo.png" alt="" style={{ width: 74, height: 74, flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 34, color: PALETTE.chalk, margin: 0, letterSpacing: 1.5, lineHeight: 1.05 }}>
                GRADA DE ANIMACIÓN
              </h1>
              <div style={{ color: PALETTE.brass, fontFamily: fontStack.label, letterSpacing: 1.5, fontSize: 14, textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
                Racing Club Portuense
              </div>
            </div>
          </div>

          {modo !== 'olvide' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={() => { setModo('login'); limpiarMensajes(); }} style={tabPillStyle(modo === 'login')}>Iniciar sesión</button>
              <button onClick={() => { setModo('registro'); limpiarMensajes(); }} style={tabPillStyle(modo === 'registro')}>Crear cuenta</button>
            </div>
          )}

          {modo === 'login' && (
            <form onSubmit={handleLogin} style={authCardStyle}>
              <Field label="Usuario o DNI">
                <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoCapitalize="none" />
              </Field>
              <CampoPassword label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(244,246,241,0.75)', marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                Recordar usuario
              </label>
              {error && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
              {info && <div style={{ color: PALETTE.brass, fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>{info}</div>}
              <Button type="submit" variant="brass" disabled={cargando} style={{ width: '100%' }}>
                {cargando ? 'Entrando...' : 'Iniciar sesión'}
              </Button>
              <button type="button" onClick={() => { setModo('olvide'); limpiarMensajes(); }}
                style={{ background: 'none', border: 'none', color: PALETTE.brass, fontSize: 12.5, marginTop: 14, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                He olvidado mi contraseña
              </button>
            </form>
          )}

          {modo === 'registro' && (
            <form onSubmit={handleRegistro} style={authCardStyle}>
              <Field label="Usuario o DNI">
                <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoCapitalize="none" />
              </Field>
              <CampoPassword label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <CampoPassword label="Repite la contraseña" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
              {error && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
              <Button type="submit" variant="brass" disabled={cargando} style={{ width: '100%' }}>
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>
          )}

          {modo === 'olvide' && (
            <form onSubmit={handleOlvide} style={authCardStyle}>
              <p style={{ fontSize: 13, color: 'rgba(244,246,241,0.7)', marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
                Introduce tu usuario. Un admin de la grada verá tu solicitud y te asignará una contraseña temporal.
              </p>
              <Field label="Usuario o DNI">
                <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoCapitalize="none" />
              </Field>
              {error && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
              {info && <div style={{ color: PALETTE.brass, fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>{info}</div>}
              <Button type="submit" variant="brass" disabled={cargando} style={{ width: '100%' }}>
                {cargando ? 'Enviando...' : 'Solicitar contraseña temporal'}
              </Button>
              <button type="button" onClick={() => { setModo('login'); limpiarMensajes(); }}
                style={{ background: 'none', border: 'none', color: PALETTE.brass, fontSize: 12.5, marginTop: 14, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                ← Volver a iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
