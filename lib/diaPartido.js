import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useDiaPartido() {
  const [partidoHoy, setPartidoHoy] = useState(undefined);

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    supabase.from('partidos').select('rival, hora, es_local').eq('fecha', hoy).maybeSingle()
      .then(({ data }) => setPartidoHoy(data || null));
  }, []);

  return partidoHoy;
}
