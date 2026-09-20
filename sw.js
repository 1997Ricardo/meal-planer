var CACHE_NAME = "meal-planner-v1";
var urlsToCache = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./api.js",
  "./state.js",
  "./utils.js",
  "./config.js"
];

// Instalación del Service Worker
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("Caché abierta correctamente");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log("Borrando caché antigua:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptación de peticiones para soporte offline
self.addEventListener("fetch", function(event) {
  // Evitamos cachear las peticiones a Google Apps Script para que los datos sean siempre frescos
  if (event.request.url.includes("script.google.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});