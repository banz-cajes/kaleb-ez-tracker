// sw.js - Updated with offline page support
const CACHE_NAME = 'kaleb-tracker-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/offline.html',     // ADD THIS - create an offline page
    '/css/styles.css',
    '/js/config.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/analytics.js',
    '/js/notifications.js',
    '/manifest.json'
];

// Install event - cache files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app files');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Cache error:', err))
    );
    self.skipWaiting();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If fetch succeeds, cache the response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // If fetch fails (offline), serve from cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If not in cache, show offline page
                        return caches.match('/offline.html');
                    });
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});