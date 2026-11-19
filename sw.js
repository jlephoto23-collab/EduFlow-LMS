/* EduFlow LMS — network-first for JS so deploys show without hard cache clear */
const CACHE = 'eduflow-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/js/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.txt')) {
    e.respondWith(
      fetch(e.request).then((res) => res).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
