const SESSION_KEY = 'gda_sesion_usuario';
const TEMP_PASSWORD_KEY = 'gda_password_temporal';

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

export function marcarPasswordTemporal(activo) {
  if (typeof window === 'undefined') return;
  if (activo) localStorage.setItem(TEMP_PASSWORD_KEY, '1');
  else localStorage.removeItem(TEMP_PASSWORD_KEY);
}
export function tienePasswordTemporal() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TEMP_PASSWORD_KEY) === '1';
}
