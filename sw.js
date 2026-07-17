const CACHE = 'minegocio-v13';
const ASSETS = [
  './',
  './index.html',
  './dist/app.js',
  './manifest.json',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // No interceptar Firebase/Google (necesitan red en vivo)
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) {
    return;
  }
  // Estrategia: cache primero, red como respaldo
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Sin red y sin caché: si es navegación, devolver index
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
