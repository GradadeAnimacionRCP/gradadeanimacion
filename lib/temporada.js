import { supabase } from './supabase';

// año en que caduca la temporada "en curso" a día de hoy
export function anioTemporadaActual() {
  const hoy = new Date();
  const agosto1 = new Date(hoy.getFullYear(), 7, 1);
  return hoy < agosto1 ? hoy.getFullYear() : hoy.getFullYear() + 1;
}

export function temporadaKeyDeFecha(fechaCaducidadIso) {
  if (!fechaCaducidadIso) return anioTemporadaActual();
  return new Date(fechaCaducidadIso).getFullYear();
}

export async function getFondoTemporada(anio) {
  const { data } = await supabase.from('fondos_temporada').select('imagen').eq('anio', anio).maybeSingle();
  return data ? data.imagen : null;
}

export async function setFondoTemporada(anio, imagen) {
  await supabase.from('fondos_temporada').upsert({ anio, imagen });
}

export async function eliminarFondoTemporada(anio) {
  await supabase.from('fondos_temporada').delete().eq('anio', anio);
}

export function prepararImagenFondo(file) {
  const MAX_LADO = 1400;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no admitido.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
