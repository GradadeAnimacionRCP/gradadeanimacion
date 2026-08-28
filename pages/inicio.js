import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field } from '../components/UI';
import { UserPlus, Search } from 'lucide-react';

const NOMBRE_REGEX = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;

export default function Inicio() {
  const sesion = useSesion();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);

  const [busId, setBusId] = useState('');
  const [busApellido, setBusApellido] = useState('');
  const [busError, setBusError] = useState('');
  const [busInfo, setBusInfo] = useState('');
  const [busCargando, setBusCargando] = useState(false);

  if (!sesion) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    if (!NOMBRE_REGEX.test(nombre.trim()) || !NOMBRE_REGEX.test(apellidos.trim())) {
      setError('Introduce un nombre y apellidos válidos.');
      return;
    }
    setCargando(true);
    const { data, error } = await supabase.rpc('registrar_socio', {
      p_cuenta_id: sesion.id, p_nombre: nombre, p_apellidos: apellidos, p_foto: null,
    });
    setCargando(false);
    if (error) { setError(error.message); return; }
    setOk(`¡Carnet ${data.id} creado! Está pendiente de que un admin lo valide. Lo verás en "Mis carnets".`);
    setNombre(''); setApellidos('');
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    setBusError(''); setBusInfo('');
    const numero = parseInt(busId.trim().toUpperCase().replace('GDA-', ''), 10);
    if (!numero || !busApellido.trim()) { setBusError('Introduce el número de socio y los apellidos.'); return; }
    setBusCargando(true);
    const { data, error } = await supabase.rpc('buscar_socio', { p_numero: numero, p_apellidos: busApellido });
    if (error || !data || data.length === 0) {
      setBusCargando(false);
      setBusError('No se ha encontrado ningún carnet con esos datos.');
      return;
    }
    const carnet = data[0];
    if (!carnet.cuenta_id || carnet.cuenta_id === sesion.id) {
      await supabase.from('socios').update({ cuenta_id: sesion.id }).eq('id', carnet.id);
      setBusCargando(false);
      setBusInfo('¡Carnet añadido a tu cuenta! Ya lo puedes ver en "Mis carnets".');
      setBusId(''); setBusApellido('');
      return;
    }
    await supabase.rpc('solicitar_traspaso', { p_cuenta_destino: sesion.id, p_id: carnet.id });
    setBusCargando(false);
    setBusInfo('Este carnet pertenece a otra cuenta. Se ha enviado una solicitud de traspaso a un admin; te avisaremos cuando la confirme.');
    setBusId(''); setBusApellido('');
  };

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '18px 16px 40px' }}>
        <div style={{ ...authCardStyle, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserPlus size={18} color={PALETTE.stripeSoft} />
            <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 22, margin: 0, color: PALETTE.chalk }}>Nuevo socio</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <Field label="Nombre">
              <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Field>
            <Field label="Apellidos">
              <input style={inputStyle} value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
            </Field>
            {error && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 10 }}>{error}</div>}
            {ok && <div style={{ color: PALETTE.brass, fontSize: 13.5, marginBottom: 10, lineHeight: 1.5 }}>{ok}</div>}
            <Button type="submit" variant="primary" disabled={cargando} style={{ width: '100%' }}>
              {cargando ? 'Generando...' : 'Generar mi carnet'}
            </Button>
          </form>
        </div>

        <div style={authCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Search size={18} color={PALETTE.brass} />
            <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 22, margin: 0, color: PALETTE.chalk }}>Añadir un carnet</h2>
          </div>
          <form onSubmit={handleBuscar}>
            <Field label="Número de socio">
              <input style={inputStyle} value={busId} onChange={(e) => setBusId(e.target.value)} placeholder="GDA-0001" />
            </Field>
            <Field label="Apellidos">
              <input style={inputStyle} value={busApellido} onChange={(e) => setBusApellido(e.target.value)} />
            </Field>
            {busError && <div style={{ color: '#ff8a8a', fontSize: 13.5, marginBottom: 10 }}>{busError}</div>}
            {busInfo && <div style={{ color: PALETTE.brass, fontSize: 13.5, marginBottom: 10, lineHeight: 1.5 }}>{busInfo}</div>}
            <Button type="submit" variant="brass" disabled={busCargando} style={{ width: '100%' }}>
              {busCargando ? 'Buscando...' : 'Añadir carnet a mi cuenta'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
