const CACHE_NAME = 'tip-v3-tip7-1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/app.css',
  './css/components.css',
  './css/execution.css',
  './js/app.js',
  './js/router.js',
  './js/core/state.js',
  './js/core/storage.js',
  './js/core/journal.js',
  './js/core/import-v2.js',
  './js/home/home-view.js',
  './js/tip/tip-view.js',
  './js/golfer/journal-view.js',
  './js/golfer/entry-form.js',
  './js/tip7/tip7-data.js',
  './js/tip7/tip7-engine.js',
  './js/tip7/tip7-view.js',
  './pwa-register.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      throw new Error('Offline and asset not cached');
    });
  }));
});
