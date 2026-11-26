self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message = { title: 'ضيافة القهوة الملكية', body: 'لديك تحديث جديد على بطاقة الولاء.', url: '/' };
  try { if (event.data) message = { ...message, ...event.data.json() }; } catch (_) {}
  const url = typeof message.url === 'string' && message.url.startsWith('/') && !message.url.startsWith('//') ? message.url : '/';
  event.waitUntil(self.registration.showNotification(String(message.title).slice(0, 100), {
    body: String(message.body).slice(0, 300), icon: '/loyalty-card/assets/icon-192.png', badge: '/loyalty-card/assets/icon-192.png', tag: message.tag || undefined,
    data: { url:'/loyalty-card/index.html' }, dir: 'rtl', lang: 'ar'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const path = event.notification.data?.url || '/';
  event.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
    const existing = clients.find(c => c.url.startsWith(self.registration.scope));
    if (existing) { existing.navigate(path); return existing.focus(); }
    return self.clients.openWindow(path);
  }));
});
