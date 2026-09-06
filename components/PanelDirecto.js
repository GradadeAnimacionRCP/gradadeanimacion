import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button } from './UI';
import { Play, Pause, Flag, Plus, Minus, Radio } from 'lucide-react';

async function avisarTodos({ title, body }) {
  fetch('/api/send-push', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, url: '/calendario' }),
  }).catch(() => {});
}

function parsearMarcador(texto) {
  const partes = (texto || '0 - 0').split('-').map((n) => parseInt(n.trim(), 10));
  return { local: isNaN(partes[0]) ? 0 : partes[0], visitante: isNaN(partes[1]) ? 0 : partes[1] };
}

export function PanelDirecto({ partido, adminId, onCambio }) {
  const [minuto, setMinuto] = useState(partido.minuto_en_vivo || '');
  const [guardando, setGuardando] = useState(false);
  const { local, visitante } = parsearMarcador(partido.marcador_en_vivo);

  const actualizar = async (campos) => {
    setGuardando(true);
    await supabase.from('partidos').update(campos).eq('id', partido.id);
    setGuardando(false);
    onCambio();
  };

  const nombreLocal = partido.es_local ? 'Racing' : partido.rival;
  const nombreVisitante = partido.es_local ? partido.rival : 'Racing';

    const handleIniciar = async () => {
    await actualizar({ en_directo: true, estado_directo: 'primera', marcador_en_vivo: '0 - 0', minuto_en_vivo: "1" });
    await supabase.rpc('admin_limpiar_gradacar', { p_admin_id: adminId, p_partido_id: partido.id });

    const { data: anteriores } = await supabase
      .from('partidos').select('id').not('resultado', 'is', null).lt('fecha', partido.fecha);
    for (const p of anteriores || []) {
      await supabase.rpc('cerrar_votacion_mvp', { p_partido_id: p.id });
    }

    avisarTodos({ title: '⚽ ¡Arranca el partido!', body: `Comienza ${nombreLocal} vs ${nombreVisitante}. ¡Vamos Racing!` });
  };

  const handleDescanso = async () => {
    await actualizar({ estado_directo: 'descanso' });
    avisarTodos({ title: '⏸️ Descanso', body: `${nombreLocal} ${local} - ${visitante} ${nombreVisitante} al descanso.` });
  };

  const handleSegundaParte = async () => {
    await actualizar({ estado_directo: 'segunda', minuto_en_vivo: "46" });
    avisarTodos({ title: '▶️ ¡Empieza la segunda parte!', body: `${nombreLocal} ${local} - ${visitante} ${nombreVisitante}.` });
  };

    const handleFinalizar = async () => {
    await actualizar({ en_directo: false, estado_directo: 'finalizado', resultado: `${local}-${visitante}`, finalizado_en: new Date().toISOString() });
    avisarTodos({ title: '🏁 Final del partido', body: `${nombreLocal} ${local} - ${visitante} ${nombreVisitante}.` });
  };

  const handleGol = async (equipo) => {
    const nuevoLocal = equipo === 'local' ? local + 1 : local;
    const nuevoVisitante = equipo === 'visitante' ? visitante + 1 : visitante;
    const marcadorNuevo = `${nuevoLocal} - ${nuevoVisitante}`;
    await actualizar({ marcador_en_vivo: marcadorNuevo });
    const esGolRacing = (equipo === 'local' && partido.es_local) || (equipo === 'visitante' && !partido.es_local);
    avisarTodos({
      title: esGolRacing ? '⚽🔴 ¡GOOOL DEL RACING!' : '⚽ Gol del rival',
      body: `${nombreLocal} ${nuevoLocal} - ${nuevoVisitante} ${nombreVisitante}${minuto ? ` (min. ${minuto})` : ''}`,
    });
  };

  const handleQuitarGol = async (equipo) => {
    const nuevoLocal = equipo === 'local' ? Math.max(0, local - 1) : local;
    const nuevoVisitante = equipo === 'visitante' ? Math.max(0, visitante - 1) : visitante;
    await actualizar({ marcador_en_vivo: `${nuevoLocal} - ${nuevoVisitante}` });
  };

  const handleGuardarMinuto = () => {
    actualizar({ minuto_en_vivo: minuto });
  };

  return (
    <div style={{ background: 'rgba(200,30,44,0.08)', border: '1px solid rgba(200,30,44,0.35)', borderRadius: 14, padding: 14, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: PALETTE.stripe, fontFamily: fontStack.label, fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
        <Radio size={14} /> Control en directo
      </div>

      {!partido.en_directo ? (
        <div>
          <p style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Al iniciar, se eliminarán los anuncios de GradaCar de este partido (ya no hará falta compartir coche).
          </p>
          <Button variant="primary" disabled={guardando} onClick={handleIniciar} style={{ width: '100%' }}>
            <Play size={15} /> Iniciar partido en directo
          </Button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label, marginBottom: 6 }}>{nombreLocal}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => handleQuitarGol('local')} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: PALETTE.chalk, cursor: 'pointer' }}>
                  <Minus size={15} style={{ margin: '0 auto' }} />
                </button>
                <span style={{ fontSize: 30, fontFamily: fontStack.heading, fontWeight: 800, color: PALETTE.chalk, minWidth: 40 }}>{local}</span>
                <button onClick={() => handleGol('local')} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ADE80', cursor: 'pointer' }}>
                  <Plus size={15} style={{ margin: '0 auto' }} />
                </button>
              </div>
            </div>
            <div style={{ fontFamily: fontStack.display, fontSize: 20, color: 'rgba(244,246,241,0.35)', marginTop: 22 }}>-</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label, marginBottom: 6 }}>{nombreVisitante}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => handleQuitarGol('visitante')} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: PALETTE.chalk, cursor: 'pointer' }}>
                  <Minus size={15} style={{ margin: '0 auto' }} />
                </button>
                <span style={{ fontSize: 30, fontFamily: fontStack.heading, fontWeight: 800, color: PALETTE.chalk, minWidth: 40 }}>{visitante}</span>
                <button onClick={() => handleGol('visitante')} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ADE80', cursor: 'pointer' }}>
                  <Plus size={15} style={{ margin: '0 auto' }} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" style={{ ...inputStyle, flex: 1, textAlign: 'center' }} placeholder="Minuto" value={minuto} onChange={(e) => setMinuto(e.target.value)} />
            <Button variant="ghost" onClick={handleGuardarMinuto} style={{ fontSize: 12.5 }}>Actualizar minuto</Button>
          </div>

          <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.5)', fontFamily: fontStack.label, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', fontWeight: 700 }}>
            Estado: {partido.estado_directo === 'primera' ? '1ª parte' : partido.estado_directo === 'descanso' ? 'Descanso' : partido.estado_directo === 'segunda' ? '2ª parte' : partido.estado_directo}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {partido.estado_directo === 'primera' && (
              <Button variant="ghost" disabled={guardando} onClick={handleDescanso} style={{ flex: 1, fontSize: 12.5 }}>
                <Pause size={14} /> Final 1ª parte
              </Button>
            )}
            {partido.estado_directo === 'descanso' && (
              <Button variant="ghost" disabled={guardando} onClick={handleSegundaParte} style={{ flex: 1, fontSize: 12.5 }}>
                <Play size={14} /> Empieza 2ª parte
              </Button>
            )}
            <Button variant="danger" disabled={guardando} onClick={handleFinalizar} style={{ flex: 1, fontSize: 12.5 }}>
              <Flag size={14} /> Final del partido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
