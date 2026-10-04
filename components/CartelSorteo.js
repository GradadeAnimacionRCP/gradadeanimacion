import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Ticket } from 'lucide-react';

const DURACION_MS = 45 * 60 * 1000;

export function CartelSorteo() {
  const [sorteo, setSorteo] = useState(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      const { data } = await supabase.rpc('sorteo_activo');
      if (!activo) return;
      setSorteo(data && data[0] ? data[0] : null);
    };
    cargar();
    const consulta = setInterval(cargar, 60000);
    const reloj = setInterval(() => setAhora(Date.now()), 20000);
    return () => { activo = false; clearInterval(consulta); clearInterval(reloj); };
  }, []);

  if (!sorteo) return null;
  const restante = new Date(sorteo.publicado_en).getTime() + DURACION_MS - ahora;
  if (restante <= 0) return null;
  const minutos = Math.ceil(restante / 60000);

  return (
    <div style={{
      margin: '14px 18px 0', padding: '16px 18px', borderRadius: 18, textAlign: 'center',
      background: 'linear-gradient(155deg, rgba(201,162,75,0.22), rgba(200,30,44,0.18))',
      border: `1.5px solid ${PALETTE.brass}`, boxShadow: '0 0 28px rgba(201,162,75,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: fontStack.label, fontSize: 12, fontWeight: 800, color: PALETTE.brass, textTransform: 'uppercase', letterSpacing: 1 }}>
        <Ticket size={14} /> Número premiado del sorteo
      </div>
      <div style={{ fontFamily: fontStack.display, fontSize: 60, letterSpacing: 8, color: PALETTE.chalk, textShadow: '0 0 18px rgba(201,162,75,0.55)', lineHeight: 1.1, marginTop: 4 }}>
        {sorteo.numero_ganador}
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label, marginTop: 4 }}>
        Se retira de aquí en {minutos} min
      </div>
    </div>
  );
}
