const CACHE = 'amigos-brand-experience-v11';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './menu-data.js',
  './menu-product-details.js',
  './icon.svg',
  './manifest.webmanifest',
  './assets/menu/fallback.webp',
  './assets/menu/premium/chicken-biryani.webp',
  './assets/logos/amigos.webp',
  './assets/logos/spicy-darbar.webp',
  './assets/logos/red-panda.webp',
  './assets/logos/grill-cafe.webp',
  './assets/logos/andhra-bhavan.webp'
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
