const CACHE = "umgm-v2";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./images/1000014080.png",
  "./images/1000014081.jpg",
  "./images/signature-transparent.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  // HTML — сүлжээг эхэлж үзнэ: шинэчлэлт шууд хүрнэ, офлайнд кэшнээс өгнө.
  // (Өмнө нь кэшийг эхэлж үздэг байсан тул шинэчлэлт хэрэглэгчид хүрдэггүй байв.)
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Бусад файл — кэшнээс шуурхай өгөөд, ард нь шинэчилж тавина
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
