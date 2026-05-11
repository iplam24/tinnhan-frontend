// Service Worker for V-Edu Messenger
// Handles background notifications via Web Push API

self.addEventListener('push', (event: any) => {
  const data = event.data ? event.data.json() : { title: 'Tin nhắn mới', body: 'Bạn có tin nhắn mới từ V-Edu' };
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    (self as any).registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.openWindow(event.notification.data.url)
  );
});
