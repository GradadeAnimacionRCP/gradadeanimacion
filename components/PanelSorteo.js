import { useState, useRef } from 'react';
import { PALETTE, fontStack, inputStyle } from '../styles/tema';
import { Button } from './UI';
import { supabase } from '../lib/supabase';
import { Ticket } from 'lucide-react';

export function PanelSorteo({ adminId, partidoId, confirm }) {
  const [rango, setRango] = useState('999');
  const [ganador, setGanador] = useState(null);
  const [sorteando, setSorteando] = useState(false);
  const [numeroAnimado, setNumeroAnimado] = useState(null);
  const [revelando, setRevelando] = useState(false);
  const [error, setError] = useState('');
  const animRef = useRef(null);

  const handleSortear = async () => {
    setError('');
    const rangoNum = parseInt(rango, 10);
    if (isNaN(rangoNum) || rangoNum < 0 || rangoNum > 999) {
      setError('Pon un rango entre 0 y 999.');
      return;
    }
    const ok = await confirm(`¿Realizar el sorteo del 000 al ${String(rangoNum).padStart(3, '0')} ahora mismo? Esta acción no se puede deshacer y avisará a todos los socios.`);
    if (!ok) return;

    setSorteando(true);
    const { data, error: dbError } = await supabase.rpc('realizar_sorteo', {
      p_admin_id: adminId, p_partido_id: partidoId || null, p_rango_maximo: rangoNum,
    });

    if (dbError) {
      setSorteando(false);
      setError(dbError.message);
      return;
    }

    setRevelando(true);

    const duracionTotal = 4200;
    const inicioTiempo = Date.now();

    const animar = () => {
      const transcurrido = Date.now() - inicioTiempo;
      const progreso = Math.min(1, transcurrido / duracionTotal);
      const facilitado = 1 - Math.pow(1 - progreso, 3);

      if (progreso < 1) {
        const numeroAleatorio = Math.floor(Math.random() * (rangoNum + 1));
        setNumeroAnimado(String(numeroAleatorio).padStart(3, '0'));
        const siguienteRetraso = 30 + facilitado * 220;
        animRef.current = setTimeout(animar, siguienteRetraso);
      } else {
        setNumeroAnimado(data);
        setTimeout(() => {
          setGanador(data);
          setRevelando(false);
          setSorteando(false);

          fetch('/api/send-push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎟️ ¡Número ganador del sorteo!',
              body: `El número agraciado es el ${data}. ¡Enhorabuena!`,
              url: '/calendario',
            }),
          }).catch(() => {});
        }, 400);
      }
    };

    animar();
  };

  const handleNuevoSorteo = () => {
    clearTimeout(animRef.current);
    setGanador(null);
    setNumeroAnimado(null);
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,246,241,0.12)', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Ticket size={17} color={PALETTE.brass} />
        <h3 style={{ fontFamily: fontStack.heading, fontSize: 15.5, margin: 0, color: PALETTE.chalk }}>Sorteo de números</h3>
      </div>

      {(revelando || ganador) ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ fontSize: 12, color: 'rgba(244,246,241,0.6)', fontFamily: fontStack.label, marginBottom: 14, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
            {ganador ? '🎉 Número ganador 🎉' : 'Sorteando...'}
          </div>
          <div style={{
            display: 'inline-block', padding: '18px 34px', borderRadius: 20,
            background: ganador ? 'linear-gradient(155deg, rgba(201,162,75,0.25), rgba(200,30,44,0.2))' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${ganador ? PALETTE.brass : 'rgba(244,246,241,0.15)'}`,
            boxShadow: ganador ? `0 0 40px rgba(201,162,75,0.4)` : 'none',
            transition: 'all 0.3s',
          }}>
            <div style={{
              fontFamily: fontStack.display, fontSize: 72, letterSpacing: 8,
              color: ganador ? PALETTE.brass : PALETTE.chalk,
              textShadow: ganador ? '0 0 20px rgba(201,162,75,0.6)' : 'none',
            }}>
              {numeroAnimado || '000'}
            </div>
          </div>
          {ganador && (
            <div style={{ marginTop: 10 }}>
              <img src="/escudo.png" alt="" style={{ width: 36, height: 36, opacity: 0.7 }} />
            </div>
          )}
          {ganador && (
            <div>
              <Button variant="ghost" onClick={handleNuevoSorteo} style={{ marginTop: 20, fontSize: 13 }}>
                Hacer otro sorteo
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
            Pon el número más alto vendido (si se han vendido todas las papeletas, deja 999).
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="number" min="0" max="999" style={{ ...inputStyle, flex: 1, textAlign: 'center' }} value={rango} onChange={(e) => setRango(e.target.value)} placeholder="Ej. 131" />
          </div>
          {error && <div style={{ color: '#ff8a8a', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
          <Button variant="danger" disabled={sorteando} onClick={handleSortear} style={{ width: '100%' }}>
            {sorteando ? 'Sorteando...' : '🎲 Realizar sorteo'}
          </Button>
        </>
      )}
    </div>
  );
}
