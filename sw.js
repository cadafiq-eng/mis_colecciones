/**
 * MisColecciones — Service Worker
 * Cache-first para assets locales, Network-first para APIs externas.
 */

const CACHE_VER  = 'mc-v3';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ─── Install: pre-cache static assets ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

/* ─── Activate: clean old caches ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ─── Fetch strategy ─── */
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignore non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http'))  return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // ── Navigation: serve index.html (SPA fallback) ──
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(cached => cached || fetch(request))
    );
    return;
  }

  // ── Same-origin assets: Cache-first ──
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

  // ── Google Favicons CDN: Cache-first ──
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

  // ── Supabase CDN (supabase-js): Cache-first ──
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

  // ── All other external (APIs, microlink, etc): Network-first ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
