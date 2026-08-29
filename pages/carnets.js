import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from '../components/UI';
import { CarnetCard } from '../components/CarnetCard';
import { formatNumeroSocio, formatFecha, solicitudEstado, estadoMember, ESTADO_COLOR } from '../lib/socios';
import { CreditCard, LogOut, Camera, Trash2 } from 'lucide-react';

function prepararComprobante(file) {
  const MAX_LADO = 1000;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Este formato de imagen no se puede abrir.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function PendienteAprobacion({ socio, onQuitar }) {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center', maxWidth: 380, margin: '0 auto',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 18 }}>
      <h2 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, fontSize: 17, margin: '0 0 6px' }}>Solicitud en revisión</h2>
      <p style={{ color: 'rgba(244,246,241,0.72)', fontSize: 14, lineHeight: 1.6 }}>
        {socio.nombre}, tu solicitud (<strong style={{ color: PALETTE.brass }}>{formatNumeroSocio(socio.numero_socio)}</strong>) está pendiente de que un admin de la grada la valide.
      </p>
      <Button variant="ghost" onClick={onQuitar} style={{ marginTop: 10, fontSize: 13 }}>
        <LogOut size={15} /> Quitar de mi cuenta
      </Button>
    </div>
  );
}

function TarjetaSocio({ socio, cuentaId, onCambio }) {
  const estado = solicitudEstado(socio);
  const est = estadoMember(socio);

  const [mostrarRenovacion, setMostrarRenovacion] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorRenovacion, setErrorRenovacion] = useState('');
  const fileRef = useRef(null);

  const handleQuitar = async () => {
    if (!confirm(`¿Quitar el carnet ${formatNumeroSocio(socio.numero_socio)} de tu cuenta?`)) return;
    await supabase.rpc('desvincular_socio', { p_cuenta_id: cuentaId, p_id: socio.id });
    onCambio();
  };

  const handleComprobante = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErrorRenovacion('');
    try {
      setComprobante(await prepararComprobante(f));
    } catch (err) {
      setErrorRenovacion(err.message);
    }
  };

  const handleEnviarRenovacion = async () => {
    setErrorRenovacion('');
    if (!comprobante) {
      if (!confirm('¿Estás seguro de enviar la solicitud de renovación sin adjuntar el comprobante de pago?')) return;
    }
    setEnviando(true);
    const { error } = await supabase.rpc('solicitar_renovacion', { p_cuenta_id: cuentaId, p_id: socio.id, p_comprobante: comprobante });
    setEnviando(false);
    if (error) { setErrorRenovacion(error.message); return; }
    setMostrarRenovacion(false);
    setComprobante(null);
    onCambio();
  };

  if (estado === 'pendiente') {
    return <PendienteAprobacion socio={socio} onQuitar={handleQuitar} />;
  }

  if (estado === 'rechazado') {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', maxWidth: 380, margin: '0 auto',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 18 }}>
        <p style={{ color: '#ff8a8a', fontWeight: 600, marginBottom: 4 }}>Solicitud no aceptada ({formatNumeroSocio(socio.numero_socio)})</p>
        <Button variant="ghost" onClick={handleQuitar} style={{ marginTop: 10, fontSize: 13 }}>
          <LogOut size={15} /> Quitar de mi cuenta
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CarnetCard socio={socio} />

      {est !== 'activo' && (
        <div style={{ maxWidth: 380, margin: '12px auto 0', textAlign: 'center', fontSize: 12.5, color: ESTADO_COLOR[est], fontFamily: fontStack.label, fontWeight: 700 }}>
          {est === 'caducado' ? 'Este carnet ha caducado. Puedes solicitar su renovación abajo.' : 'Este carnet está suspendido. Contacta con la grada.'}
        </div>
      )}

      {est === 'caducado' && (
        <div style={{ maxWidth: 380, margin: '12px auto 0' }}>
          {socio.solicitud_renovacion_fecha ? (
            <div style={{ textAlign: 'center', fontSize: 12.5, color: PALETTE.brass, fontFamily: fontStack.label, fontWeight: 700, lineHeight: 1.6 }}>
              ✓ Solicitud de renovación enviada el {formatFecha(socio.solicitud_renovacion_fecha)}
              {socio.solicitud_renovacion_comprobante ? ' (con comprobante adjunto)' : ' (sin comprobante)'}.
              <br />Un admin de la grada la revisará.
            </div>
          ) : !mostrarRenovacion ? (
            <div style={{ textAlign: 'center' }}>
              <Button variant="brass" onClick={() => setMostrarRenovacion(true)}>Solicitar renovación</Button>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 14, padding: 14 }}>
              <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.65)', marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
                Adjunta una foto del justificante de pago (Bizum, transferencia...) si lo tienes a mano. Es opcional.
              </p>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleComprobante}
                style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
              {comprobante ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <img src={comprobante} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${PALETTE.brass}` }} />
                  <Button variant="ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 12.5 }}>Cambiar</Button>
                  <Button variant="ghost" onClick={() => setComprobante(null)} style={{ fontSize: 12.5 }}><Trash2 size={14} /></Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => fileRef.current?.click()} style={{ width: '100%', marginBottom: 12 }}>
                  <Camera size={15} /> Adjuntar comprobante
                </Button>
              )}
              {errorRenovacion && <div style={{ color: '#ff8a8a', fontSize: 12.5, marginBottom: 10 }}>{errorRenovacion}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" disabled={enviando} style={{ flex: 1 }} onClick={() => { setMostrarRenovacion(false); setComprobante(null); setErrorRenovacion(''); }}>
                  Cancelar
                </Button>
                <Button variant="primary" disabled={enviando} style={{ flex: 1 }} onClick={handleEnviarRenovacion}>
                  {enviando ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <Button variant="ghost" onClick={handleQuitar} style={{ fontSize: 12.5, padding: '6px 12px' }}>
          <LogOut size={13} /> Quitar de mi cuenta
        </Button>
      </div>
    </div>
  );
}

export default function Carnets() {
  const sesion = useSesion();
  const [socios, setSocios] = useState(undefined);
  const [vista, setVista] = useState('actuales');

  const cargar = useCallback(async (cuentaId) => {
    const { data, error } = await supabase.rpc('mis_socios', { p_cuenta_id: cuentaId });
    if (!error) setSocios(data || []);
  }, []);

  useEffect(() => {
    if (!sesion) return;
    cargar(sesion.id);
    const interval = setInterval(() => cargar(sesion.id), 5000);
    return () => clearInterval(interval);
  }, [sesion, cargar]);

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
  }
  if (sesion === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8a8a', fontFamily: fontStack.label }}>No se pudo comprobar tu sesión.</div>;
  }

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '18px 16px 40px' }}>
        {socios !== undefined && socios.length > 0 && (
          <div style={{ display: 'flex', gap: 8, maxWidth: 380, margin: '0 auto 22px' }}>
            <button onClick={() => setVista('actuales')} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${vista === 'actuales' ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
              background: vista === 'actuales' ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
              color: vista === 'actuales' ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
              fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
            }}>Abonos actuales</button>
            <button onClick={() => setVista('antiguos')} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${vista === 'antiguos' ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
              background: vista === 'antiguos' ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
              color: vista === 'antiguos' ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
              fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
            }}>Abonos antiguos</button>
          </div>
        )}

        {socios === undefined ? (
          <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 40 }}>Cargando tus carnets...</div>
        ) : socios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(244,246,241,0.7)' }}>
            <CreditCard size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p>Todavía no tienes ningún carnet en tu cuenta.</p>
          </div>
        ) : vista === 'actuales' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {socios.map((s) => (
              <TarjetaSocio key={s.id} socio={s} cuentaId={sesion.id} onCambio={() => cargar(sesion.id)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {socios.flatMap((s) => (s.historial_abonos || [])).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(244,246,241,0.6)' }}>
                <p>Todavía no tienes abonos de temporadas anteriores.</p>
              </div>
            ) : (
              socios.flatMap((s) =>
                (s.historial_abonos || []).map((abono, idx) => (
                  <CarnetCard key={`${s.id}-${idx}`} socio={{
                    numero_socio: abono.numeroSocio, nombre: s.nombre, apellidos: s.apellidos,
                    foto: abono.foto, fecha_alta: abono.fechaAlta, fecha_caducidad: abono.fechaCaducidad, tipo: abono.tipo,
                  }} />
                ))
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
