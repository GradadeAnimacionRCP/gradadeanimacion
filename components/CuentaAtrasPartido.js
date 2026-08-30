import { useState, useEffect } from 'react';
import { PALETTE, fontStack } from '../styles/tema';

function calcularRestante(objetivo) {
  const diff = objetivo - Date.now();
  if (diff <= 0) return null;
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

function Bloque({ valor, etiqueta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 46 }}>
      <div style={{ fontFamily: fontStack.display, fontSize: 26, color: PALETTE.chalk, lineHeight: 1 }}>
        {String(valor).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: fontStack.label, fontSize: 10, color: 'rgba(244,246,241,0.55)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
        {etiqueta}
      </div>
    </div>
  );
}

export function CuentaAtrasPartido({ partido }) {
  const [restante, setRestante] = useState(null);

  useEffect(() => {
    if (!partido || !partido.fecha) { setRestante(null); return; }
    const objetivo = new Date(`${partido.fecha}T${partido.hora || '00:00:00'}`).getTime();
    const actualizar = () => setRestante(calcularRestante(objetivo));
    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, [partido?.fecha, partido?.hora]);

  if (!partido || !partido.fecha) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(244,246,241,0.55)', fontSize: 13, fontFamily: fontStack.label, padding: '10px 0' }}>
        Todavía no hay fecha para el próximo partido.
      </div>
    );
  }

  if (!restante) {
    return (
      <div style={{ textAlign: 'center', color: PALETTE.brass, fontSize: 14, fontFamily: fontStack.heading, fontWeight: 700, padding: '10px 0' }}>
        ¡El partido es hoy! ⚽
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 4 }}>
        <Bloque valor={restante.dias} etiqueta="días" />
        <Bloque valor={restante.horas} etiqueta="horas" />
        <Bloque valor={restante.minutos} etiqueta="min" />
        <Bloque valor={restante.segundos} etiqueta="seg" />
      </div>
      {!partido.hora && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(244,246,241,0.45)', fontFamily: fontStack.label, marginTop: 4 }}>
          Hora todavía por confirmar
        </div>
      )}
    </div>
  );
}
