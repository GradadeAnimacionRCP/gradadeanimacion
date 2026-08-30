export function saludoActual() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Buenos días';
  if (hora >= 13 && hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function primerCarnet(misSocios) {
  if (!misSocios || misSocios.length === 0) return null;
  return [...misSocios].sort((a, b) => new Date(a.fecha_alta) - new Date(b.fecha_alta))[0];
}

const FECHA_FUNDADORES = '2023-06-24T00:00:00';

export function fechaInicioSocio(socio) {
  if (!socio) return null;
  if (socio.tipo === 'Fundador' || socio.tipo === 'Honorífico') return FECHA_FUNDADORES;
  return socio.fecha_alta;
}

export function formatAntiguedad(desdeIso) {
  if (!desdeIso) return '';
  const desde = new Date(desdeIso);
  const ahora = new Date();
  let anios = ahora.getFullYear() - desde.getFullYear();
  let meses = ahora.getMonth() - desde.getMonth();
  let dias = ahora.getDate() - desde.getDate();
  if (dias < 0) {
    meses -= 1;
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
    dias += mesAnterior.getDate();
  }
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  const partes = [];
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
  if (anios === 0 && dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
  if (partes.length === 0) return 'Recién llegado/a';
  return partes.join(' y ');
}
