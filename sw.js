const CACHE='miscolecciones-v5';
const ASSETS=['./index.html','./catalog-tools.js','./catalog-ui.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('miscolecciones-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==self.location.origin||url.search)return;
  if(!ASSETS.some(p=>new URL(p,self.location.href).pathname===url.pathname)&&url.pathname!==new URL('./',self.location.href).pathname)return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
