import { supabase } from './supabase';

let cacheEscudoRacing;

export async function getEscudoRacing() {
  if (cacheEscudoRacing !== undefined) return cacheEscudoRacing;
  const { data } = await supabase.from('config_app').select('valor').eq('clave', 'escudo_racing').maybeSingle();
  cacheEscudoRacing = data ? data.valor : null;
  return cacheEscudoRacing;
}

export async function setEscudoRacing(imagen) {
  await supabase.from('config_app').upsert({ clave: 'escudo_racing', valor: imagen });
  cacheEscudoRacing = imagen;
}

export function prepararEscudo(file) {
  const MAX_LADO = 300;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = document.createElement('img');
      img.style.position = 'fixed';
      img.style.top = '-9999px';
      img.style.opacity = '0';
      const limpiar = () => { if (img.parentNode) img.parentNode.removeChild(img); };
      img.onerror = () => { limpiar(); reject(new Error('Formato de imagen no admitido.')); };
      img.onload = () => {
        try {
          const ancho = img.naturalWidth || img.width;
          const alto = img.naturalHeight || img.height;
          const escala = Math.min(1, MAX_LADO / Math.max(ancho, alto));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(ancho * escala);
          canvas.height = Math.round(alto * escala);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          limpiar();
          resolve(dataUrl);
        } catch (err) {
          limpiar();
          reject(new Error('No se pudo procesar la imagen.'));
        }
      };
      document.body.appendChild(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
