const URL_FUENTE = 'https://www.lapreferente.com/E161/racing-club-portuense';

let ultimaLectura = null;

function limpiar(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodificar(buffer) {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('\uFFFD')) return utf8;
  return new TextDecoder('iso-8859-1').decode(buffer);
}

function extraerEquipos(html) {
  const filas = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const candidatos = [];
  for (const fila of filas) {
    const celdas = (fila.match(/<td[\s\S]*?<\/td>/gi) || []).map(limpiar);
    if (celdas.length < 9) continue;
    if (!/^\d{1,2}$/.test(celdas[0])) continue;
    const idxNombre = celdas.findIndex((c, i) => i > 0 && c && /[A-Za-zÀ-ÿ]/.test(c));
    if (idxNombre === -1) continue;
    const numeros = celdas
      .slice(idxNombre + 1)
      .filter((c) => /^[+-]?\d+$/.test(c))
      .map((c) => parseInt(c, 10));
    if (numeros.length < 8) continue;
    const [pt, pj, pg, pe, pp, gf, gc, dg] = numeros;
    candidatos.push({ pos: parseInt(celdas[0], 10), nombre: celdas[idxNombre], pt, pj, pg, pe, pp, gf, gc, dg });
  }
  const tabla = [];
  for (const c of candidatos) {
    if (c.pos === tabla.length + 1) tabla.push(c);
    else if (tabla.length >= 8) break;
  }
  return tabla;
}

export default async function handler(req, res) {
  try {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), 8000);
    const respuesta = await fetch(URL_FUENTE, {
      signal: control.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GradaAnimacionRCP/1.0)',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    clearTimeout(temporizador);
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);

    const html = decodificar(await respuesta.arrayBuffer());
    const equipos = extraerEquipos(html);

    if (req.query.debug) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        filasEnLaPagina: (html.match(/<tr/gi) || []).length,
        equiposLeidos: equipos.length,
        muestra: equipos.slice(0, 3),
      });
    }

    if (equipos.length < 8) throw new Error('Tabla no reconocida');

    const datos = {
      competicion: 'Tercera Federación · Grupo 10',
      actualizado: new Date().toISOString(),
      fuente: URL_FUENTE,
      equipos,
    };
    ultimaLectura = datos;
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(datos);
  } catch (err) {
    if (ultimaLectura) {
      res.setHeader('Cache-Control', 'public, s-maxage=300');
      return res.status(200).json({ ...ultimaLectura, obsoleto: true });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'No se ha podido leer la clasificación ahora mismo.', fuente: URL_FUENTE });
  }
}
