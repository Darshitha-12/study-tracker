var CACHE = 'poson-v2';
var PRECACHE = [
  '/study-tracker/',
  '/study-tracker/index.html',
  '/study-tracker/public-view',
  '/study-tracker/public-view.html',
  '/study-tracker/manifest.json',
  '/study-tracker/icon.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(self.skipWaiting())
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(self.clients.claim())
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = req.url;

  // HTML navigation — network first, cache fallback
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req));
    return;
  }

  // CDN scripts/fonts — network first, cache fallback
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('cdnjs')) {
    e.respondWith(networkFirst(req));
    return;
  }

  // Everything else — cache first
  e.respondWith(cacheFirst(req));
});

function cacheFirst(req) {
  return caches.match(req).then(function(r) { return r || fetchAndCache(req); });
}

function networkFirst(req) {
  return fetchAndCache(req).catch(function() { return caches.match(req).then(function(r) { return r || caches.match('/study-tracker/'); }); });
}

function fetchAndCache(req) {
  return fetch(req).then(function(res) {
    if (!res || res.status !== 200) return res;
    var copy = res.clone();
    caches.open(CACHE).then(function(cache) { cache.put(req, copy); });
    return res;
  });
}

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/study-tracker/'));
});
