/**
 * MisColecciones — Service Worker v8
 * ESTRATEGIA SIMPLIFICADA Y CONFIABLE:
 *  - index.html: NUNCA en caché → siempre se trae fresco de la red
 *  - Iconos/manifest: caché normal (cambian poco)
 *  - Supabase JS / jsDelivr: caché (archivos externos fijos)
 *  - Favicons externos: caché
 *  - Sin auto-reload forzado (evita deslogueo involuntario)
 */

const CACHE_VER = 'mc-v8';

/* Solo cacheamos assets que NO son el HTML principal */
const STATIC_ASSETS = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ─── Install: pre-cache assets estáticos, activa inmediatamente ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ─── Activate: limpia cachés viejos ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
    // Sin SW_UPDATED forzado: evita reload que desloguea al usuario
  );
});

/* ─── Fetch strategy ─── */
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // ── Navegación (index.html): SIEMPRE red, sin guardar en caché ──
  // Esto garantiza que la app siempre cargue la versión más reciente.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .catch(() => {
          // Sin internet: servir desde caché si existe
          return caches.match('./index.html')
            .then(cached => cached || new Response(
              '<h2 style="font-family:sans-serif;padding:2rem">Sin conexión — abre la app cuando tengas internet</h2>',
              { headers: { 'Content-Type': 'text/html' } }
            ));
        })
    );
    return;
  }

  // ── Assets propios (iconos, manifest): Cache-first ──
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            caches.open(CACHE_VER).then(c => c.put(request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Google Favicons CDN: Cache-first ──
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/s2/favicons')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) caches.open(CACHE_VER).then(c => c.put(request, res.clone()));
          return res;
        }).catch(() => new Response('', { status: 204 }));
      })
    );
    return;
  }

  // ── Supabase JS / jsDelivr (librerías fijas): Cache-first ──
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_VER).then(c => c.put(request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // ── Todo lo demás (APIs, microlink, etc.): Network-first ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
