const URL_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

const VINO = [59, 11, 16];
const ORO = [201, 162, 75];
const TINTA = [34, 28, 28];
const GRIS = [120, 112, 106];

const ANCHO_PAGINA = 210;
const ALTO_PAGINA = 297;
const MARGEN = 20;
const ANCHO_TEXTO = ANCHO_PAGINA - MARGEN * 2;
const LIMITE_Y = ALTO_PAGINA - 24;

let promesaJsPDF = null;

function cargarJsPDF() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Solo funciona en el navegador.'));
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (promesaJsPDF) return promesaJsPDF;
  promesaJsPDF = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = URL_JSPDF;
    s.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
      else { promesaJsPDF = null; reject(new Error('No se pudo preparar el generador de PDF.')); }
    };
    s.onerror = () => {
      promesaJsPDF = null;
      reject(new Error('No se pudo cargar el generador de PDF. Comprueba tu conexión e inténtalo de nuevo.'));
    };
    document.head.appendChild(s);
  });
  return promesaJsPDF;
}

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

// Las fuentes estándar de PDF no dibujan emojis ni símbolos raros: se dejan solo los caracteres latinos.
function limpiar(t) {
  return String(t || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\n\u0020-\u007E\u00A0-\u00FF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function fechaLarga(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function slug(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'cronica';
}

function esIOS() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

async function prepararFoto(dataUrl) {
  const img = await cargarImagen(dataUrl);
  const m = /^data:image\/(png|jpe?g)/i.exec(dataUrl);
  if (m) {
    return { datos: dataUrl, formato: m[1].toLowerCase() === 'png' ? 'PNG' : 'JPEG', ancho: img.naturalWidth, alto: img.naturalHeight };
  }
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return { datos: canvas.toDataURL('image/jpeg', 0.9), formato: 'JPEG', ancho: canvas.width, alto: canvas.height };
}

function ornamento(doc, y) {
  doc.setDrawColor(...ORO);
  doc.setLineWidth(0.5);
  doc.line(78, y, 100, y);
  doc.line(110, y, 132, y);
  doc.setFillColor(...ORO);
  doc.circle(105, y, 1.2, 'F');
}

function cabeceraPortada(doc, escudo) {
  doc.setFillColor(...VINO);
  doc.rect(0, 0, ANCHO_PAGINA, 40, 'F');
  doc.setFillColor(...ORO);
  doc.rect(0, 40, ANCHO_PAGINA, 1.4, 'F');

  let xTexto = MARGEN;
  if (escudo && escudo.naturalWidth) {
    const h = 26;
    const w = h * (escudo.naturalWidth / escudo.naturalHeight);
    doc.addImage(escudo, 'PNG', MARGEN, 7, w, h);
    xTexto = MARGEN + w + 8;
  }
  doc.setTextColor(...ORO);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('GRADA DE ANIMACIÓN', xTexto, 19);
  doc.setTextColor(245, 241, 235);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('RACING CLUB PORTUENSE', xTexto, 26.5);
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text('Crónicas de la grada', xTexto, 32.5);
}

function cabeceraInterior(doc, titulo) {
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text('Grada de Animación · Racing Club Portuense', MARGEN, 14);
  const corto = doc.splitTextToSize(titulo, 85)[0] || '';
  doc.text(corto, ANCHO_PAGINA - MARGEN, 14, { align: 'right' });
  doc.setDrawColor(...ORO);
  doc.setLineWidth(0.4);
  doc.line(MARGEN, 17, ANCHO_PAGINA - MARGEN, 17);
}

export async function descargarCronicaPDF(noticia) {
  const jsPDF = await cargarJsPDF();

  const titulo = limpiar(noticia.titulo) || 'Crónica';
  const texto = limpiar(noticia.texto);
  const fecha = limpiar(fechaLarga(noticia.fecha));

  let escudo = null;
  try { escudo = await cargarImagen('/escudo.png'); } catch {}
  let foto = null;
  if (noticia.imagen) {
    try { foto = await prepararFoto(noticia.imagen); } catch {}
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title: titulo, subject: 'Crónica de la Grada de Animación', author: 'Grada de Animación RCP' });

  cabeceraPortada(doc, escudo);
  let y = 62;

  const estiloCuerpo = () => {
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...TINTA);
  };
  const nuevaPagina = () => {
    doc.addPage();
    cabeceraInterior(doc, titulo);
    y = 30;
    estiloCuerpo();
  };

  // Título
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...VINO);
  doc.splitTextToSize(titulo, ANCHO_TEXTO).forEach((linea) => {
    doc.text(linea, ANCHO_PAGINA / 2, y, { align: 'center' });
    y += 10.5;
  });
  y += 1;

  if (fecha) {
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...GRIS);
    doc.text(`Publicada el ${fecha}`, ANCHO_PAGINA / 2, y, { align: 'center' });
    y += 8;
  }
  ornamento(doc, y);
  y += 10;

  // Foto
  if (foto) {
    const ratio = foto.alto / foto.ancho;
    let w = ANCHO_TEXTO;
    let h = w * ratio;
    const maxH = 110;
    if (h > maxH) { h = maxH; w = h / ratio; }
    if (y + h + 6 > LIMITE_Y) nuevaPagina();
    const x = (ANCHO_PAGINA - w) / 2;
    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.8);
    doc.rect(x - 1.2, y - 1.2, w + 2.4, h + 2.4);
    doc.addImage(foto.datos, foto.formato, x, y, w, h);
    y += h + 12;
  }

  // Texto
  estiloCuerpo();
  for (const parrafo of texto.split('\n')) {
    if (!parrafo.trim()) { y += 3.5; continue; }
    const lineas = doc.splitTextToSize(parrafo, ANCHO_TEXTO);
    lineas.forEach((linea, i) => {
      if (y > LIMITE_Y) nuevaPagina();
      const ultima = i === lineas.length - 1;
      if (!ultima && linea.includes(' ')) doc.text(linea, MARGEN, y, { align: 'justify', maxWidth: ANCHO_TEXTO });
      else doc.text(linea, MARGEN, y);
      y += 6.4;
    });
    y += 3.2;
  }

  if (y + 14 > LIMITE_Y) nuevaPagina();
  ornamento(doc, y + 4);

  // Pie con numeración
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.3);
    doc.line(MARGEN, 283, ANCHO_PAGINA - MARGEN, 283);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GRIS);
    doc.text('Grada de Animación · Racing Club Portuense', MARGEN, 289);
    doc.text(`${i} / ${total}`, ANCHO_PAGINA - MARGEN, 289, { align: 'right' });
  }

  const nombre = `cronica-${slug(titulo)}.pdf`;

  // En iPhone/iPad "descargar" no funciona bien en una app instalada: se abre el menú de compartir ("Guardar en Archivos").
  if (esIOS() && navigator.canShare) {
    try {
      const archivo = new File([doc.output('blob')], nombre, { type: 'application/pdf' });
      if (navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: titulo });
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  doc.save(nombre);
}
