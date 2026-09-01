export const CARGOS = {
  presidente: { emoji: '👑', etiqueta: 'Presidente/a de la Grada de Animación' },
  secretario: { emoji: '📋', etiqueta: 'Secretario/a de la Grada de Animación' },
  tesorero: { emoji: '💰', etiqueta: 'Tesorero/a de la Grada de Animación' },
  vocal: { emoji: '🗣️', etiqueta: 'Vocal de la Grada de Animación' },
  bombo: { emoji: '🥁', etiqueta: 'Percusionista de la Grada de Animación' },
  chupete: { emoji: '🍼', etiqueta: 'Integrante de Frente Chupete' },
  faraon: { emoji: '𓂀', etiqueta: 'Integrante de la Peña El Faraón' },
};

export function infoCargo(clave) {
  return CARGOS[clave] || null;
}
