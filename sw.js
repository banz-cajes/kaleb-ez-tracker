// ===== KALEB SERVICE WORKER - FIXED =====
const CACHE_NAME = 'kaleb-v1';

// Assets to cache (only static files, NOT API calls)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/config.js',
  '/js/analytics.js',
  '/js/notifications.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
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

// Fetch event - STRATEGY: Cache First for static, Network First for Firebase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: NEVER cache Firebase/Firestore requests
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.pathname.includes('/v1/') ||
      url.hostname.includes('googleapis.com')) {
    // Go directly to network for Firebase - DO NOT USE CACHE
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets (CSS, JS, HTML) - use cache first then network
  if (STATIC_ASSETS.some(asset => event.request.url.includes(asset) || 
      event.request.url.endsWith('.css') ||
      event.request.url.endsWith('.js') ||
      event.request.url.endsWith('.html') ||
      event.request.url.includes('/icons/'))) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        return new Response('Offline - Content not available', { status: 404 });
      })
    );
    return;
  }
  
  // For all other requests (images, etc.) - network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});