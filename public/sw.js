const CACHE_NAME = 'prompt-gallery-v5';

// Base path for GitHub Pages deployment
const BASE_PATH = '/prompt-gallery-saas';

// Resources to precache on install
const PRECACHE_URLS = [
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
];

// Install event: precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  const pathname = url.pathname;

  // ---- Cache First for static assets (_next/static/*) ----
  if (pathname.includes('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ---- Cache First for icons and images in public/images/ ----
  if (pathname.startsWith(`${BASE_PATH}/images/`) || pathname.startsWith(`${BASE_PATH}/icons/`)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ---- Cache First for manifest and static config files ----
  if (pathname === `${BASE_PATH}/manifest.json`) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ---- Network First for everything else (API, pages, etc.) ----
  event.respondWith(networkFirst(request));
});

/**
 * Cache First strategy:
 *   Serve from cache if available, otherwise fetch from network and cache.
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First strategy:
 *   Try network first, fall back to cache if offline.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}
