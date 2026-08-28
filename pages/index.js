import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { guardarSesion, getSesionGuardada } from '../lib/session';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field, PageWrapper } from '../components/UI';

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
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const id = getSesionGuardada();
    if (id) { router.replace('/inicio'); return; }
    setComprobando(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { data, error } = await supabase.rpc('iniciar_sesion', { p_usuario: usuario, p_password: password });
    setCargando(false);
    if (error) { setError(error.message); return; }
    guardarSesion(data[0].id);
    router.push('/inicio');
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    setCargando(true);
    const { data, error } = await supabase.rpc('registrar_usuario', { p_usuario: usuario, p_password: password });
    setCargando(false);
    if (error) { setError(error.message); return; }
    guardarSesion(data[0].id);
    router.push('/inicio');
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

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button onClick={() => { setModo('login'); setError(''); }} style={tabPillStyle(modo === 'login')}>Iniciar sesión</button>
            <button onClick={() => { setModo('registro'); setError(''); }} style={tabPillStyle(modo === 'registro')}>Crear cuenta</button>
          </div>

          <form onSubmit={modo === 'login' ? handleLogin : handleRegistro} style={authCardStyle}>
            <Field label="Usuario o DNI">
              <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoCapitalize="none" />
            </Field>
            <Field label="Contraseña">
              <input type="password" style={{ ...inputStyle, fontSize: 10 }} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {modo === 'registro' && (
              <Field label="Repite la contraseña">
                <input type="password" style={{ ...inputStyle, fontSize: 10 }} value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </Field>
            )}
            {error && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
            <Button type="submit" variant="brass" disabled={cargando} style={{ width: '100%' }}>
              {cargando ? 'Espera...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
