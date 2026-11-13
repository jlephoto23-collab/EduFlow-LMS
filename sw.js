/* EduFlow LMS — basic offline cache for pitch / PWA install */
const CACHE = 'eduflow-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './icons/icon.svg',
  './js/app.js',
  './js/store.js',
  './js/firebase.js',
  './js/firebase-config.js',
  './js/c0.js',
  './js/c1.js',
  './js/c2.js',
  './js/c3.js',
  './js/c4.js',
  './js/c5.js',
  './js/c6.js',
  './js/c7.js',
  './js/c8.js',
  './js/c9.js',
  './js/c10.js',
  './js/c11.js',
  './js/c12.js',
  './js/c13.js',
  './js/c14.js',
  './js/c15.js',
  './js/c16.js',
  './js/c17.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && (req.url.startsWith(self.location.origin))) {
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
