const CACHE_NAME = 'luna-cache-v1.03';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/ui.js',
    './js/storage.js',
    './js/charts.js',
    './js/calculator.js',
    './manifest.json',
    './favicon.ico',
    './vendor/css/bootstrap.min.css',
    './vendor/css/bootstrap-icons.css',
    './vendor/js/bootstrap.bundle.min.js',
    './vendor/js/chart.js',
    './vendor/fonts/bootstrap-icons.woff2',
    './vendor/fonts/bootstrap-icons.woff',
    './res/icon-192x192.png',
    './res/icon-512x512.png'
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
        caches.match(event.request, { ignoreSearch: true })
            .then((response) => response || fetch(event.request))
    );
});
