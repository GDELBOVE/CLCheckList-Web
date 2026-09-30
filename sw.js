// Service worker : met l'application en cache pour qu'elle s'ouvre sans réseau.
// Les appels à Supabase ne sont jamais mis en cache (les données sont gérées par l'application).
const VERSION = 'clchecklist-v2';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache en secours.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(rep => {
        const copie = rep.clone();
        caches.open(VERSION).then(c => c.put(e.request, copie));
        return rep;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
