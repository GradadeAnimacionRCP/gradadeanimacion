import { useState, useEffect, useRef } from 'react';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';

export function CropModal({ src, onCancel, onConfirm }) {
  const VP = 280;
  const OUT = 480;

  const [img, setImg] = useState(null);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const scaleRef = useRef(1);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  useEffect(() => {
    setError(''); setImg(null);
    const image = new Image();
    image.onload = () => {
      const s0 = VP / Math.min(image.width, image.height);
      setImg(image); setMinScale(s0); setScale(s0);
      setPos({ x: (VP - image.width * s0) / 2, y: (VP - image.height * s0) / 2 });
    };
    image.onerror = () => setError('No se pudo abrir esta imagen. Prueba con otra foto.');
    image.src = src;
  }, [src]);

  const clampPos = (nx, ny, s, image) => {
    if (!image) return { x: nx, y: ny };
    const w = image.width * s, h = image.height * s;
    return {
      x: Math.max(Math.min(0, VP - w), Math.min(0, nx)),
      y: Math.max(Math.min(0, VP - h), Math.min(0, ny)),
    };
  };

  const handlePointerDown = (e) => {
    if (!img) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos(clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy, scaleRef.current, img));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleZoom = (e) => {
    const s = parseFloat(e.target.value);
    setScale(s);
    setPos((p) => clampPos(p.x, p.y, s, img));
  };

  const handleConfirm = () => {
    if (!img) return;
    const ratio = OUT / VP;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height, pos.x * ratio, pos.y * ratio, img.width * scale * ratio, img.height * scale * ratio);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.pitchDark, border: '1px solid rgba(201,162,75,0.4)', borderRadius: 18, padding: 20, width: '100%', maxWidth: 340 }}>
        <h3 style={{ fontFamily: fontStack.heading, color: PALETTE.chalk, margin: '0 0 4px', fontSize: 17 }}>Ajusta tu foto</h3>
        <p style={{ fontSize: 12.5, color: 'rgba(244,246,241,0.6)', margin: '0 0 14px' }}>
          {img ? 'Arrastra para mover y usa el deslizador para hacer zoom.' : 'Cargando imagen...'}
        </p>
        <div onPointerDown={handlePointerDown} style={{
          width: VP, height: VP, margin: '0 auto', borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: '#000', border: `2px solid ${PALETTE.brass}`, touchAction: 'none', cursor: img ? 'grab' : 'default',
        }}>
          {img && (
            <img src={src} alt="" draggable={false} style={{
              position: 'absolute', left: 0, top: 0, width: img.width * scale, height: img.height * scale,
              transform: `translate(${pos.x}px, ${pos.y}px)`, userSelect: 'none', pointerEvents: 'none',
            }} />
          )}
          {error && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, color: '#ff8a8a', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
        {img && (
          <input type="range" min={minScale} max={minScale * 3.5} step={0.001} value={scale} onChange={handleZoom}
            style={{ width: '100%', marginTop: 16, accentColor: PALETTE.brass }} />
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!img} style={{ flex: 1 }}>
            {img ? 'Usar foto' : 'Cargando...'}
          </Button>
        </div>
      </div>
    </div>
  );
}
