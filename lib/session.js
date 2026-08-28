const SESSION_KEY = 'gda_sesion_usuario';

export function guardarSesion(id) {
  if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, id);
}
export function borrarSesion() {
  if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
}
export function getSesionGuardada() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}
