const CACHE_NAME = 'luna-cache-v1';
const urlsToCache = [
  '/luna/',
  '/luna/index.html',
  '/luna/app.css',
  '/luna/app.js',
  '/luna/vendor/bootstrap.min.css',
  '/luna/vendor/bootstrap.bundle.min.js',
  '/luna/vendor/chart.js',
  '/luna/vendor/fonts/inter.woff2',
  '/luna/res/stats.png',
  '/luna/res/history.png',
  '/luna/res/add.png',
  '/luna/res/vars.png',
  '/luna/res/settings.png',
  '/luna/icon-192x192.png',
  '/luna/icon-512x512.png',
  '/luna/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
