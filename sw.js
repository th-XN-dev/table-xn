// ============================================================
//  table.xn — Service Worker (v2)
//  Statik fayllar uchun NETWORK-FIRST: online'da doim yangi kod,
//  offline'da keshdan. Bu "eski kod keshdan yuklanishi" muammosini yo'qotadi.
// ============================================================
const CACHE = 'tablexn-1.0.2';

const ASSETS = [
  './', './index.html', './login.html', './dashboard.html', './reports.html',
  './settings.html', './offline.html', './manifest.json', './config.js', './css/theme.css',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cachePut(req, res) {
  if (res && res.ok && res.type === 'basic') caches.open(CACHE).then((c) => c.put(req, res));
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Tashqi (Supabase, esm.sh, fonts) — SW aralashmaydi
  if (url.origin !== self.location.origin) return;

  // Hamma same-origin so'rov: NETWORK-FIRST, offline'da keshdan, oxirida offline sahifa
  e.respondWith(
    fetch(request)
      .then((r) => { cachePut(request, r.clone()); return r; })
      .catch(() => caches.match(request).then((c) => c || (request.mode === 'navigate' ? caches.match('./offline.html') : Response.error())))
  );
});
