const APP_VERSION = '2026-04-12-5';
const CACHE_NAME = `rollz-shell-${APP_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './og-image.svg',
  './css/styles.css?v=2026-04-12-5',
  './js/constants.js',
  './js/dom.js',
  './js/engine.js',
  './js/history.js',
  './js/i18n.js',
  './js/parser.js',
  './js/random.js',
  './js/render.js',
  './js/state.js',
  './js/ui.js',
  './js/app.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './fonts/cinzel-400.ttf',
  './fonts/cinzel-600.ttf',
  './fonts/cinzel-700.ttf',
  './fonts/inter-300.ttf',
  './fonts/inter-400.ttf',
  './fonts/inter-500.ttf',
  './fonts/inter-600.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === 'https://www.random.org') {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (isAppShellAsset(url)) {
      event.respondWith(networkFirst(request));
      return;
    }

    event.respondWith(cacheFirst(request));
  }
});

function isAppShellAsset(url) {
  return /\.(css|js|html|webmanifest)$/.test(url.pathname);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    return caches.match(request).then(response => response || caches.match('./index.html'));
  }
}
