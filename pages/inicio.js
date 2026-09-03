import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { LoadingCrest } from '../components/LoadingCrest';
import { CuentaAtrasPartido } from '../components/CuentaAtrasPartido';
import { getEscudoRacing } from '../lib/config';
import { saludoActual, primerCarnet, fechaInicioSocio, formatAntiguedad } from '../lib/perfil';
import { estadoMember, ESTADO_COLOR, ESTADO_LABEL, formatNumeroSocio } from '../lib/socios';
import { PALETTE, fontStack, inputStyle, authCardStyle } from '../styles/tema';
import { Button, Field } from '../components/UI';
import { CropModal } from '../components/CropModal';
import { UserPlus, Search, Camera, Users, Calendar as CalendarIcon, Award, Shield, AlertTriangle, Newspaper, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { CompartirCarnet } from '../components/CompartirCarnet';

const NOMBRE_REGEX = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;

function avisarAdmins({ title, body, url }) {
  fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soloAdmins: true, title, body, url: url || '/admin' }),
  }).catch(() => {});
}

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

function EscudoMini({ src, size = 42 }) {
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(244,246,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Shield size={size * 0.5} color="rgba(244,246,241,0.35)" />
    </div>
  );
}

function resultadoInfo(partido) {
  if (!partido || !partido.resultado) return null;
  const partes = partido.resultado.split('-').map((n) => parseInt(n.trim(), 10));
  if (partes.length !== 2 || partes.some(isNaN)) return null;
  const [golesA, golesB] = partes;
  if (golesA === golesB) return { color: '#FFD24C', texto: 'Empate', gano: null };
  const ganamos = partido.es_local ? golesA > golesB : golesB > golesA;
  return ganamos ? { color: '#4ADE80', texto: 'Victoria', gano: true } : { color: '#ff6b6b', texto: 'Derrota', gano: false };
}

function calcularRacha(jugados) {
  if (!jugados || jugados.length === 0) return null;
  let racha = 0;
  let tipo = null;
  for (const p of jugados) {
    const info = resultadoInfo(p);
    if (!info || info.gano === null) break;
    if (tipo === null) tipo = info.gano;
    if (info.gano !== tipo) break;
    racha++;
  }
  if (racha === 0) return null;
  return { racha, ganando: tipo };
}

