// This scope contains only the academy; other GitHub Pages projects are untouched.
const VERSION = "academy-web-v4";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./academy/static/style.css",
  "./academy/static/layout.js",
  "./academy/static/app.js",
  "./web/bootstrap.js",
  "./web/runtime.js",
  "./web/chess-core.js",
  "./web/engine.js",
  "./web/storage.js",
  "./web/profiles.js",
  "./web/puzzles.js",
  "./web/curriculum.json",
  "./web/eco.json",
  "./web/puzzles/manifest.json",
  "./web/icon.svg",
  "./web/vendor/chess.js",
  "./web/vendor/stockfish-17.1-lite-single-03e3232.js",
  "./web/vendor/stockfish-17.1-lite-single-03e3232.wasm",
  "./academy/static/pieces/wK.svg",
  "./academy/static/pieces/wQ.svg",
  "./academy/static/pieces/wR.svg",
  "./academy/static/pieces/wB.svg",
  "./academy/static/pieces/wN.svg",
  "./academy/static/pieces/wP.svg",
  "./academy/static/pieces/bK.svg",
  "./academy/static/pieces/bQ.svg",
  "./academy/static/pieces/bR.svg",
  "./academy/static/pieces/bB.svg",
  "./academy/static/pieces/bN.svg",
  "./academy/static/pieces/bP.svg",
  "./web/puzzles/offline-1.json",
  "./web/puzzles/offline-2.json",
  "./web/puzzles/offline-3.json",
  "./web/puzzles/offline-4.json",
  "./web/puzzles/offline-5.json",
  "./web/puzzles/offline-6.json",
  "./web/puzzles/offline-7.json",
  "./web/puzzles/offline-8.json",
  "./web/courses/caro.json",
  "./web/courses/french.json",
  "./web/courses/italian.json",
  "./web/courses/kingsindian.json",
  "./web/courses/nimzo.json",
  "./web/courses/queens.json",
  "./web/courses/ruy.json",
  "./web/courses/scotch.json",
  "./web/courses/sicilian.json",
  "./web/courses/slav.json",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache.addAll(
          FILES.map((path) => new Request(path, { cache: "reload" })),
        ),
      )
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
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          const url = new URL(client.url);
          if (url.searchParams.has("upgrade")) {
            url.searchParams.delete("upgrade");
            void client.navigate(url.href).catch(() => {});
          }
        }
      }),
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
