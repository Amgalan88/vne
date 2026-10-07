// Хуучин апп өмнө нь энэ домэйны үндэс дээр service worker суулгадаг байсан.
// Тэр нь кэшээс хуучин хариу өгч шинэ апп-д саад болох тул өөрийгөө устгана.
// Хуучин апп одоо /umgm/ дээр, өөрийн тусдаа service worker-тэй.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: "window" });
      windows.forEach(w => w.navigate(w.url));
    })(),
  );
});
