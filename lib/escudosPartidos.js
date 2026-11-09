const CLAVE = 'gda_escudos_rivales_v1';
const CADUCA_MS = 7 * 24 * 60 * 60 * 1000;
let memoria = null;

function leer() {
  if (memoria) return memoria;
  memoria = {};
  try {
    const crudo = typeof window !== 'undefined' ? window.localStorage.getItem(CLAVE) : null;
    if (crudo) memoria = JSON.parse(crudo) || {};
  } catch {}
  return memoria;
}

function guardar() {
  try { window.localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch {}
}

export function escudosVigentes() {
  const m = leer();
  const ahora = Date.now();
  const salida = {};
  for (const id of Object.keys(m)) {
    if (ahora - m[id].t < CADUCA_MS) salida[id] = m[id].v;
  }
  return salida;
}

export function guardarEscudos(lista) {
  const m = leer();
  const t = Date.now();
  for (const item of lista) m[item.id] = { t, v: item.escudo_rival || null };
  guardar();
}
