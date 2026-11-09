import { supabase } from './supabase';
import { getEscudoRacing } from './config';
import { escudosVigentes, guardarEscudos } from './escudosPartidos';

const CLAVE_RACING = 'gda_escudo_racing_v1';
const CLAVE_NOTICIA = 'gda_ultima_noticia_v1';
const TTL_RACING = 7 * 24 * 60 * 60 * 1000;
const TTL_NOTICIA = 12 * 60 * 60 * 1000;

function leerLS(clave) {
  try {
    const crudo = window.localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch { return null; }
}

function escribirLS(clave, valor) {
  try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
}

// Escudo del Racing: se baja una vez por móvil y se recuerda 7 días.
export async function escudoRacingCacheado() {
  const guardado = leerLS(CLAVE_RACING);
  if (guardado && guardado.v && Date.now() - guardado.t < TTL_RACING) return guardado.v;
  const valor = await getEscudoRacing();
  if (valor) escribirLS(CLAVE_RACING, { t: Date.now(), v: valor });
  return valor;
}

// Escudo de un rival: usa la misma caché que Calendario.
export async function escudoRivalCacheado(partidoId) {
  const guardados = escudosVigentes();
  if (partidoId in guardados) return guardados[partidoId];
  const { data, error } = await supabase.from('partidos').select('id, escudo_rival').eq('id', partidoId);
  if (error || !data) return null;
  guardarEscudos(data);
  return data[0] ? data[0].escudo_rival || null : null;
}

// Última noticia: pregunta solo título/fecha (texto ligero) y baja la foto
// únicamente si la noticia es nueva o no está recordada en el móvil.
export async function ultimaNoticiaCacheada() {
  const { data, error } = await supabase.from('noticias')
    .select('id, titulo, fecha').order('fecha', { ascending: false }).limit(1);
  if (error) return null;
  const n = data && data[0];
  if (!n) return null;
  const guardada = leerLS(CLAVE_NOTICIA);
  if (guardada && guardada.id === n.id && Date.now() - guardada.t < TTL_NOTICIA) {
    return { ...n, imagen: guardada.imagen || null };
  }
  const { data: foto } = await supabase.from('noticias').select('imagen').eq('id', n.id);
  const imagen = foto && foto[0] ? foto[0].imagen || null : null;
  escribirLS(CLAVE_NOTICIA, { id: n.id, t: Date.now(), imagen });
  return { ...n, imagen };
}
