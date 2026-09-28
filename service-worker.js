const CACHE = 'five-bomber-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './assets/app-icon.svg', './src/app.js', './src/audio.js', './src/config.js', './src/core.js', './src/questions.js', './src/renderer.js', './src/storage.js', './src/styles.css'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => { if (event.request.method === 'GET') event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))); });
