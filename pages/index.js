import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SESSION_KEY = 'gda_sesion_usuario';

function guardarSesion(id) {
  if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, id);
}
function borrarSesion() {
  if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
}
function getSesionGuardada() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export default function Home() {
  const [sesion, setSesion] = useState(undefined); // undefined = cargando, null = sin sesión
  const [modo, setModo] = useState('login'); // login | registro
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const id = getSesionGuardada();
    if (!id) { setSesion(null); return; }
    supabase.from('usuarios').select('*').eq('id', id).single()
      .then(({ data }) => setSesion(data || null));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { data, error } = await supabase.rpc('iniciar_sesion', {
      p_usuario: usuario,
      p_password: password,
    });
    setCargando(false);
    if (error) { setError(error.message); return; }
    const user = data[0];
    guardarSesion(user.id);
    setSesion(user);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    setCargando(true);
    const { data, error } = await supabase.rpc('registrar_usuario', {
      p_usuario: usuario,
      p_password: password,
    });
    setCargando(false);
    if (error) { setError(error.message); return; }
    const user = data[0];
    guardarSesion(user.id);
    setSesion(user);
  };

  const handleLogout = () => {
    borrarSesion();
    setSesion(null);
  };

  if (sesion === undefined) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  }

  if (sesion) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>¡Hola, {sesion.usuario}!</h1>
        <p>Sesión iniciada correctamente {sesion.is_admin ? '(eres admin)' : ''}</p>
        <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: 20 }}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Grada de Animación RCP</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setModo('login')} style={{ flex: 1, padding: 10, fontWeight: modo === 'login' ? 'bold' : 'normal' }}>
          Iniciar sesión
        </button>
        <button onClick={() => setModo('registro')} style={{ flex: 1, padding: 10, fontWeight: modo === 'registro' ? 'bold' : 'normal' }}>
          Crear cuenta
        </button>
      </div>

      <form onSubmit={modo === 'login' ? handleLogin : handleRegistro}>
        <div style={{ marginBottom: 12 }}>
          <label>Usuario o DNI</label><br />
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Contraseña</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        {modo === 'registro' && (
          <div style={{ marginBottom: 12 }}>
            <label>Repite la contraseña</label><br />
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={cargando} style={{ width: '100%', padding: 12, marginTop: 8 }}>
          {cargando ? 'Espera...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
