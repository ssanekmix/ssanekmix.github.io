// This scope contains only the academy; other GitHub Pages projects are untouched.
const VERSION = "academy-web-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./academy/static/style.css",
  "./academy/static/app.js",
  "./web/bootstrap.js",
  "./web/runtime.js",
  "./web/chess-core.js",
  "./web/engine.js",
  "./web/storage.js",
  "./web/curriculum.json",
  "./web/eco.json",
  "./web/icon.svg",
  "./web/vendor/chess.js",
  "./web/vendor/stockfish-17.1-lite-single-03e3232.js",
  "./web/vendor/stockfish-17.1-lite-single-03e3232.wasm",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("academy-web-") && k !== VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== location.origin ||
    !url.pathname.startsWith(new URL(self.registration.scope).pathname) ||
    event.request.method !== "GET"
  )
    return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }),
  );
});
