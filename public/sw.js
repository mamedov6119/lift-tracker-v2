// Minimal service worker — its only job right now is to exist, which is
// what makes Chrome/Android treat the app as installable. No offline
// caching yet; that's a reasonable next step, not needed to deploy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
