// ============================================
// C4 SYSTEMS - Service Worker
// ============================================

const CACHE_NAME = 'c4-systems-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/css/style.css',
  '/css/components.css',
  '/css/dark-theme.css',
  '/js/utils.js',
  '/js/firebase-init.js',
  '/js/auth.js',
  '/js/settings.js',
  '/js/analytics.js',
  '/js/compliance.js',
  '/js/app.js',
  '/js/ui.js',
  '/js/chat.js',
  '/manifest.json',
  '/logo.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.warn('Cache install error:', err))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip Firebase API calls and external CDNs
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic') ||
      event.request.url.includes('cdnjs') ||
      event.request.url.includes('jsdelivr')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Cache miss - fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => console.warn('Cache put error:', err));
            
            return response;
          })
          .catch(() => {
            // Offline fallback
            return caches.match('/index.html');
          });
      })
  );
});