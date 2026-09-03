import { useState } from 'react';
import { getTelefonoSoporte } from '../lib/config';
import { limpiarTelefono } from '../lib/telefono';
import { PALETTE, fontStack } from '../styles/tema';
import { Button } from './UI';
import { LifeBuoy } from 'lucide-react';

export function BotonSoporte({ sesion, mensaje }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setCargando(true);
    const telefono = await getTelefonoSoporte();
    setCargando(false);
    if (!telefono) {
      setError('El servicio de soporte todavía no está configurado.');
      return;
    }
    const nombre = sesion?.usuario || '';
    const texto = mensaje || `Hola, soy ${nombre} y necesito ayuda con la app de la Grada de Animación:`;
    window.open(`https://wa.me/${limpiarTelefono(telefono)}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div>
      <Button variant="ghost" onClick={handleClick} disabled={cargando} style={{ width: '100%' }}>
        <LifeBuoy size={16} /> {cargando ? 'Abriendo...' : 'Contactar soporte'}
      </Button>
      {error && <div style={{ color: '#ff8a8a', fontSize: 12.5, marginTop: 8, textAlign: 'center', fontFamily: fontStack.label }}>{error}</div>}
    </div>
  );
}
