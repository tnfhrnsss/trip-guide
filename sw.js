const CACHE = 'trip-guide-v5';

const APP_SHELL = [
  './',
  './index.html',
  './store.html',
  './spots.html',
  './map.html',
  './restroom.html',
  './css/style.css',
  './js/i18n.js',
  './js/geo.js',
  './js/app.js',
  './js/store.js',
  './js/spots.js',
  './js/map.js',
  './js/restroom.js',
  './js/weather.js',
  './i18n/ko.json',
  './i18n/en.json',
  './i18n/ja.json',
  './data/nations.json',
  './data/us/regions.json',
  './data/us/stores.json',
  './data/us/spots.json',
  './data/kr/regions.json',
  './data/kr/stores.json',
  './data/kr/spots.json',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Weather API: network-first, cache fallback
  if (url.hostname === 'api.open-meteo.com') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
