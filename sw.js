const C = 'glf-90790cf3';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('glf-') && x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  if (same) {   // fichiers de l'appli : réseau d'abord (mises à jour), cache si hors ligne
    e.respondWith(fetch(e.request).then(n => { const cp = n.clone(); caches.open(C).then(c => c.put(e.request, cp)); return n; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {      // bibliothèque externe : cache d'abord
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const cp = n.clone(); caches.open(C).then(c => c.put(e.request, cp)); return n; })));
  }
});
