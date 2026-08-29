const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

export function estadoMember(socio) {
  if (socio.activo === false) return 'suspendido';
  if (socio.fecha_caducidad && new Date(socio.fecha_caducidad).getTime() < Date.now()) return 'caducado';
  return 'activo';
}

export function solicitudEstado(socio) {
  return socio.estado_solicitud || 'aprobado';
}

export function formatNumeroSocio(numero) {
  return `GDA-${String(numero || 0).padStart(4, '0')}`;
}

export function temporadaLabel(fechaCaducidadIso) {
  if (!fechaCaducidadIso) return '';
  const y = new Date(fechaCaducidadIso).getFullYear();
  return `${y - 1}/${y}`;
}

export const ESTADO_COLOR = { activo: '#4ADE80', caducado: '#FFB020', suspendido: '#ff6b6b' };
export const ESTADO_LABEL = { activo: 'Activo', caducado: 'Caducado', suspendido: 'Suspendido' };
