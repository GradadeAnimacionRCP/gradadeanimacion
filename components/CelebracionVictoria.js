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
    ancho: 60 + Math.random() * 20,
    alto: 74 + Math.random() * 24,
    velY: 1.8 + Math.random() * 1.1,
    oscilarBase: Math.random() * Math.PI * 2,
    oscilarVel: 0.02 + Math.random() * 0.015,
    girado: 0,
    velGiro: (0.35 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1),
  }));
}

function trazarSiluetaGlobo(ctx, cx, cy, ancho, alto) {
  const w = ancho / 2;
  const h = alto / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.bezierCurveTo(cx + w * 1.15, cy - h * 0.75, cx + w * 1.05, cy + h * 0.35, cx + w * 0.22, cy + h * 0.82);
  ctx.lineTo(cx, cy + h * 1.02);
  ctx.lineTo(cx - w * 0.22, cy + h * 0.82);
  ctx.bezierCurveTo(cx - w * 1.05, cy + h * 0.35, cx - w * 1.15, cy - h * 0.75, cx, cy - h);
  ctx.closePath();
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
        const cx = g.x + oscilarX;
        const cy = g.y;
        const anchoVisible = Math.max(0.12, Math.abs(Math.cos((g.girado * Math.PI) / 180))) * g.ancho;

        if (escudoCargado && escudoImg) {
          ctx.save();
          trazarSiluetaGlobo(ctx, cx, cy, anchoVisible, g.alto);
          ctx.clip();

          ctx.fillStyle = '#F7F5F3';
          ctx.fillRect(cx - anchoVisible / 2 - 2, cy - g.alto / 2 - 2, anchoVisible + 4, g.alto + 4);
          ctx.drawImage(escudoImg, cx - anchoVisible / 2, cy - g.alto * 0.42, anchoVisible, g.alto * 0.84);

          const brillo = ctx.createRadialGradient(
            cx - anchoVisible * 0.22, cy - g.alto * 0.3, anchoVisible * 0.05,
            cx - anchoVisible * 0.1, cy - g.alto * 0.1, anchoVisible * 0.75
          );
          brillo.addColorStop(0, 'rgba(255,255,255,0.55)');
          brillo.addColorStop(0.5, 'rgba(255,255,255,0.08)');
          brillo.addColorStop(1, 'rgba(0,0,0,0.12)');
          ctx.fillStyle = brillo;
          ctx.fillRect(cx - anchoVisible / 2 - 2, cy - g.alto / 2 - 2, anchoVisible + 4, g.alto + 4);

          const sombraBorde = ctx.createRadialGradient(cx, cy, anchoVisible * 0.3, cx, cy, anchoVisible * 0.75);
          sombraBorde.addColorStop(0, 'rgba(0,0,0,0)');
          sombraBorde.addColorStop(1, 'rgba(0,0,0,0.25)');
          ctx.fillStyle = sombraBorde;
          ctx.fillRect(cx - anchoVisible / 2 - 2, cy - g.alto / 2 - 2, anchoVisible + 4, g.alto + 4);

          ctx.restore();

          ctx.save();
          trazarSiluetaGlobo(ctx, cx, cy, anchoVisible, g.alto);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          ctx.strokeStyle = 'rgba(244,246,241,0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy + g.alto / 2 + 2);
          ctx.quadraticCurveTo(cx + oscilarX * 0.3, cy + g.alto / 2 + 22, cx + oscilarX * 0.6, cy + g.alto / 2 + 42);
          ctx.stroke();
        }
      });
      globos = globos.filter((g) => g.y > -g.alto - 70);

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
