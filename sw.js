/* Crescendo — offline support. Network first so updates show straight away; the cache is the fallback.
   Only touches its own caches and its own folder, so other apps on the same site are unaffected. */
const CACHE = 'crescendo-v7';
const SHELL = [
  './', './index.html', './app.css', './music.js', './audio.js', './listen.js', './input.js', './core.js', './notation.js', './keyboard.js', './player.js',
  './drills.js', './lessons.js', './lessons2.js', './songs.js', './library.js', './tdrills.js', './theory1.js', './theory2.js', './planner.js', './learn.js',
  './session.js', './practice.js', './songsview.js', './progress.js', './away.js', './settings.js', './mascot.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/crescendo-notation.woff2', './fonts/figtree-latin.woff2', './fonts/fredoka-latin.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('crescendo-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function network(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    // Always ask the server (a quick "not modified" when nothing changed), so an update is never held back by the browser's cache.
    fetch(req, { cache: 'no-cache' }).then(res => { clearTimeout(timer); resolve(res); }, err => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(
    network(req, 4000)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : null))
        .then(hit => hit || fetch(req))),
  );
});
