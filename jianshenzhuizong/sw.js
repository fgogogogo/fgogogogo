// ===== Service Worker =====
const CACHE_NAME = 'fittrack-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// CDN resources to cache
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache local assets
        const localPromise = cache.addAll(STATIC_ASSETS).catch(() => {});
        // Cache CDN assets (don't fail on network errors)
        const cdnPromise = Promise.allSettled(
          CDN_ASSETS.map(url => cache.add(url).catch(() => {}))
        );
        return Promise.all([localPromise, cdnPromise]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that aren't our CDN assets
  const url = new URL(event.request.url);
  const isCdnAsset = CDN_ASSETS.some(a => a.startsWith(url.origin + url.pathname));

  if (url.origin !== location.origin && !isCdnAsset) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
