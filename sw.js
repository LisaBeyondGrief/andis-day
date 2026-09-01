/* sw.js — caches the app so it opens with no signal: on the bus, in a
   corridor, in a school with no wifi. That matters more here than it would in
   most apps, because the moment she needs the Calm tab is exactly the moment
   she will not be able to wait for a page to load. */

var CACHE = 'andis-day-v7';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/data.js',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/routines.js',
  './assets/js/calm.js',
  './assets/js/settings.js',
  './assets/js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network first so a new version is picked up, cache as the safety net. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
