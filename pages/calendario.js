import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack } from '../styles/tema';
import { PartidoCard, partidoEsPasado } from '../components/PartidoCard';
import { Calendar } from 'lucide-react';

export default function CalendarioPage() {
  const sesion = useSesion();
  const [partidos, setPartidos] = useState(undefined);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('partidos').select('*').order('fecha', { ascending: true, nullsFirst: false });
    setPartidos(data || []);
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
  }

  const proximos = (partidos || []).filter((p) => !partidoEsPasado(p));
  const jugados = (partidos || []).filter((p) => partidoEsPasado(p)).reverse();

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '18px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: 2, color: PALETTE.chalk }}>CALENDARIO</h2>
          <p style={{ color: 'rgba(244,246,241,0.6)', fontSize: 13.5, marginTop: 4 }}>Partidos en casa y fuera de la temporada</p>
        </div>

        <h3 style={{ fontFamily: fontStack.heading, fontSize: 15, color: PALETTE.chalk, margin: '0 0 12px' }}>Próximos partidos</h3>
        {partidos === undefined ? (
          <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 20 }}>Cargando...</div>
        ) : proximos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)', marginBottom: 24 }}>
            <Calendar size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontSize: 13.5 }}>Todavía no hay partidos programados.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
            {proximos.map((p) => <PartidoCard key={p.id} partido={p} />)}
          </div>
        )}

        {jugados.length > 0 && (
          <>
            <h3 style={{ fontFamily: fontStack.heading, fontSize: 15, color: PALETTE.chalk, margin: '0 0 12px' }}>Partidos jugados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jugados.map((p) => <PartidoCard key={p.id} partido={p} />)}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
