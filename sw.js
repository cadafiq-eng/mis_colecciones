// MisColecciones PWA - Service Worker v3
// ⚠️ Cambia el número de CACHE cada vez que actualices archivos
const CACHE = 'miscolecciones-v3';
const ASSETS = ['./index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting(); // Activa el nuevo SW de inmediato
});

self.addEventListener('activate', e => {
  // Borra todos los cachés viejos
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Borrando caché viejo:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim(); // Toma control de todas las pestañas abiertas
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('title=') || e.request.url.includes('url=')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
