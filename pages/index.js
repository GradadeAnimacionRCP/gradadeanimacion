import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [estado, setEstado] = useState('Comprobando conexión con la base de datos...');

  useEffect(() => {
    supabase
      .from('partidos')
      .select('*')
      .then(({ error }) => {
        if (error) setEstado('❌ Error de conexión: ' + error.message);
        else setEstado('✅ ¡Conectado correctamente a Supabase!');
      });
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Grada de Animación RCP</h1>
      <p>{estado}</p>
    </div>
  );
}
