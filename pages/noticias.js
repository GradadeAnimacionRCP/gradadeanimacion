import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSesion, Layout } from '../components/Layout';
import { LoadingCrest } from '../components/LoadingCrest';
import { Button } from '../components/UI';
import { PALETTE, fontStack } from '../styles/tema';
import { NoticiaCard } from '../components/NoticiaCard';
import { ProductoCard } from '../components/ProductoCard';
import { descargarCronicaPDF } from '../lib/pdfNoticia';
import { Facebook, Instagram, Newspaper, ShoppingBag, Download } from 'lucide-react';

const FACEBOOK_URL = 'https://www.facebook.com/GradaDeAnimacionRCP/';
const INSTAGRAM_URL = 'https://www.instagram.com/gradadeanimacionrcp?igsi=MXFwazRhaHpsbTlmaw==';

function tabPillStyle(active) {
  return {
    flex: 1, padding: '10px 0', borderRadius: 10,
    border: `1px solid ${active ? PALETTE.stripe : 'rgba(244,246,241,0.2)'}`,
    background: active ? 'rgba(200,30,44,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? PALETTE.chalk : 'rgba(244,246,241,0.65)',
    fontFamily: fontStack.label, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };
}

export default function NoticiasPage() {
  const sesion = useSesion();
  const [vista, setVista] = useState('noticias');
  const [noticias, setNoticias] = useState(undefined);
  const [productos, setProductos] = useState(undefined);
  const [puedePDF, setPuedePDF] = useState(false);
  const [generando, setGenerando] = useState(null);
  const [errorPDF, setErrorPDF] = useState('');

  const cargarNoticias = useCallback(async () => {
    const { data } = await supabase.from('noticias').select('*').order('fecha', { ascending: false });
    setNoticias(data || []);
  }, []);

  const cargarProductos = useCallback(async () => {
    const { data } = await supabase.from('productos').select('*').order('fecha', { ascending: false });
    setProductos(data || []);
  }, []);

  useEffect(() => {
    cargarNoticias();
    cargarProductos();
    const interval = setInterval(() => { cargarNoticias(); cargarProductos(); }, 60000);
    return () => clearInterval(interval);
  }, [cargarNoticias, cargarProductos]);

  useEffect(() => {
    if (!sesion) return;
    if (sesion.is_admin) { setPuedePDF(true); return; }
    supabase.rpc('cuenta_tiene_cargo', { p_cuenta_id: sesion.id, p_cargo: 'faraon' })
      .then(({ data }) => setPuedePDF(data === true));
  }, [sesion?.id, sesion?.is_admin]);

  const handlePDF = async (n) => {
    setErrorPDF('');
    setGenerando(n.id);
    try {
      await descargarCronicaPDF(n);
    } catch (err) {
      setErrorPDF(err.message || 'No se pudo crear el PDF.');
    }
    setGenerando(null);
  };

  if (sesion === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingCrest texto="Cargando..." />
      </div>
    );
  }

  return (
    <Layout sesion={sesion}>
      <div style={{ padding: '18px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: fontStack.display, fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: 2, color: PALETTE.chalk }}>
            {vista === 'noticias' ? 'NOTICIAS' : 'TIENDA'}
          </h2>
          <p style={{ color: 'rgba(244,246,241,0.6)', fontSize: 13.5, marginTop: 4 }}>
            {vista === 'noticias' ? 'Lo último de la Grada de Animación' : 'Productos oficiales de la grada'}
          </p>
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setVista('noticias')} style={tabPillStyle(vista === 'noticias')}>
            <Newspaper size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Noticias
          </button>
          <button onClick={() => setVista('tienda')} style={tabPillStyle(vista === 'tienda')}>
            <ShoppingBag size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Tienda
          </button>
        </div>

        {vista === 'noticias' && (
          noticias === undefined ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingCrest texto="Cargando noticias..." />
            </div>
          ) : noticias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
              <Newspaper size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 13.5 }}>Todavía no hay publicaciones. ¡Vuelve pronto!</p>
            </div>
          ) : (
            <>
              {errorPDF && <div style={{ color: '#ff8a8a', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{errorPDF}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {noticias.map((n) => (
                  <div key={n.id}>
                    <NoticiaCard noticia={n} />
                    {puedePDF && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                        <Button variant="ghost" disabled={generando === n.id} onClick={() => handlePDF(n)} style={{ fontSize: 12.5, padding: '6px 12px' }}>
                          <Download size={14} /> {generando === n.id ? 'Creando PDF...' : 'Descargar en PDF'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {vista === 'tienda' && (
          productos === undefined ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingCrest texto="Cargando productos..." />
            </div>
          ) : productos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(244,246,241,0.55)' }}>
              <ShoppingBag size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 13.5 }}>Todavía no hay productos a la venta.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {productos.map((p) => <ProductoCard key={p.id} producto={p} />)}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
