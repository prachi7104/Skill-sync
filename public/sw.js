const CACHE_NAME = 'skillsync-shell-v1';
const SHELL_ASSETS = ['/', '/login', '/offline'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Never intercept API routes — always network, allow graceful failure
  if (url.pathname.startsWith('/api/')) return;
  // Never intercept POST/PUT/PATCH/DELETE
  if (event.request.method !== 'GET') return;
  // Cache-first for static assets (fonts, images, _next/static)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }
  // Network-first for all pages, fall back to cache, then offline page
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('/offline')
        )
      )
  );
});
