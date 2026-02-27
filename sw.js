// Service worker : réseau prioritaire (toujours la dernière version en ligne)
// + fallback cache (dernière version chargée en ligne) hors ligne.

const CACHE_NAME = 'joursderetraite-runtime-v90';
const OFFLINE_FALLBACK_DOCUMENT = 'index.html';

function isSameOriginGetRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

async function putResponseInCache(request, response) {
  if (!isSameOriginGetRequest(request)) return;
  if (!response || !response.ok) return;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());

  // Garder un fallback document mis à jour pour les navigations offline.
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  if (isNavigation) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
      await cache.put(OFFLINE_FALLBACK_DOCUMENT, response.clone());
    }
  }
}

async function getFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  if (cachedResponse) return cachedResponse;

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  if (isNavigation) {
    return cache.match(OFFLINE_FALLBACK_DOCUMENT);
  }

  return null;
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      // Online: toujours réseau d'abord pour obtenir la version la plus récente.
      const networkResponse = await fetch(request);
      await putResponseInCache(request, networkResponse);
      return networkResponse;
    } catch {
      // Offline: fallback sur la dernière version qui a été chargée en ligne.
      const cachedResponse = await getFromCache(request);
      if (cachedResponse) return cachedResponse;

      const isNavigation = request.mode === 'navigate' || request.destination === 'document';
      if (isNavigation) {
        return new Response(
          '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Hors ligne</title></head><body><h1>Hors ligne</h1><p>Reconnectez-vous pour récupérer la dernière version.</p></body></html>',
          {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      }

      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
