// ===== KALEB SERVICE WORKER - CLEAN WORKING VERSION =====
const CACHE_NAME = 'kaleb-v7';
const OFFLINE_URL = '/offline.html';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/offline.html',
  '/css/styles.css',
  '/images/kaleb-agila-logo-v2.png',
  '/js/app.js',
  '/js/config.js',
  '/js/analytics.js',
  '/js/notifications.js',
  '/js/auth.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // Cache each asset individually to prevent one failure from breaking all
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
            console.log('Cached:', asset);
          } catch (err) {
            console.log('Failed to cache:', asset, err);
          }
        }
      })
      .catch(err => console.log('Cache open error:', err))
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ready to control clients');
      return self.clients.claim();
    })
  );
});

// Helper: Check if request should be skipped (not cached)
function shouldSkipFetch(url) {
  // Skip chrome extensions and other browser extensions
  if (url.startsWith('chrome-extension:') ||
      url.startsWith('chrome-devtools:') ||
      url.startsWith('edge:') ||
      url.startsWith('moz-extension:') ||
      url.startsWith('about:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')) {
    return true;
  }
  
  // Skip Firebase/Firestore (always fresh)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com') ||
      url.includes('firebaseapp.com')) {
    return true;
  }
  
  return false;
}

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;
  
  // Skip unsupported requests
  if (shouldSkipFetch(url)) {
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(async () => {
          // Return offline page when offline
          const cachedResponse = await caches.match(OFFLINE_URL);
          return cachedResponse || new Response('You are offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }
  
  // For static assets (CSS, JS, etc.) - cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Fallback for images
        if (request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return new Response('Resource not available offline', { status: 404 });
      })
  );
});
