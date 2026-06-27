const CACHE_NAME = 'poster-lab-store-v15';
const IMAGE_CACHE_NAME = 'poster-lab-images-v1';
const ASSETS = [
  './',
  './index.html',
  './product.html',
  './our-work.html',
  './faq.html',
  './styles.css',
  './admin.css',
  './football-products.js',
  './cars-products.js',
  './clubs-products.js',
  './script.js',
  './admin.js',
  './assets/poster-lab-logo.png',
  './assets/instapay-qr.jpeg',
  './assets/size-guide.png',
  './assets/custom-upload.jpg',
  './assets/atelier-splash.png',
  './assets/classic-redline.png',
  './assets/color-riot.png',
  './assets/gallery-wave.png',
  './assets/midnight-turbo.png',
  './assets/neon-drift.png',
  './assets/Orange F1.png',
  './assets/Porsche GT3 RS.png',
  './assets/Red Ferrari.png',
  './assets/Dark Blue RedBull.png',
  './assets/Space Astronauts.png',
  './assets/Minecraft Avengers.png',
  './assets/Monaliza.png',
  './assets/Spiderman.png',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_01.png',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_02.png',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_03.png',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (1).png',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (2).png',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (3).png',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_01.png',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_02.png',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_03.png',
  './assets/Yellow Cadillac Landscape.png',
  './assets/our-work/our-work-01.jpg',
  './assets/our-work/our-work-02.png',
  './assets/our-work/our-work-03.png',
  './assets/our-work/our-work-04.png',
  './assets/our-work/our-work-05.png',
  './assets/our-work/our-work-06.png',
  './assets/our-work/our-work-07.png',
  './assets/our-work/our-work-08.png',
  './assets/our-work/our-work-09.png',
  './assets/our-work/our-work-10.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map((url) =>
        cache.add(url).catch(() => {})
      ));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, IMAGE_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()).catch(() => {})
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let requestUrl;
  try { requestUrl = new URL(event.request.url); } catch { return; }
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;

  const isLocalImage = requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/assets/');

  if (isLocalImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          });
        });
      }).catch(() => fetch(event.request))
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cachedResponse = await caches.match(event.request).catch(() => null);
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              }).catch(() => {});
            }
          }).catch(() => {});
          return cachedResponse;
        }
        const networkResponse = await fetch(event.request).catch(() => new Response('', { status: 503 }));
        if (networkResponse && networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch(() => {});
        }
        return networkResponse;
      } catch {
        return new Response('', { status: 503 });
      }
    })().catch(() => new Response('', { status: 503 }))
  );
});