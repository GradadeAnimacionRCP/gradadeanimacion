import { useEffect, useRef, useState } from 'react';
import { getEscudoRacing } from '../lib/config';

const COLORES_CONFETI = ['#C9A24B', '#C81E2C', '#F7F5F3', '#FFD24C'];

function crearConfeti(w, h) {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.5,
    tam: 6 + Math.random() * 6,
    velY: 1.6 + Math.random() * 2.2,
    velX: (Math.random() - 0.5) * 2,
    rot: Math.random() * 360,
    velRot: (Math.random() - 0.5) * 8,
    color: COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)],
  }));
}

function crearGlobos(w, h) {
  return Array.from({ length: 6 }, (_, i) => ({
    x: (w / 7) * (i + 1) + (Math.random() - 0.5) * 40,
    y: h + 100 + Math.random() * 200,
    tam: 70 + Math.random() * 24,
    velY: 1.8 + Math.random() * 1.1,
    oscilarBase: Math.random() * Math.PI * 2,
    oscilarVel: 0.02 + Math.random() * 0.015,
  }));
}

const MAX_FRAMES = 720;

export function CelebracionVictoria({ onFin }) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    let escudoImg = null;
    let escudoCargado = false;

    getEscudoRacing().then((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { escudoImg = img; escudoCargado = true; };
      img.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => { escudoImg = fallback; escudoCargado = true; };
        fallback.src = '/escudo.png';
      };
      img.src = src || '/escudo.png';
    });

    let confeti = crearConfeti(w, h);
    let globos = crearGlobos(w, h);
    let frame = 0;
    let animId;

    const dibujar = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      confeti.forEach((c) => {
        c.y += c.velY;
        c.x += c.velX;
        c.rot += c.velRot;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.rot * Math.PI) / 180);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.tam / 2, -c.tam / 4, c.tam, c.tam / 2);
        ctx.restore();
      });
      confeti = confeti.filter((c) => c.y < h + 30);
      if (frame < 150 && frame % 4 === 0) confeti.push(...crearConfeti(w, 0).slice(0, 10));

      globos.forEach((g) => {
        g.y -= g.velY;
        const oscilarX = Math.sin(frame * g.oscilarVel + g.oscilarBase) * 18;
        const cx = g.x + oscilarX;
        const cy = g.y;

        if (escudoCargado && escudoImg && escudoImg.naturalWidth) {
          const ratio = escudoImg.naturalHeight / escudoImg.naturalWidth;
          const dibujoAncho = g.tam;
          const dibujoAlto = g.tam * ratio;

          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          ctx.drawImage(escudoImg, cx - dibujoAncho / 2, cy - dibujoAlto / 2, dibujoAncho, dibujoAlto);
          ctx.restore();

          ctx.strokeStyle = 'rgba(244,246,241,0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy + dibujoAlto / 2);
          ctx.quadraticCurveTo(cx + oscilarX * 0.3, cy + dibujoAlto / 2 + 22, cx + oscilarX * 0.6, cy + dibujoAlto / 2 + 42);
          ctx.stroke();
        }
      });
      globos = globos.filter((g) => g.y > -g.tam - 70);

      const quedaAlgo = confeti.length > 0 || globos.length > 0;
      if (quedaAlgo && frame < MAX_FRAMES) {
        animId = requestAnimationFrame(dibujar);
      } else {
        setVisible(false);
        onFin && onFin();
      }
    };

    dibujar();
    return () => cancelAnimationFrame(animId);
  }, [onFin]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}
    />
  );
}
