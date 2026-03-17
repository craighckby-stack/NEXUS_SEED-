// Service Worker for PWA support

const CACHE_NAME = 'dalek-evolution-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/placeholder.css',
  './assets/js/placeholder.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      // Optimization: Force the service worker to activate immediately 
      // without waiting for existing clients to close.
      .then(() => self.skipWaiting()) 
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
    // Optimization: Ensure the service worker controls clients immediately 
    // after activation (especially important after skipWaiting).
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Optimization: We only manage caching for safe GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Standard Cache-First, then Network strategy (highly concise implementation)
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});