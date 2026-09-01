import { useState, useEffect } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { estadoMember, formatFecha, formatNumeroSocio, temporadaLabel, ESTADO_COLOR, ESTADO_LABEL } from '../lib/socios';
import { getFondoTemporada, temporadaKeyDeFecha } from '../lib/temporada';
import { infoCargo } from '../lib/cargos';
import { Users } from 'lucide-react';

export function CarnetCard({ socio }) {
  const [flipped, setFlipped] = useState(false);
  const [fondo, setFondo] = useState(null);
  const [cargoActivo, setCargoActivo] = useState(null);

  useEffect(() => {
    if (!socio) return;
    let cancelado = false;
    getFondoTemporada(temporadaKeyDeFecha(socio.fecha_caducidad)).then((v) => { if (!cancelado) setFondo(v); });
    return () => { cancelado = true; };
  }, [socio?.fecha_caducidad]);

  if (!socio) return null;
  const est = estadoMember(socio);
  const puedeGirar = est === 'activo';
  const nombreCompleto = `${socio.nombre} ${socio.apellidos}`.toUpperCase();
  const cargos = (socio.cargos || []).map((c) => infoCargo(c)).filter(Boolean);

  const handleClickInsignia = (e, cargo) => {
    e.stopPropagation();
    setCargoActivo(cargo);
  };

  return (
    <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
      {cargoActivo && (
        <div onClick={() => setCargoActivo(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: `linear-gradient(160deg, ${PALETTE.pitch} 0%, ${PALETTE.pitchDark} 85%)`,
            border: `1px solid ${PALETTE.brass}55`, borderRadius: 18, padding: '28px 24px',
            textAlign: 'center', maxWidth: 300,
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{cargoActivo.emoji}</div>
            <div style={{ color: PALETTE.chalk, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 15.5, lineHeight: 1.4 }}>
              {cargoActivo.etiqueta}
            </div>
          </div>
        </div>
      )}

      <div style={{ perspective: 1400 }}>
        <div
          onClick={() => { if (puedeGirar) setFlipped((f) => !f); }}
          style={{
            position: 'relative', transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4, 0.15, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: puedeGirar ? 'pointer' : 'default',
          }}
        >
          {/* CARA DELANTERA */}
          <div style={{
            borderRadius: 22, overflow: 'hidden',
            background: `linear-gradient(160deg, ${PALETTE.pitch} 0%, ${PALETTE.pitchDark} 75%)`,
            boxShadow: '0 18px 45px -12px rgba(0,0,0,0.55)', border: '1px solid rgba(201,162,75,0.35)',
            fontFamily: fontStack.body, color: PALETTE.chalk, position: 'relative',
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          }}>
            {fondo && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fondo})`, backgroundSize: 'cover', backgroundPosition: 'center 35%' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(165deg, ${PALETTE.pitch}66 0%, ${PALETTE.pitchDark}99 78%)` }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${PALETTE.ink}80 0%, transparent 22%, transparent 78%, ${PALETTE.ink}80 100%)` }} />

            {cargos.length > 0 && (
              <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, display: 'flex', gap: 6 }}>
                {cargos.map((c, i) => (
                  <div
                    key={i}
                    onClick={(e) => handleClickInsignia(e, c)}
                    title={c.etiqueta}
                    style={{
                      cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: 'rgba(10,10,10,0.55)',
                      border: `1.5px solid ${PALETTE.brass}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, boxShadow: '0 4px 10px -2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {c.emoji}
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: 'relative', padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/escudo.png" alt="" style={{ width: 34, height: 34 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fontStack.heading, fontWeight: 700, letterSpacing: 1.2, fontSize: 15 }}>GRADA DE ANIMACIÓN</div>
                <div style={{ fontFamily: fontStack.label, fontWeight: 600, letterSpacing: 2, fontSize: 11.5, color: PALETTE.brass, textTransform: 'uppercase' }}>Racing Club Portuense</div>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed rgba(201,162,75,0.3)', margin: '0 18px', position: 'relative' }} />

            <div style={{ position: 'relative', padding: '16px 18px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 76, height: 76, borderRadius: 14, flexShrink: 0, overflow: 'hidden', border: `2px solid ${PALETTE.brass}`, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {socio.foto ? <img src={socio.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={30} color={PALETTE.chalk} opacity={0.5} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: fontStack.label, fontSize: 11, letterSpacing: 1.5, color: PALETTE.stripeSoft, textTransform: 'uppercase', fontWeight: 700 }}>Socio de la grada</div>
                <div style={{ fontFamily: fontStack.heading, fontWeight: 600, fontSize: 16.5, lineHeight: 1.18, wordBreak: 'break-word' }}>{nombreCompleto}</div>
                <div style={{ marginTop: 6, display: 'inline-block', background: PALETTE.brass, color: PALETTE.ink, fontFamily: fontStack.heading, fontWeight: 700, fontSize: 14, letterSpacing: 1, padding: '2px 10px', borderRadius: 6 }}>
                  Nº {formatNumeroSocio(socio.numero_socio)}
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', padding: '6px 18px 4px', display: 'flex', justifyContent: 'space-between', fontFamily: fontStack.label, fontSize: 12.5, color: 'rgba(244,246,241,0.75)' }}>
              <span>Alta: {formatFecha(socio.fecha_alta)}</span>
              <span>{socio.tipo || 'General'}</span>
              <span style={{ color: ESTADO_COLOR[est] }}>{ESTADO_LABEL[est]}</span>
            </div>
            <div style={{ position: 'relative', padding: '0 18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11.5, fontFamily: fontStack.label }}>
              <span style={{ color: 'rgba(244,246,241,0.5)' }}>Válido hasta {formatFecha(socio.fecha_caducidad)}</span>
              <span style={{ color: PALETTE.brass, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Temporada {temporadaLabel(socio.fecha_caducidad)}</span>
            </div>
          </div>

          {/* CARA TRASERA */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: `linear-gradient(155deg, ${PALETTE.stripe} 0%, #6d0f16 85%)`,
            border: '1px solid rgba(201,162,75,0.35)', boxShadow: '0 18px 45px -12px rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
          }}>
            <img src="/escudo.png" alt="" style={{ width: 104, height: 104 }} />
            <div style={{ fontFamily: fontStack.display, fontSize: 22, letterSpacing: 2, color: PALETTE.chalk, textAlign: 'center', lineHeight: 1.1 }}>
              GRADA DE ANIMACIÓN
            </div>
            <div style={{ fontFamily: fontStack.label, fontSize: 12, letterSpacing: 3, color: 'rgba(244,246,241,0.75)', textTransform: 'uppercase' }}>
              Socio Nº {formatNumeroSocio(socio.numero_socio)}
            </div>
          </div>
        </div>
      </div>
      {puedeGirar && (
        <div style={{ textAlign: 'center', fontSize: 11.5, marginTop: 10, color: 'rgba(244,246,241,0.4)', fontFamily: fontStack.label }}>
          Toca el carnet para darle la vuelta
        </div>
      )}
    </div>
  );
}
