import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { useConfirm } from '../components/ConfirmModal';
import { LoadingCrest } from '../components/LoadingCrest';
import { AsistenciaPartido } from '../components/AsistenciaPartido';
import { GradaCarPanel } from '../components/GradaCarPanel';
import { PALETTE, fontStack } from '../styles/tema';
import { PartidoCard, partidoEsPasado, formatFechaPartido, IconoLocalizacion } from '../components/PartidoCard';
import { Calendar, ChevronDown, Car } from 'lucide-react';

function PartidoResumen({ partido }) {
  const titulo = partido.es_local ? `vs ${partido.rival}` : `vs ${partido.rival} (fuera)`;
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
      gap: 10, padding: '10px 4px', flex: 1, minWidth: 0,
    }}>
      <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <IconoLocalizacion esLocal={partido.es_local} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 13.5, color: PALETTE.chalk, textAlign: 'left' }}>
          {titulo}
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label, textAlign: 'left' }}>
          {formatFechaPartido(partido.fecha, partido.hora)}
        </div>
      </div>
    </div>
  );
}

function tabPillStyle(active) {
  return {
    flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    border: `1px solid ${active ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
    background: active ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
    fontFamily: fontStack.label, fontWeight: 700, fontSize: 13,
  };
}

export default function CalendarioPage() {
  const sesion = useSesion();
  const [confirm, ConfirmUI] = useConfirm();
  const [vista, setVista] = useState('calendario');
  const [partidos, setPartidos] = useState(undefined);
  const [misSocios, setMisSocios] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [verJugados, setVerJugados] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('partidos').select('*').order('fecha', { ascending: true, nullsFirst: false });
    setPartidos(data || []);
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    if (!sesion) return;
    supabase.rpc('mis_socios', { p_cuenta_id: sesion.id }).then(({ data }) => setMisSocios(data || []));
  }, [sesion]);

  if (sesion === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingCrest texto="Cargando..." />
      </div>
    );
  }

  const proximos = (partidos || []).filter((p) => !partidoEsPasado(p));
  const jugados = (partidos || []).filter((p) => partidoEsPasado(p)).reverse();
  const siguiente = proximos[0];
  const resto = proximos.slice(1);

  return (
    <Layout sesion={sesion}>
      {ConfirmUI}
      <div style={{ padding: '18px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: 2, color: PALETTE.chalk }}>CALENDARIO</h2>
          <p style={{ color: 'rgba(244,246,241,0.6)', fontSize: 13.5, marginTop: 4 }}>Partidos en casa y fuera de la temporada</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setVista('calendario')} style={tabPillStyle(vista === 'calendario')}>
            <Calendar size={14} /> Calendario
          </button>
          <button onClick={() => setVista('gradacar')} style={tabPillStyle(vista === 'gradacar')}>
            <Car size={14} /> GradaCar
          </button>
        </div>

        {vista === 'calendario' && (
          partidos === undefined ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingCrest texto="Cargando partidos..." />
            </div>
          ) : proximos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)', marginBottom: 24 }}>
              <Calendar size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 13.5 }}>Todavía no hay partidos programados.</p>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
                Próximo partido
              </div>
              <div style={{ marginBottom: 22 }}>
                <PartidoCard partido={siguiente} destacado />
                <AsistenciaPartido partidoId={siguiente.id} cuentaId={sesion.id} misSocios={misSocios} confirm={confirm} />
              </div>

              {resto.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {resto.map((p) => (
                      <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12, overflow: 'hidden' }}>
                        <button
                          onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                          style={{
                            width: '100%', background: 'none', border: 'none', padding: '2px 12px', cursor: 'pointer',
                            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          }}
                        >
                          <PartidoResumen partido={p} />
                          <ChevronDown size={18} color="rgba(244,246,241,0.5)" style={{ transform: expandido === p.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 8 }} />
                        </button>
                        {expandido === p.id && (
                          <div style={{ padding: '0 10px 12px' }}>
                            <PartidoCard partido={p} />
                            <AsistenciaPartido partidoId={p.id} cuentaId={sesion.id} misSocios={misSocios} confirm={confirm} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {vista === 'calendario' && jugados.length > 0 && (
          <div>
            <button
              onClick={() => setVerJugados((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,246,241,0.1)', borderRadius: 12,
                padding: '12px 16px', cursor: 'pointer', marginBottom: verJugados ? 12 : 0,
              }}
            >
              <span style={{ fontFamily: fontStack.heading, fontSize: 14.5, color: PALETTE.chalk, fontWeight: 600 }}>
                Partidos jugados ({jugados.length})
              </span>
              <ChevronDown size={18} color="rgba(244,246,241,0.5)" style={{ transform: verJugados ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {verJugados && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {jugados.map((p) => <PartidoCard key={p.id} partido={p} />)}
              </div>
            )}
          </div>
        )}

        {vista === 'gradacar' && (
          partidos === undefined ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingCrest texto="Cargando..." />
            </div>
          ) : !siguiente ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
              <Car size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 13.5 }}>No hay ningún partido próximo para compartir coche.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: fontStack.label, fontSize: 12, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
                Coches para el próximo partido
              </div>
              <div style={{ fontSize: 13, color: 'rgba(244,246,241,0.6)', textAlign: 'center', marginBottom: 18 }}>
                {siguiente.es_local ? `vs ${siguiente.rival}` : `${siguiente.rival} (fuera)`} · {formatFechaPartido(siguiente.fecha, siguiente.hora)}
              </div>
              <GradaCarPanel partidoId={siguiente.id} sesion={sesion} misSocios={misSocios} confirm={confirm} />
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
