/**
 * MisColecciones — Service Worker v5
 * Cache-first para assets locales, Network-first para APIs externas.
 * Auto-update: cuando hay una nueva versión, avisa a la app para recargar.
 */

const CACHE_VER = 'mc-v5';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ─── Install: pre-cache y activa inmediatamente ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())   // toma control sin esperar
  );
});

/* ─── Activate: limpia cachés viejos y notifica a la app ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())   // controla pestañas ya abiertas
      .then(() => {
        // Notifica a todos los clientes que hay nueva versión → recarga automática
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

/* ─── Fetch strategy ─── */
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // ── Navegación SPA: siempre intenta red primero, caché como fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Guarda la versión fresca en caché
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VER).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ── Assets propios: Cache-first ──
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VER).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Google Favicons: Cache-first ──
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/s2/favicons')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VER).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 204 }));
      })
    );
    return;
  }

  // ── Supabase JS / jsDelivr: Cache-first ──
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('supabase')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VER).then(c => c.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // ── APIs externas (microlink, etc.): Network-first ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
