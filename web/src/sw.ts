/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (e) => {
  if (!e.data) return
  const data = e.data.json() as { titulo: string; corpo: string; url: string }
  e.waitUntil(self.registration.showNotification(data.titulo, {
    body: data.corpo,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data,
    actions: [{ action: 'ciente', title: '✓ Ciente' }, { action: 'abrir', title: 'Ver aviso' }],
  } as NotificationOptions))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data?.url as string) || '/feed'
  if (e.action === 'ciente') {
    e.waitUntil(self.clients.openWindow(url + '?ciente=1'))
  } else {
    e.waitUntil(self.clients.openWindow(url))
  }
})
