// Service worker: la guía funciona sin conexión.
// - Páginas: network-first (siempre la última versión si hay red), con copia en caché de respaldo.
// - Assets (/_astro, estilos, íconos, fuentes, pagefind): cache-first.
// Firebase/Google no pasan por acá (son de otro origen y se manejan solos).

const VERSION = 'p3r-v2';
const PAGES = ['/', '/walkthrough/', '/social-links/', '/trofeos/', '/cien-por-ciento/', '/tartarus/', '/fusion/', '/primera-partida/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PAGES).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/')).then((r) => r || caches.match('/walkthrough/')))
    );
    return;
  }

  const save = (res) => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  };
  // archivos con hash en el nombre: nunca cambian → cache-first
  if (url.pathname.startsWith('/_astro/') || isFont) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)));
    return;
  }
  // el resto (estilos, íconos, índice del buscador): stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then(save).catch(() => hit);
      return hit || net;
    })
  );
});
