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
    y: h + 80 + Math.random() * 200,
    tam: 46 + Math.random() * 18,
    velY: 2.0 + Math.random() * 1.2,
    oscilarBase: Math.random() * Math.PI * 2,
    oscilarVel: 0.02 + Math.random() * 0.015,
    girado: 0,
    velGiro: (0.3 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1),
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
        g.girado += g.velGiro;
        const oscilarX = Math.sin(frame * g.oscilarVel + g.oscilarBase) * 18;

        if (escudoCargado && escudoImg) {
          const anchoVisible = Math.abs(Math.cos((g.girado * Math.PI) / 180)) * g.tam;
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(g.x + oscilarX, g.y, g.tam / 2 + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.arc(g.x + oscilarX, g.y, g.tam / 2 + 4, 0, Math.PI * 2);
          ctx.clip();
          ctx.translate(g.x + oscilarX, g.y);
          ctx.scale(Math.max(0.08, anchoVisible / g.tam), 1);
          ctx.drawImage(escudoImg, -g.tam / 2, -g.tam / 2, g.tam, g.tam);
          ctx.restore();
          ctx.restore();

          ctx.strokeStyle = 'rgba(244,246,241,0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(g.x + oscilarX, g.y + g.tam / 2 + 4);
          ctx.lineTo(g.x + oscilarX * 0.6, g.y + g.tam / 2 + 40);
          ctx.stroke();
        }
      });
      globos = globos.filter((g) => g.y > -g.tam - 60);

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
