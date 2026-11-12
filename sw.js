const C = 'glf-332e2104';
const SHELL = ['./', './index.html', './manifest.json', './pdf-lib.min.js', './icon-180.png', './icon-192.png', './icon-512.png',
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
  } else if (new URL(e.request.url).hostname === 'cdnjs.cloudflare.com') {      // bibliothèque externe : cache d'abord
    /* tout le reste (ton serveur de candidatures …workers.dev, etc.) n'est JAMAIS touché ni mis en cache : il va directement au réseau */
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const cp = n.clone(); caches.open(C).then(c => c.put(e.request, cp)); return n; })));
  }
});
/* Notifications (réception connectée des candidatures) : message générique envoyé par le serveur personnel du propriétaire */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Gestion Locative Facile', {body: d.body || 'Nouveau candidat ou nouveau dossier pour ta location.', icon: './icon-192.png', badge: './icon-192.png', tag: 'glf-cand', renotify: true, data: {url: './index.html?cand=1'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './index.html?cand=1';
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(L => {
    for (const c of L) { if ('focus' in c) { c.postMessage({glf: 'cand'}); return c.focus(); } }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
