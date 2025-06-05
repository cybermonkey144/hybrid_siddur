const CACHE_NAME = 'hybrid-siddur-cache-v1.1'; // Increment version for updates
const FILES_TO_PRECACHE = [
    '/',
    'index.html',
    'style.css',
    'manifest.json',
    'js/main.js',
    'js/uiManager.js',
    'js/dataLoader.js',
    'js/prayerEngine.js',
    'js/stateManager.js',
    'js/config.js',
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-512x512.png',
    'assets/icons/icon-72x72.png',
    // Consider pre-caching a few essential prayer templates/nusachim if small enough
    // e.g. 'data/templates/shacharit_template.json', 'data/nusachim/ashkenaz.json'
];

self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Pre-caching offline page');
                return cache.addAll(FILES_TO_PRECACHE);
            })
            .then(() => self.skipWaiting()) // Activate new SW immediately
    );
});

self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of open clients
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Strategy:
    // - For /data/ (JSON prayer files): Network first, then cache.
    //   This allows updates to prayer texts to be fetched when online.
    // - For all other assets (app shell): Cache first, then network.
    //   This ensures the app loads fast and works offline.

    if (requestUrl.pathname.startsWith('/data/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed, try to serve from cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            return cachedResponse || new Response(null, { status: 404, statusText: "Offline and not in cache" });
                        });
                })
        );
    } else { // Static assets (app shell)
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Return cached response if found, otherwise fetch from network
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then(networkResponse => {
                        // Optionally cache newly fetched static assets not in FILES_TO_PRECACHE
                        // Be cautious with this for assets that might change frequently and are not part of the core app shell
                        if (networkResponse && networkResponse.status === 200 && !FILES_TO_PRECACHE.includes(requestUrl.pathname)) {
                            // Example: Caching images on the fly
                            // if (/\.(png|jpg|jpeg|svg|gif)$/.test(requestUrl.pathname)) {
                            //   const responseToCache = networkResponse.clone();
                            //   caches.open(CACHE_NAME).then(cache => {
                            //     cache.put(event.request, responseToCache);
                            //   });
                            // }
                        }
                        return networkResponse;
                    }).catch(error => {
                        console.error('[ServiceWorker] Fetch failed for static asset:', event.request.url, error);
                        // You could return a generic offline page here for navigation requests if appropriate
                        // For other assets, it might just fail if not in cache.
                        // For this setup, if a pre-cached file isn't found & network fails, it will error.
                    });
                })
        );
    }
});