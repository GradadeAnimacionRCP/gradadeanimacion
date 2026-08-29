import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { PALETTE, fontStack } from '../styles/tema';
import { NoticiaCard } from '../components/NoticiaCard';
import { Facebook, Instagram, Newspaper } from 'lucide-react';

const FACEBOOK_URL = 'https://www.facebook.com/GradaDeAnimacionRCP/';
const INSTAGRAM_URL = 'https://www.instagram.com/gradadeanimacionrcp?igsi=MXFwazRhaHpsbTlmaw==';

export default function NoticiasPage() {
  const sesion = useSesion();
  const [noticias, setNoticias] = useState(undefined);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('noticias').select('*').order('fecha', { ascending: false });
    setNoticias(data || []);
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  if (sesion === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.chalk, fontFamily: fontStack.label }}>Cargando...</div>;
  }

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '18px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: 2, color: PALETTE.chalk }}>NOTICIAS</h2>
          <p style={{ color: 'rgba(244,246,241,0.6)', fontSize: 13.5, marginTop: 4 }}>Lo último de la Grada de Animación</p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 10px',
            borderRadius: 16, textDecoration: 'none', background: 'linear-gradient(155deg, #1877F2 0%, #0e4fa3 100%)',
          }}>
            <Facebook size={26} color="#fff" />
            <span style={{ color: '#fff', fontFamily: fontStack.label, fontWeight: 700, fontSize: 13.5, textAlign: 'center' }}>Síguenos en Facebook</span>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 10px',
            borderRadius: 16, textDecoration: 'none', background: 'linear-gradient(155deg, #f9ce34 0%, #ee2a7b 55%, #6228d7 100%)',
          }}>
            <Instagram size={26} color="#fff" />
            <span style={{ color: '#fff', fontFamily: fontStack.label, fontWeight: 700, fontSize: 13.5, textAlign: 'center' }}>Síguenos en Instagram</span>
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'rgba(244,246,241,0.55)', fontFamily: fontStack.label, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
          <Newspaper size={15} /> Tablón de la grada
        </div>

        {noticias === undefined ? (
          <div style={{ color: PALETTE.chalk, textAlign: 'center', padding: 20 }}>Cargando...</div>
        ) : noticias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
            <Newspaper size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontSize: 13.5 }}>Todavía no hay publicaciones. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {noticias.map((n) => <NoticiaCard key={n.id} noticia={n} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
