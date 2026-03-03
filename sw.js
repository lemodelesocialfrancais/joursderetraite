// Service worker : réseau prioritaire (toujours la dernière version en ligne)
// + fallback cache (dernière version chargée en ligne) hors ligne.

const CACHE_NAME = 'joursderetraite-runtime-v96';
const OFFLINE_FALLBACK_DOCUMENT = 'index.html';
const SAME_ORIGIN_PREFIX = `${self.location.origin}/`;
const OFFLINE_HTML =
  '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Hors ligne</title></head><body><h1>Hors ligne</h1><p>Reconnectez-vous pour récupérer la dernière version.</p></body></html>';
const OFFLINE_HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };

function isSameOriginGetRequest(request) {
  return request.method === 'GET' && request.url.startsWith(SAME_ORIGIN_PREFIX);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function shouldRefreshOfflineFallback(request) {
  if (!isNavigationRequest(request)) return false;
  const pathname = new URL(request.url).pathname;
  return pathname.endsWith('/') || pathname.endsWith('/index.html');
}

async function putResponseInCache(request, response) {
  if (!isSameOriginGetRequest(request)) return;
  if (!response || !response.ok) return;

  const cache = await caches.open(CACHE_NAME);
  const writes = [cache.put(request, response.clone())];

  // Garder un fallback document mis à jour pour les navigations offline.
  if (shouldRefreshOfflineFallback(request)) {
    writes.push(cache.put(OFFLINE_FALLBACK_DOCUMENT, response.clone()));
  }

  await Promise.all(writes);
}

async function getFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  if (cachedResponse) return cachedResponse;

  if (isNavigationRequest(request)) {
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
    const staleCaches = cacheNames.filter(cacheName => cacheName !== CACHE_NAME);
    await Promise.all(staleCaches.map(cacheName => caches.delete(cacheName)));
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

      if (isNavigationRequest(request)) {
        return new Response(
          OFFLINE_HTML,
          {
            status: 503,
            statusText: 'Offline',
            headers: OFFLINE_HTML_HEADERS
          }
        );
      }

      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
