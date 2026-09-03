export function limpiarTelefono(t) {
  if (!t) return '';
  let numero = t.replace(/[^\d+]/g, '');

  if (numero.startsWith('+')) {
    return numero.slice(1);
  }
  if (numero.startsWith('0034')) {
    return numero.slice(2);
  }
  if (numero.startsWith('034')) {
    return numero.slice(1);
  }
  if (numero.length === 9) {
    // Número español normal de 9 cifras, sin prefijo puesto: se lo añadimos
    return '34' + numero;
  }
  return numero;
}