function BloqueResultadoYRacha({ jugados }) {
  if (!jugados || jugados.length === 0) return null;
  const ultimo = jugados[0];
  const info = resultadoInfo(ultimo);
  if (!info) return null;
  const racha = calcularRacha(jugados);

  return (
    <div style={{ ...authCardStyle, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${info.color}22`, border: `2px solid ${info.color}`,
      }}>
        <span style={{ fontFamily: fontStack.heading, fontWeight: 800, fontSize: 14, color: info.color }}>{ultimo.resultado}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label, marginBottom: 2 }}>
          Último partido {ultimo.es_local ? `vs ${ultimo.rival}` : `en ${ultimo.rival}`}
        </div>
        <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 14.5, color: info.color }}>
          {info.texto}
        </div>
      </div>
      {racha && racha.racha > 1 && (
        <div style={{
          fontFamily: fontStack.label, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap',
          color: racha.ganando ? '#4ADE80' : '#ff6b6b',
        }}>
          {racha.ganando ? '🔥' : '🥶'} {racha.racha} seguidas
        </div>
      )}
    </div>
  );
}

function AvisoCarnet({ socio }) {
  const est = estadoMember(socio);
  if (est === 'activo') return null;
  return (
    <Link href="/carnets" style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '12px 14px',
        background: `${ESTADO_COLOR[est]}18`, border: `1px solid ${ESTADO_COLOR[est]}55`, borderRadius: 14,
      }}>
        <AlertTriangle size={18} color={ESTADO_COLOR[est]} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 13.5, color: PALETTE.chalk }}>
            Tu carnet {formatNumeroSocio(socio.numero_socio)} está {ESTADO_LABEL[est].toLowerCase()}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label }}>
            Toca para ver más
          </div>
        </div>
        <ChevronRight size={18} color="rgba(244,246,241,0.4)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

function UltimaNoticia({ noticia }) {
  if (!noticia) return null;
  return (
    <Link href="/noticias" style={{ textDecoration: 'none' }}>
      <div style={{
        ...authCardStyle, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}>
        {noticia.imagen ? (
          <img src={noticia.imagen} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(201,162,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Newspaper size={20} color={PALETTE.brass} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: PALETTE.brass, fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 2 }}>
            Última noticia
          </div>
          <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 13.5, color: PALETTE.chalk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {noticia.titulo}
          </div>
        </div>
        <ChevronRight size={18} color="rgba(244,246,241,0.4)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

function PerfilInicio({ sesion, misSociosAprobados }) {
  const [proximoPartido, setProximoPartido] = useState(undefined);
  const [jugados, setJugados] = useState(undefined);
  const [ultimaNoticia, setUltimaNoticia] = useState(undefined);
  const [escudoRacing, setEscudoRacing] = useState(null);
  const [totalSocios, setTotalSocios] = useState(null);

  useEffect(() => {
    supabase.from('partidos').select('*').is('resultado', null)
      .order('fecha', { ascending: true, nullsFirst: false }).limit(1)
      .then(({ data }) => setProximoPartido(data && data[0] ? data[0] : null));

    supabase.from('partidos').select('*').not('resultado', 'is', null)
      .order('fecha', { ascending: false }).limit(5)
      .then(({ data }) => setJugados(data || []));

    supabase.from('noticias').select('*').order('fecha', { ascending: false }).limit(1)
      .then(({ data }) => setUltimaNoticia(data && data[0] ? data[0] : null));

    getEscudoRacing().then(setEscudoRacing);
    supabase.rpc('contar_socios_aprobados').then(({ data }) => setTotalSocios(data));
  }, []);

  const carnet = primerCarnet(misSociosAprobados);
  const nombreMostrar = carnet ? carnet.nombre : sesion.usuario;
  const antiguedad = carnet ? formatAntiguedad(fechaInicioSocio(carnet)) : '';

  const escudoLocal = proximoPartido?.es_local ? escudoRacing : proximoPartido?.escudo_rival;
  const escudoVisitante = proximoPartido?.es_local ? proximoPartido?.escudo_rival : escudoRacing;

  return (
    <div style={{ padding: '18px 18px 30px', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 420, height: 420, opacity: 0.06, pointerEvents: 'none', zIndex: 0,
      }}>
        <img src="/escudo.png" alt="" style={{ width: '100%', height: '100%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ ...authCardStyle, textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 74, height: 74, borderRadius: '50%', margin: '0 auto 14px', overflow: 'hidden',
            border: `2px solid ${PALETTE.brass}`, background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {carnet?.foto ? <img src={carnet.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src="/escudo.png" alt="" style={{ width: '65%', height: '65%', objectFit: 'contain', opacity: 0.6 }} />}
          </div>
          <div style={{ fontFamily: fontStack.label, fontSize: 12.5, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
            {saludoActual()}
          </div>
          <div style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 30, color: PALETTE.chalk, letterSpacing: 1 }}>
            {nombreMostrar}
          </div>
          {totalSocios !== null && totalSocios > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              background: 'rgba(201,162,75,0.12)', border: '1px solid rgba(201,162,75,0.35)', borderRadius: 999,
              padding: '4px 12px', fontFamily: fontStack.label, fontSize: 12, fontWeight: 700, color: PALETTE.brass,
            }}>
              <Users size={13} /> Ya somos {totalSocios} {totalSocios === 1 ? 'socio' : 'socios'}
            </div>
          )}
        </div>

        {carnet && <AvisoCarnet socio={carnet} />}

        <Link href="/calendario" style={{ textDecoration: 'none' }}>
        <div style={{ ...authCardStyle, marginBottom: 18, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
            <CalendarIcon size={16} color={PALETTE.brass} />
            <span style={{ fontFamily: fontStack.label, fontSize: 12.5, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Próximo partido
            </span>
          </div>
          {proximoPartido === undefined ? (
            <div style={{ textAlign: 'center', color: 'rgba(244,246,241,0.5)', fontSize: 13 }}>Cargando...</div>
          ) : proximoPartido ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <EscudoMini src={escudoLocal} />
                  <span style={{ fontSize: 11, fontFamily: fontStack.label, color: 'rgba(244,246,241,0.65)', textAlign: 'center' }}>
                    {proximoPartido.es_local ? 'Racing' : proximoPartido.rival}
                  </span>
                </div>
                <span style={{ fontFamily: fontStack.display, fontSize: 16, color: 'rgba(244,246,241,0.35)' }}>VS</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <EscudoMini src={escudoVisitante} />
                  <span style={{ fontSize: 11, fontFamily: fontStack.label, color: 'rgba(244,246,241,0.65)', textAlign: 'center' }}>
                    {proximoPartido.es_local ? proximoPartido.rival : 'Racing'}
                  </span>
                </div>
              </div>
              <CuentaAtrasPartido partido={proximoPartido} />
            </>
          ) : (
            <CuentaAtrasPartido partido={null} />
          )}
        </div>
        </Link>

        <BloqueResultadoYRacha jugados={jugados} />

        <UltimaNoticia noticia={ultimaNoticia} />

        {antiguedad && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,162,75,0.15), rgba(200,30,44,0.1))',
            border: '1px solid rgba(201,162,75,0.35)', borderRadius: 18, padding: '18px 20px', textAlign: 'center', marginBottom: 18,
          }}>
            <Award size={22} color={PALETTE.brass} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: fontStack.label, fontSize: 11.5, color: 'rgba(244,246,241,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Llevas con la grada
            </div>
            <div style={{ fontFamily: fontStack.heading, fontWeight: 700, fontSize: 18, color: PALETTE.chalk }}>
              {antiguedad}
            </div>
          </div>
        )}

        {carnet && (
          <CompartirCarnet foto={carnet.foto} nombre={nombreMostrar} numeroSocio={carnet.numero_socio} antiguedad={antiguedad} />
        )}
      </div>
    </div>
  );
}

function FormulariosAlta({ sesion }) {
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
    avisarAdmins({
      title: '🆕 Nueva solicitud de alta',
      body: `${nombre.trim()} ${apellidos.trim()} quiere darse de alta como socio (${data.id}).`,
    });
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
      const { error: claimError } = await supabase.rpc('reclamar_carnet', { p_cuenta_id: sesion.id, p_id: carnet.id });
      setBusCargando(false);
      if (claimError) { setBusError('No se pudo añadir el carnet: ' + claimError.message); return; }
      setBusInfo('¡Carnet añadido a tu cuenta! Ya lo puedes ver en "Mis carnets".');
      setBusId(''); setBusApellido('');
      return;
    }
    await supabase.rpc('solicitar_traspaso', { p_cuenta_destino: sesion.id, p_id: carnet.id });
    setBusCargando(false);
    avisarAdmins({
      title: '🔁 Solicitud de traspaso',
      body: `Alguien ha solicitado el carnet ${formatNumeroSocio(carnet.numero_socio)} de otra cuenta.`,
    });
    setBusInfo('Este carnet pertenece a otra cuenta. Se ha enviado una solicitud de traspaso a un admin; te avisaremos cuando la confirme.');
    setBusId(''); setBusApellido('');
  };

  return (
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
  );
}

export default function Inicio() {
  const sesion = useSesion();
  const [misSocios, setMisSocios] = useState(undefined);

  useEffect(() => {
    if (!sesion) return;
    supabase.rpc('mis_socios', { p_cuenta_id: sesion.id }).then(({ data }) => setMisSocios(data || []));
  }, [sesion]);

  if (sesion === undefined || misSocios === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingCrest texto="Cargando..." />
      </div>
    );
  }
  if (!sesion) return null;

  const misSociosAprobados = misSocios.filter((s) => s.estado_solicitud === 'aprobado');

  return (
    <Layout sesion={sesion}>
      {misSociosAprobados.length === 0 ? (
        <FormulariosAlta sesion={sesion} />
      ) : (
        <PerfilInicio sesion={sesion} misSociosAprobados={misSociosAprobados} />
      )}
    </Layout>
  );
}
