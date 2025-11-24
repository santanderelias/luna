const CACHE_NAME = 'luna-v2-cache-v2';
const ASSETS_TO_CACHE = [
    'https://santanderelias.github.io/luna/',
    'https://santanderelias.github.io/luna/index.html',
    'https://santanderelias.github.io/luna/css/style.css',
    'https://santanderelias.github.io/luna/js/app.js',
    'https://santanderelias.github.io/luna/js/ui.js',
    'https://santanderelias.github.io/luna/js/storage.js',
    'https://santanderelias.github.io/luna/js/charts.js',
    'https://santanderelias.github.io/luna/js/calculator.js',
    'https://santanderelias.github.io/luna/manifest.json',
    'https://santanderelias.github.io/luna/vendor/css/bootstrap.min.css',
    'https://santanderelias.github.io/luna/vendor/css/bootstrap-icons.css',
    'https://santanderelias.github.io/luna/vendor/js/bootstrap.bundle.min.js',
    'https://santanderelias.github.io/luna/vendor/js/chart.js',
    'https://santanderelias.github.io/luna/vendor/fonts/bootstrap-icons.woff2',
    'https://santanderelias.github.io/luna/vendor/fonts/bootstrap-icons.woff'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force waiting service worker to become active
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all clients immediately
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
