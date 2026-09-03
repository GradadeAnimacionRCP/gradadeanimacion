import { useState } from 'react';
import { PALETTE } from '../styles/tema';
import { Button } from './UI';
import { formatNumeroSocio } from '../lib/socios';
import { anioTemporadaActual } from '../lib/temporada';
import { Share2 } from 'lucide-react';

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generarImagen({ foto, nombre, numeroSocio, antiguedad }) {
  const ANCHO = 1080;
  const ALTO = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');

  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 60px Oswald'),
        document.fonts.load('700 40px "Barlow Condensed"'),
      ]),
      new Promise((r) => setTimeout(r, 800)),
    ]);
  } catch {}

  const grad = ctx.createRadialGradient(ANCHO / 2, ALTO * 0.25, 100, ANCHO / 2, ALTO * 0.25, 1300);
  grad.addColorStop(0, '#3B0B10');
  grad.addColorStop(1, '#0A0A0A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  try {
    const escudo = await cargarImagen('/escudo.png');
    ctx.save();
    ctx.globalAlpha = 0.08;
    const s = 800;
    ctx.drawImage(escudo, ANCHO / 2 - s / 2, ALTO / 2 - s / 2, s, s);
    ctx.restore();
  } catch {}

  const centroX = ANCHO / 2;
  const fotoY = 420;
  const radio = 220;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centroX, fotoY, radio + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#C9A24B';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centroX, fotoY, radio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  try {
    const imgFoto = foto ? await cargarImagen(foto) : await cargarImagen('/escudo.png');
    const escala = Math.max((radio * 2) / imgFoto.width, (radio * 2) / imgFoto.height);
    const w = imgFoto.width * escala;
    const h = imgFoto.height * escala;
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(centroX - radio, fotoY - radio, radio * 2, radio * 2);
    ctx.drawImage(imgFoto, centroX - w / 2, fotoY - h / 2, w, h);
  } catch {}
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C9A24B';
  ctx.font = '700 34px "Barlow Condensed", sans-serif';
  ctx.fillText('SOCIO DE LA GRADA DE ANIMACIÓN', centroX, fotoY + radio + 90);

  ctx.fillStyle = '#F7F5F3';
  ctx.font = '700 84px Oswald, sans-serif';
  const nombreMayus = nombre.toUpperCase();
  ctx.fillText(nombreMayus, centroX, fotoY + radio + 190);

  const badgeAncho = 260;
  const badgeAlto = 70;
  const badgeY = fotoY + radio + 240;
  ctx.fillStyle = '#C9A24B';
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };
  rr(centroX - badgeAncho / 2, badgeY, badgeAncho, badgeAlto, 14);
  ctx.fillStyle = '#0A0A0A';
  ctx.font = '700 40px Oswald, sans-serif';
  ctx.fillText(`Nº ${numeroSocio}`, centroX, badgeY + 48);

  if (antiguedad) {
    ctx.fillStyle = 'rgba(244,246,241,0.55)';
    ctx.font = '600 30px "Barlow Condensed", sans-serif';
    ctx.fillText('LLEVA CON LA GRADA', centroX, badgeY + 150);
    ctx.fillStyle = '#F7F5F3';
    ctx.font = '700 46px Oswald, sans-serif';
    ctx.fillText(antiguedad, centroX, badgeY + 205);
  }

  ctx.strokeStyle = 'rgba(201,162,75,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centroX - 140, ALTO - 200);
  ctx.lineTo(centroX + 140, ALTO - 200);
  ctx.stroke();

  ctx.fillStyle = '#C9A24B';
  ctx.font = '700 32px "Barlow Condensed", sans-serif';
  ctx.fillText('RACING CLUB PORTUENSE', centroX, ALTO - 140);

  const anio = anioTemporadaActual();
  ctx.fillStyle = 'rgba(244,246,241,0.4)';
  ctx.font = '600 26px "Barlow Condensed", sans-serif';
  ctx.fillText(`GRADA DE ANIMACIÓN · TEMPORADA ${anio - 1}/${anio}`, centroX, ALTO - 90);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95));
}

export function CompartirCarnet({ foto, nombre, numeroSocio, antiguedad }) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  const handleCompartir = async () => {
    setError('');
    setGenerando(true);
    try {
      const blob = await generarImagen({ foto, nombre, numeroSocio: formatNumeroSocio(numeroSocio), antiguedad });
      const file = new File([blob], 'mi-carnet-grada.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi carnet de la Grada de Animación',
          text: '¡Soy socio de la Grada de Animación del Racing Club Portuense! 🔴',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mi-carnet-grada.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('No se pudo generar la imagen. Inténtalo de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" onClick={handleCompartir} disabled={generando} style={{ width: '100%' }}>
        <Share2 size={16} /> {generando ? 'Generando...' : 'Compartir mi carnet'}
      </Button>
      {error && <div style={{ color: '#ff8a8a', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </div>
  );
}
