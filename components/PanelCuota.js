import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button } from './UI';
import { formatNumeroSocio, formatFecha } from '../lib/socios';
import { Euro, Check } from 'lucide-react';

function avisarCuenta(cuentaId) {
  return fetch('/api/send-push', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cuentaId,
      title: '⚠️ Cuota anual pendiente',
      body: 'Hemos detectado que no has pagado la cuota anual de 10 € de la Grada de Animación. Ponte en contacto con un administrador o por el grupo de WhatsApp. Si no se resuelve en 7 días, tu cuenta se inhabilitará.',
      url: '/cuenta',
    }),
  }).catch(() => {});
}

function diasRestantes(desde) {
  return 7 - Math.floor((Date.now() - new Date(desde).getTime()) / 86400000);
}

export function PanelCuota({ adminId, socios, confirm }) {
  const [pendientes, setPendientes] = useState(undefined);
  const [seleccion, setSeleccion] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('admin_listar_cuotas_pendientes', { p_admin_id: adminId });
    setPendientes(data || []);
  }, [adminId]);

  useEffect(() => { cargar(); }, [cargar]);

  const idsPendientes = new Set((pendientes || []).map((p) => p.socio_id));
  const candidatos = (socios || []).filter((s) => s.estado_solicitud === 'aprobado' && !idsPendientes.has(s.id));
  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? candidatos.filter((s) => `${s.nombre} ${s.apellidos} ${formatNumeroSocio(s.numero_socio)}`.toLowerCase().includes(q))
    : candidatos;
  const elegidos = candidatos.filter((s) => seleccion[s.id]);

  const handleAvisar = async () => {
    setError('');
    if (elegidos.length === 0) return;
    const nombres = elegidos.slice(0, 5).map((s) => `${s.nombre} ${s.apellidos}`).join(', ')
      + (elegidos.length > 5 ? ` y ${elegidos.length - 5} más` : '');
    const ok = await confirm(`¿Avisar de cuota pendiente a ${elegidos.length} carnet(s): ${nombres}? Sus cuentas quedarán bloqueadas salvo el menú Cuenta, con un plazo de 7 días. Recibirán una notificación push.`);
    if (!ok) return;

    setEnviando(true);
    const { error: dbError } = await supabase.rpc('admin_marcar_cuota_pendiente', {
      p_admin_id: adminId, p_socio_ids: elegidos.map((s) => s.id),
    });
    if (dbError) { setEnviando(false); setError(dbError.message); return; }

    const cuentas = [...new Set(elegidos.map((s) => s.cuenta_id).filter(Boolean))];
    await Promise.all(cuentas.map(avisarCuenta));

    setSeleccion({});
    setEnviando(false);
    cargar();
  };

  const handlePagada = async (p) => {
    const ok = await confirm(`¿Confirmas que ${p.nombre} ${p.apellidos} ya ha regularizado la cuota? Se le quitará el bloqueo.`);
    if (!ok) return;
    await supabase.rpc('admin_quitar_cuota_pendiente', { p_admin_id: adminId, p_socio_id: p.socio_id });
    cargar();
  };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16, marginBottom: 18 };

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Euro size={17} color={PALETTE.brass} />
          <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: 0, color: PALETTE.chalk }}>
            Cuota pendiente ({pendientes === undefined ? '…' : pendientes.length})
          </h3>
        </div>
        {pendientes && pendientes.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.55)', margin: 0 }}>Nadie tiene la cuota marcada como pendiente.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(pendientes || []).map((p) => {
            const dias = diasRestantes(p.desde);
            const vencido = dias <= 0;
            return (
              <div key={p.socio_id} style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12,
                background: vencido ? 'rgba(200,30,44,0.12)' : 'rgba(255,176,32,0.08)',
                border: `1px solid ${vencido ? 'rgba(200,30,44,0.5)' : 'rgba(255,176,32,0.4)'}`,
              }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ color: PALETTE.chalk, fontWeight: 600, fontSize: 13.5 }}>{p.nombre} {p.apellidos}</div>
                  <div style={{ fontSize: 11.5, fontFamily: fontStack.label, fontWeight: 700, color: vencido ? '#ff8a8a' : '#FFD27A' }}>
                    {formatNumeroSocio(p.numero_socio)} · avisado el {formatFecha(p.desde)} · {vencido ? 'plazo vencido' : `quedan ${dias} día${dias === 1 ? '' : 's'}`}
                  </div>
                </div>
                <Button variant="primary" onClick={() => handlePagada(p)} style={{ fontSize: 12.5 }}>
                  <Check size={14} /> Ya ha pagado
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: '0 0 6px', color: PALETTE.chalk }}>Avisar de cuota anual (10 €)</h3>
        <p style={{ fontSize: 12, color: 'rgba(244,246,241,0.55)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Marca los carnets que no han pagado. Recibirán una notificación y su cuenta quedará bloqueada salvo el menú Cuenta. Las cuentas de admin siguen pudiendo entrar a Admin.
        </p>
        <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Buscar por nombre o número..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {filtrados.map((s) => {
            const marcado = !!seleccion[s.id];
            return (
              <button key={s.id} onClick={() => setSeleccion((prev) => ({ ...prev, [s.id]: !prev[s.id] }))} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                background: marcado ? 'rgba(200,30,44,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${marcado ? PALETTE.stripe : 'rgba(244,246,241,0.15)'}`,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: marcado ? PALETTE.stripe : 'transparent', border: marcado ? 'none' : '1.5px solid rgba(244,246,241,0.35)',
                }}>
                  {marcado && <span style={{ color: PALETTE.chalk, fontSize: 12, fontWeight: 800 }}>✓</span>}
                </span>
                <span style={{ fontSize: 13.5, color: PALETTE.chalk, flex: 1 }}>{s.nombre} {s.apellidos}</span>
                <span style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label }}>{formatNumeroSocio(s.numero_socio)}</span>
              </button>
            );
          })}
          {filtrados.length === 0 && <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.5)', textAlign: 'center' }}>Ningún resultado.</p>}
        </div>
        {error && <div style={{ color: '#ff8a8a', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <Button variant="danger" disabled={enviando || elegidos.length === 0} onClick={handleAvisar} style={{ width: '100%' }}>
          {enviando ? 'Enviando...' : `Avisar y bloquear (${elegidos.length})`}
        </Button>
      </div>
    </div>
  );
}
