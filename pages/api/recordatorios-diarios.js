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

async function enviarAUnaCuenta(cuentaId, payload) {
  const { data: suscripciones } = await supabaseAdmin.rpc('obtener_suscripciones_de_cuenta', { p_cuenta_id: cuentaId });
  if (!suscripciones || suscripciones.length === 0) return 0;
  let enviados = 0;
  for (const s of suscripciones) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      enviados++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabaseAdmin.from('push_subscripciones').delete().eq('endpoint', s.endpoint);
      }
    }
  }
  return enviados;
}

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const hoy = new Date().toISOString();
  let avisosCaducados = 0;
  let avisosAsistencia = 0;

  // ---------- 1. Recordatorios de renovación (carnets caducados) ----------
  const { data: caducados, error: errorCaducados } = await supabaseAdmin
    .from('socios')
    .select('id, nombre, apellidos, numero_socio, cuenta_id, fecha_caducidad, activo, estado_solicitud')
    .eq('estado_solicitud', 'aprobado')
    .eq('activo', true)
    .lt('fecha_caducidad', hoy);

  if (errorCaducados) console.error('[recordatorios] Error listando caducados:', errorCaducados);

  for (const socio of caducados || []) {
    if (!socio.cuenta_id) continue;
    const payload = JSON.stringify({
      title: '⚠️ Tu carnet ha caducado',
      body: `El carnet ${String(socio.numero_socio || 0).padStart(4, '0')} necesita renovarse. Hazlo desde "Mis carnets".`,
      url: '/carnets',
    });
    avisosCaducados += await enviarAUnaCuenta(socio.cuenta_id, payload);
  }

  // ---------- 2. Recordatorio de asistencia (2 días antes del próximo partido) ----------
  const dentroDeDosDias = new Date();
  dentroDeDosDias.setHours(0, 0, 0, 0);
  dentroDeDosDias.setDate(dentroDeDosDias.getDate() + 2);
  const fechaObjetivo = dentroDeDosDias.toISOString().slice(0, 10);

  const { data: partido, error: errorPartido } = await supabaseAdmin
    .from('partidos')
    .select('*')
    .eq('fecha', fechaObjetivo)
    .maybeSingle();

  if (errorPartido) console.error('[recordatorios] Error buscando partido a 2 días:', errorPartido);

  if (partido) {
    const { data: asistentes } = await supabaseAdmin.rpc('listar_asistentes', { p_partido_id: partido.id });
    const totalAsistentes = (asistentes || []).length;

    const { data: cuentasConCarnet } = await supabaseAdmin
      .from('socios')
      .select('cuenta_id')
      .eq('estado_solicitud', 'aprobado')
      .eq('activo', true)
      .not('cuenta_id', 'is', null);

    const cuentasUnicas = [...new Set((cuentasConCarnet || []).map((s) => s.cuenta_id))];

    const { data: idsAsistentesSocios } = await supabaseAdmin
      .from('asistencias_partido')
      .select('socio_id')
      .eq('partido_id', partido.id);
    const idsAsistentesSet = new Set((idsAsistentesSocios || []).map((a) => a.socio_id));

    const { data: todosMisSociosPorCuenta } = await supabaseAdmin
      .from('socios')
      .select('id, cuenta_id')
      .eq('estado_solicitud', 'aprobado')
      .eq('activo', true);

    for (const cuentaId of cuentasUnicas) {
      const misSociosDeEstaCuenta = (todosMisSociosPorCuenta || []).filter((s) => s.cuenta_id === cuentaId);
      const yaConfirmoAlguno = misSociosDeEstaCuenta.some((s) => idsAsistentesSet.has(s.id));
      if (yaConfirmoAlguno) continue;

      const rivalTexto = partido.es_local ? `vs ${partido.rival}` : `en ${partido.rival}`;
      const payload = JSON.stringify({
        title: '📣 ¿Vas al próximo partido?',
        body: `${totalAsistentes} ${totalAsistentes === 1 ? 'socio va' : 'socios van'} al partido ${rivalTexto}. Confirma asistencia.`,
        url: '/calendario',
      });
      avisosAsistencia += await enviarAUnaCuenta(cuentaId, payload);
    }
  }

  // ---------- 3. Aviso de "día de partido" ----------
  const hoyFecha = new Date().toISOString().slice(0, 10);
  const { data: partidoHoy, error: errorPartidoHoy } = await supabaseAdmin
    .from('partidos')
    .select('rival, hora, es_local')
    .eq('fecha', hoyFecha)
    .maybeSingle();

  if (errorPartidoHoy) console.error('[recordatorios] Error buscando partido de hoy:', errorPartidoHoy);

  let avisoDiaPartido = 0;
  if (partidoHoy) {
    const { data: todasSuscripciones } = await supabaseAdmin.rpc('obtener_todas_las_suscripciones');
    const rivalTexto = partidoHoy.es_local ? `vs ${partidoHoy.rival}` : `en ${partidoHoy.rival}`;
    const payload = JSON.stringify({
      title: '🏆 ¡Hoy es día de Racing!',
      body: `La app también se viste de gala. Partido ${rivalTexto}${partidoHoy.hora ? ` a las ${partidoHoy.hora.slice(0, 5)}` : ''}.`,
      url: '/calendario',
    });
    for (const s of todasSuscripciones || []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        avisoDiaPartido++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscripciones').delete().eq('endpoint', s.endpoint);
        }
      }
    }
  }

  console.log(`[recordatorios] Renovaciones: ${avisosCaducados} avisos. Asistencia: ${avisosAsistencia} avisos. Día de partido: ${avisoDiaPartido} avisos.`);
  res.status(200).json({ avisosCaducados, avisosAsistencia, avisoDiaPartido, partidoEncontrado: !!partido });
}
