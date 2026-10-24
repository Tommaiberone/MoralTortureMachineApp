// Web Push service worker (TASK-275). It exists only to receive pushes and
// handle a click on them: no fetch handler and no caching on purpose, so it
// can never serve a stale app shell or interfere with the API calls.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const data = payload.data || {};

  // A push must always show a notification (userVisibleOnly), even if the
  // payload could not be read.
  event.waitUntil(self.registration.showNotification(payload.title || 'Moral Torture Machine', {
    body: payload.body || '',
    icon: '/favicon-192x192.png',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Same-origin only, whatever the payload says.
  let target = new URL('/', self.location.origin);
  try {
    const requested = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin);
    if (requested.origin === self.location.origin) target = requested;
  } catch {
    // Keep the home page.
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (open) {
      await open.focus();
      if ('navigate' in open) await open.navigate(target.href);
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
