// Service worker pour l'application PWA

const CACHE_NAME = 'joursderetraite-v86';
const urlsToCache = [
  './',
  'index.html',
  'legal.html',
  'style.css',
  'js/main.js',
  'js/modules/calculator.js',
  'js/modules/examples.js',
  'js/modules/formatting.js',
  'js/modules/pwa.js',
  'js/modules/sharing.js',
  'js/modules/state.js',
  'js/modules/theme.js',
  'js/modules/ui.js',

  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  'icon-maskable-192x192.png',
  'icon-maskable-512x512.png',
  'apple-splash.png',
  'bateaucroisiere.webp',
  'favicon.ico'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installé et tous les fichiers sont mis en cache');
        return self.skipWaiting(); // Force l'activation immédiate
      })
      .catch(error => {
        console.error('Erreur lors de l\'installation du service worker:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression du cache ancien:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        console.log('Service Worker activé');
        return self.clients.claim(); // Prend le contrôle immédiatement
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok && request.url.startsWith(self.location.origin)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Network-first with cache fallback pour tous les assets
  // Priorité au réseau pour avoir la dernière version, fallback sur le cache si hors ligne
  event.respondWith(
    fetch(request)
      .then(response => {
        // Si la réponse est valide, on la met en cache pour le hors-ligne
        if (response && response.ok && request.url.startsWith(self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, on essaie de servir depuis le cache
        return caches.match(request);
      })
  );
});
