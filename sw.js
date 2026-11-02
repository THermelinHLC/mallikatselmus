/* Mallikatselmus – offline-välimuisti. Päivitä VERSION, kun julkaiset uuden version. */
const VERSION = "mk-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./pdf.min.mjs", "./pdf.worker.min.mjs",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // ulkoiset kirjastot (PDF-muodostus): verkko ensin, sitten välimuisti
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req)));
    return;
  }
  // oma sovellus: verkko ensin (uusin versio), offline -> välimuisti
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, {ignoreSearch: true}).then(m => m || caches.match("./index.html"))));
});
