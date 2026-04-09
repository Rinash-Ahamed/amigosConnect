const CACHE_NAME = 'amigos-connect-v5';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.png'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

// Clean up old caches when the new service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Network-first for page navigations, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
  } else {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
  }
});