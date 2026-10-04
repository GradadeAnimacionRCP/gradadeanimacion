import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PALETTE, fontStack } from '../styles/tema';
import { Radio } from 'lucide-react';

function calcularMinuto(p, ahora) {
  if (p.estado_directo === 'descanso') return 'Descanso';
  const esSegunda = p.estado_directo === 'segunda';
  const inicio = esSegunda ? p.inicio_segunda_en : p.iniciado_en;
  if (!inicio) return p.minuto_en_vivo ? `${p.minuto_en_vivo}'` : null;
  const base = esSegunda ? 45 : 0;
  const tope = esSegunda ? 90 : 45;
  const minutos = Math.max(0, Math.floor((ahora - new Date(inicio).getTime()) / 60000));
  const minutoReal = base + minutos;
  if (minutoReal <= tope) return `${minutoReal}'`;
  return `${tope}+${minutoReal - tope}'`;
}

export function MarcadorEnVivo({ partido }) {
  const [vivo, setVivo] = useState(partido);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    setVivo(partido);
  }, [partido.id, partido.en_directo, partido.estado_directo, partido.marcador_en_vivo, partido.iniciado_en, partido.inicio_segunda_en]);

  useEffect(() => {
    if (!partido.en_directo) return;
    let activo = true;
    const cargar = async () => {
      const { data } = await supabase.from('partidos')
        .select('en_directo, estado_directo, marcador_en_vivo, minuto_en_vivo, iniciado_en, inicio_segunda_en')
        .eq('id', partido.id).maybeSingle();
      if (activo && data) setVivo((v) => ({ ...v, ...data }));
    };
    const consulta = setInterval(cargar, 20000);
    const reloj = setInterval(() => setAhora(Date.now()), 15000);
    return () => { activo = false; clearInterval(consulta); clearInterval(reloj); };
  }, [partido.id, partido.en_directo]);

  if (!vivo.en_directo) return null;
  const minuto = calcularMinuto(vivo, ahora);

  return (
    <div style={{
      background: 'rgba(200,30,44,0.12)', border: '1px solid rgba(200,30,44,0.5)',
      borderRadius: 14, padding: '14px 16px', textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
        color: PALETTE.stripe, fontFamily: fontStack.label, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
      }}>
        <Radio size={13} className="gda-loading-pulse" /> En directo
      </div>
      <div style={{ fontFamily: fontStack.heading, fontWeight: 800, fontSize: 34, color: PALETTE.chalk }}>
        {vivo.marcador_en_vivo || '0 - 0'}
      </div>
      {minuto && (
        <div style={{ fontFamily: fontStack.label, fontSize: 13, color: 'rgba(244,246,241,0.6)', marginTop: 4 }}>
          {minuto}
        </div>
      )}
    </div>
  );
}
