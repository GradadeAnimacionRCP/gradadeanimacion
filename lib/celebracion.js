const CLAVE = 'grada_ultima_victoria_vista';

export function yaVistaCelebracion(partidoId) {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(CLAVE) === partidoId;
}

export function marcarCelebracionVista(partidoId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLAVE, partidoId);
}
