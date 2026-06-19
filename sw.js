var CACHE = 'poson-v1';
var PRECACHE = [
  '/study-tracker/',
  '/study-tracker/index.html',
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
  var url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});

function cacheFirst(req) {
  return caches.match(req).then(function(r) { return r || fetch(req).then(function(res) { return cachePut(req, res); }); });
}

function networkFirst(req) {
  return fetch(req).then(function(res) { return cachePut(req, res.clone()); }).catch(function() { return caches.match(req); });
}

function cachePut(req, res) {
  if (!res || res.status !== 200) return res;
  var copy = res.clone();
  caches.open(CACHE).then(function(cache) { cache.put(req, copy); });
  return res;
}

// ── Notification click opens app ──
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/study-tracker/'));
});
