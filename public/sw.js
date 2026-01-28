/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Baatein - New Message'
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: data.url || '/',
      room: data.room,
      username: data.username,
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
    tag: data.tag || 'baatein-notification',
    renotify: true,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open a new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event)
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.registration.scope + '/api/push/vapid-public-key',
    }).then((subscription) => {
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })
    })
  )
})
