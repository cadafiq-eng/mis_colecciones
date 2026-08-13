// MisColecciones - Service Worker v4 (Supabase sync)
const CACHE = 'miscolecciones-v4';
const ASSETS = ['./index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  // No cachear requests de Supabase ni share targets
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('title=') ||
      e.request.url.includes('url=')) return;
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
