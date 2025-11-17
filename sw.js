const CACHE_NAME = 'luna-cache-v1';
const urlsToCache = [
  'https://santanderelias.github.io/luna/',
  'https://santanderelias.github.io/luna/index.html',
  'https://santanderelias.github.io/luna/app.css',
  'https://santanderelias.github.io/luna/app.js',
  'https://santanderelias.github.io/luna/vendor/bootstrap.min.css',
  'https://santanderelias.github.io/luna/vendor/bootstrap.bundle.min.js',
  'https://santanderelias.github.io/luna/vendor/chart.js',
  'https://santanderelias.github.io/luna/vendor/fonts/inter.woff2',
  'https://santanderelias.github.io/luna/res/stats.png',
  'https://santanderelias.github.io/luna/res/history.png',
  'https://santanderelias.github.io/luna/res/add.png',
  'https://santanderelias.github.io/luna/res/vars.png',
  'https://santanderelias.github.io/luna/res/settings.png',
  'https://santanderelias.github.io/luna/res/icon-192x192.png',
  'https://santanderelias.github.io/luna/res/icon-512x512.png'
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
