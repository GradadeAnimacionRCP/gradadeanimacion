import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { cuentaId, title, body, url, soloAdmins } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan título o texto' });
  }

  let suscripciones = [];

  if (soloAdmins) {
    const { data, error } = await supabaseAdmin.rpc('obtener_suscripciones_admins');
    if (error) console.error('Error obteniendo suscripciones de admins:', error);
    suscripciones = data || [];
  } else if (cuentaId) {
    const { data, error } = await supabaseAdmin.rpc('obtener_suscripciones_de_cuenta', { p_cuenta_id: cuentaId });
    if (error) console.error('Error obteniendo suscripciones de cuenta:', error);
    suscripciones = data || [];
  } else {
    const { data, error } = await supabaseAdmin.rpc('obtener_todas_las_suscripciones');
    if (error) console.error('Error obteniendo todas las suscripciones:', error);
    suscripciones = data || [];
  }

  console.log(`[send-push] Encontradas ${suscripciones.length} suscripciones. soloAdmins=${!!soloAdmins} cuentaId=${cuentaId || 'todas'}`);

  const payload = JSON.stringify({ title, body, url: url || '/inicio' });

  const resultados = await Promise.allSettled(
    suscripciones.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      ).catch(async (err) => {
        console.error(`[send-push] Fallo al enviar a ${s.endpoint.slice(0, 60)}...`, err.statusCode, err.body || err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscripciones').delete().eq('endpoint', s.endpoint);
        }
        throw err;
      })
    )
  );

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
  console.log(`[send-push] Enviados ${enviados} de ${suscripciones.length}`);
  res.status(200).json({ enviados, total: suscripciones.length });
}
