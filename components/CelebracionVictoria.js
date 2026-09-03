import { useEffect, useRef, useState } from 'react';

const COLORES_CONFETI = ['#C9A24B', '#C81E2C', '#F7F5F3', '#FFD24C'];

function crearConfeti(w, h) {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.5,
    tam: 6 + Math.random() * 6,
    velY: 2 + Math.random() * 3,
    velX: (Math.random() - 0.5) * 2,
    rot: Math.random() * 360,
    velRot: (Math.random() - 0.5) * 8,
    color: COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)],
  }));
}

function crearGlobos(w, h, escudo) {
  return Array.from({ length: 6 }, (_, i) => ({
    x: (w / 7) * (i + 1) + (Math.random() - 0.5) * 40,
    y: h + 80 + Math.random() * 200,
    tam: 46 + Math.random() * 18,
    velY: 1.1 + Math.random() * 0.8,
    oscilarBase: Math.random() * Math.PI * 2,
    oscilarVel: 0.02 + Math.random() * 0.015,
    escudo,
  }));
}

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

    const escudo = new Image();
    escudo.src = '/escudo.png';

    let confeti = crearConfeti(w, h);
    let globos = [];
    let frame = 0;
    let animId;

    escudo.onload = () => { globos = crearGlobos(w, h, escudo); };

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
      if (frame < 90) confeti.push(...crearConfeti(w, 0).slice(0, 4));

      globos.forEach((g) => {
        g.y -= g.velY;
        const oscilarX = Math.sin(frame * g.oscilarVel + g.oscilarBase) * 18;
        if (g.escudo.complete && g.escudo.naturalWidth) {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(g.x + oscilarX, g.y, g.tam / 2 + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
          ctx.clip();
          ctx.drawImage(g.escudo, g.x + oscilarX - g.tam / 2, g.y - g.tam / 2, g.tam, g.tam);
          ctx.restore();
          ctx.strokeStyle = 'rgba(244,246,241,0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(g.x + oscilarX, g.y + g.tam / 2 + 4);
          ctx.lineTo(g.x + oscilarX * 0.6, g.y + g.tam / 2 + 40);
          ctx.stroke();
        }
      });
      globos = globos.filter((g) => g.y > -80);

      if (frame < 260 && (confeti.length > 0 || globos.length > 0)) {
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
