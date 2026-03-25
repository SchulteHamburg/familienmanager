// Service Worker für Progressive Web App
const CACHE_NAME = 'familien-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Installation des Service Workers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache-Fehler während Installation:', err);
      })
  );
  self.skipWaiting();
});

// Aktivierung des Service Workers
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alte Caches werden gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch-Events handeln - Network First, dann Cache Fallback
self.addEventListener('fetch', event => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Response cachen
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Offline: Aus Cache laden
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Fallback für nicht gecachte Seiten
            return caches.match('./index.html');
          });
      })
  );
});

// Hintergrund-Sync für Offline-Datenverwaltung (Optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Hier könnten gepufferte Daten synchronisiert werden
      Promise.resolve()
    );
  }
});
