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
      const img = document.createElement('img');
      img.style.position = 'fixed';
      img.style.top = '-9999px';
      img.style.left = '-9999px';
      img.style.opacity = '0';
      img.style.pointerEvents = 'none';

      const limpiar = () => {
        if (img.parentNode) img.parentNode.removeChild(img);
      };

      img.onerror = () => {
        limpiar();
        reject(new Error('Este formato de imagen no se puede abrir. Prueba con un JPG o PNG.'));
      };
      img.onload = () => {
        try {
          const ancho = img.naturalWidth || img.width;
          const alto = img.naturalHeight || img.height;
          if (!ancho || !alto) throw new Error('Imagen vacía');
          const escala = Math.min(1, MAX_LADO / Math.max(ancho, alto));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(ancho * escala);
          canvas.height = Math.round(alto * escala);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          limpiar();
          resolve(dataUrl);
        } catch (err) {
          limpiar();
          reject(new Error('No se pudo procesar la imagen. Prueba con otra foto (JPG o PNG).'));
        }
      };
      document.body.appendChild(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
