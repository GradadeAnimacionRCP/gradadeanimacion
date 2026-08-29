self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Grada de Animación RCP';
  const options = {
    body: data.body || '',
    icon: '/escudo-icono.png',
    badge: '/escudo-icono.png',
    data: { url: data.url || '/inicio' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/inicio';
  event.waitUntil(clients.openWindow(url));
});
