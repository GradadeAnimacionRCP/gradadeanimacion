import { supabase } from './supabase';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function activarNotificaciones(cuentaId) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador no admite notificaciones.');
  }
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    throw new Error('No has dado permiso para las notificaciones.');
  }
  const registro = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const suscripcion = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });

  const json = suscripcion.toJSON();
  const { error } = await supabase.from('push_subscripciones').upsert({
    cuenta_id: cuentaId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  }, { onConflict: 'endpoint' });

  if (error) {
    throw new Error('No se pudo guardar la suscripción: ' + error.message);
  }

  return true;
}

export async function desactivarNotificaciones() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const registro = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registro) return;
  const sub = await registro.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscripciones').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
}

export async function estaSuscrito() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  const registro = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registro) return false;
  const sub = await registro.pushManager.getSubscription();
  return !!sub;
}
