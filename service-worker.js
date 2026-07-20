/* =========================================================
   service-worker.js — cache offline (PWA)
   PREPARADO mas inativo: ative com PWA_ENABLED=true no app.js
   (só funciona hospedado em http/https, não em file://).
   ========================================================= */
const CACHE = "dramabook-v1";
const CORE = [
  "index.html", "styles.css", "app.js",
  "js/config.js", "js/store.js", "js/filters.js", "js/views.js",
  "components/card.js", "components/rail.js", "components/hero.js", "components/modal.js",
  "database/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // App shell + dados: cache-first. Imagens externas (TMDb): rede, sem cachear.
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => hit))
    );
  }
});
