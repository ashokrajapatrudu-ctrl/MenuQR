const CACHE = 'amigos-brand-experience-v7';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './menu-data.js',
  './icon.svg',
  './manifest.webmanifest',
  './assets/menu/fallback.webp',
  './assets/logos/amigos.png',
  './assets/logos/spicy-darbar.png',
  './assets/logos/red-panda.png',
  './assets/logos/grill-cafe.png',
  './assets/logos/andhra-bhavan.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
