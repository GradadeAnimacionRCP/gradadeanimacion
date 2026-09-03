const CLAVE = 'grada_modo_ultra';

export function modoUltraActivo() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CLAVE) === '1';
}

export function activarModoUltra() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLAVE, '1');
}

export function desactivarModoUltra() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLAVE);
}
