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

  const { cuentaId, title, body, url } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan título o texto' });
  }

  let suscripciones = [];

  if (cuentaId) {
    const { data } = await supabaseAdmin.rpc('obtener_suscripciones_de_cuenta', { p_cuenta_id: cuentaId });
    suscripciones = data || [];
  } else {
    const { data } = await supabaseAdmin.rpc('obtener_todas_las_suscripciones');
    suscripciones = data || [];
  }

  const payload = JSON.stringify({ title, body, url: url || '/inicio' });

  const resultados = await Promise.allSettled(
    suscripciones.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      ).catch(async (err) => {
        // si la suscripción ya no es válida (410/404), la borramos para no acumular basura
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscripciones').delete().eq('endpoint', s.endpoint);
        }
        throw err;
      })
    )
  );

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
  res.status(200).json({ enviados, total: suscripciones.length });
}
