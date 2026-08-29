import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:contacto@gradadeanimacionrcp.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Solo Vercel (con su clave secreta automática) puede disparar esto
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const hoy = new Date().toISOString();

  const { data: caducados, error } = await supabaseAdmin
    .from('socios')
    .select('id, nombre, apellidos, numero_socio, cuenta_id, fecha_caducidad, activo, estado_solicitud')
    .eq('estado_solicitud', 'aprobado')
    .eq('activo', true)
    .lt('fecha_caducidad', hoy);

  if (error) {
    console.error('[recordatorios] Error listando caducados:', error);
    return res.status(500).json({ error: error.message });
  }

  let avisados = 0;

  for (const socio of caducados || []) {
    if (!socio.cuenta_id) continue;

    const { data: suscripciones } = await supabaseAdmin.rpc('obtener_suscripciones_de_cuenta', { p_cuenta_id: socio.cuenta_id });
    if (!suscripciones || suscripciones.length === 0) continue;

    const payload = JSON.stringify({
      title: '⚠️ Tu carnet ha caducado',
      body: `El carnet ${String(socio.numero_socio || 0).padStart(4, '0')} necesita renovarse. Hazlo desde "Mis carnets".`,
      url: '/carnets',
    });

    for (const s of suscripciones) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        avisados++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscripciones').delete().eq('endpoint', s.endpoint);
        }
      }
    }
  }

  console.log(`[recordatorios] Avisados ${avisados} de ${(caducados || []).length} carnets caducados`);
  res.status(200).json({ carnetsRevisados: (caducados || []).length, avisosEnviados: avisados });
}
