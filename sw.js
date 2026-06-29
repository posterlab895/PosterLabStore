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
  './products-bundle.js',
  './script.js',
  './admin.js',
  './admin/index.html',
  './assets/poster-lab-logo.webp',
  './assets/instapay-qr.jpeg',
  './assets/size-guide.webp',
  './assets/custom-upload.jpg',
  './assets/atelier-splash.webp',
  './assets/classic-redline.webp',
  './assets/color-riot.webp',
  './assets/gallery-wave.webp',
  './assets/midnight-turbo.webp',
  './assets/neon-drift.webp',
  './assets/Orange F1.webp',
  './assets/Porsche GT3 RS.webp',
  './assets/Red Ferrari.webp',
  './assets/Dark Blue RedBull.webp',
  './assets/Space Astronauts.webp',
  './assets/Minecraft Avengers.webp',
  './assets/Monaliza.webp',
  './assets/Spiderman.webp',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_01.webp',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_02.webp',
  './assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_03.webp',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (1).webp',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (2).webp',
  './assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (3).webp',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_01.webp',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_02.webp',
  './assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_03.webp',
  './assets/Yellow Cadillac Landscape.webp',
  './assets/our-work/our-work-01.jpg',
  './assets/our-work/our-work-02.webp',
  './assets/our-work/our-work-03.webp',
  './assets/our-work/our-work-04.webp',
  './assets/our-work/our-work-05.webp',
  './assets/our-work/our-work-06.webp',
  './assets/our-work/our-work-07.webp',
  './assets/our-work/our-work-08.webp',
  './assets/our-work/our-work-09.webp',
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