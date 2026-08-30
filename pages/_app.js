import { useEffect } from 'react';
import '../styles/globals.css';
import { activarBloqueoImagenes } from '../lib/bloqueoImagenes';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const limpiar = activarBloqueoImagenes();
    return limpiar;
  }, []);

  return <Component {...pageProps} />;
}
