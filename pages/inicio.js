import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field } from '../components/UI';
import { CropModal } from '../components/CropModal';
import { UserPlus, Search, Camera, Users } from 'lucide-react';

const NOMBRE_REGEX = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;

function prepararFotoParaRecorte(file) {
  const MAX_LADO = 1600;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Este formato de imagen no se puede abrir. Prueba con un JPG o PNG.'));
      img.onload = () => {
        const maxLado = Math.max(img.width, img.height);
        const escala = Math.min(1, MAX_LADO / maxLado);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Inicio() {
  const sesion = useSesion();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [foto, setFoto] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  const fileRef = useRef(null);

  const [busId, setBusId] = useState('');
  const [busApellido, setBusApellido] = useState('');
  const [busError, setBusError] = useState('');
  const [busInfo, setBusInfo] = useState('');
  const [busCargando, setBusCargando] = useState(false);

  const [totalSocios, setTotalSocios] = useState(null);

  useEffect(() => {
    supabase.rpc('contar_socios_aprobados').then(({ data }) => setTotalSocios(data));
  }, []);

  if (!sesion) return null;

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try {
      setCropSrc(await prepararFotoParaRecorte(f));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    if (!NOMBRE_REGEX.test(nombre.trim()) || !NOMBRE_REGEX.test(apellidos.trim())) {
      setError('Introduce un nombre y apellidos válidos.');
      return;
    }
    setCargando(true);
    const { data, error } = await supabase.rpc('registrar_socio', {
      p_cuenta_id: sesion.id, p_nombre: nombre, p_apellidos: apellidos, p_foto: foto,
    });
    setCargando(false);
    if (error) { setError(error.message); return; }
    setOk(`¡Carnet ${data.id} creado! Está pendiente de que un admin lo valide. Lo verás en "Mis carnets".`);
    setNombre(''); setApellidos(''); setFoto(null);
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
      <div style={{ padding: '8px 18px 40px' }}>
        {cropSrc && (
          <CropModal src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={(dataUrl) => { setFoto(dataUrl); setCropSrc(null); }} />
        )}

        <div style={{ textAlign: 'center', padding: '18px 0 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 320, height: 320, opacity: 0.1, pointerEvents: 'none' }}>
            <img src="/escudo.png" alt="" style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <h1 style={{
              fontFamily: fontStack.display, fontWeight: 400, fontSize: 44, margin: 0, letterSpacing: 3, lineHeight: 1,
              background: `linear-gradient(180deg, ${PALETTE.chalk} 35%, ${PALETTE.brass} 130%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))',
            }}>GRADA DE ANIMACIÓN</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ width: 26, height: 1, background: 'rgba(201,162,75,0.5)' }} />
              <div style={{ fontFamily: fontStack.label, color: PALETTE.brass, letterSpacing: 3.5, fontSize: 13, textTransform: 'uppercase', fontWeight: 700 }}>Racing Club Portuense</div>
              <span style={{ width: 26, height: 1, background: 'rgba(201,162,75,0.5)' }} />
            </div>
            <p style={{ color: 'rgba(244,246,241,0.72)', fontSize: 14.5, marginTop: 14, lineHeight: 1.5 }}>
              Hazte socio de la grada y consigue tu carnet digital al instante.
            </p>
            {totalSocios !== null && totalSocios > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
                background: 'rgba(201,162,75,0.12)', border: '1px solid rgba(201,162,75,0.35)', borderRadius: 999,
                padding: '5px 14px', fontFamily: fontStack.label, fontSize: 13, fontWeight: 700, color: PALETTE.brass,
              }}>
                <Users size={14} /> Ya somos {totalSocios} {totalSocios === 1 ? 'socio' : 'socios'}
              </div>
            )}
          </div>
        </div>

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
            <Field label="Fotografía (opcional)">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto}
                style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: 60, height: 60, borderRadius: 12, border: `2px dashed ${PALETTE.brass}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
                }}>
                  {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={22} color={PALETTE.brass} />}
                </div>
                <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>
                  {foto ? 'Cambiar' : 'Subir foto'}
                </Button>
              </div>
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
