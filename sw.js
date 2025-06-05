const CACHE_NAME = 'hybrid-siddur-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Add paths to your core templates and Nusachim that you want to pre-cache
    // For a larger number of files, you might fetch these dynamically or have a build step generate this list.
    '/data/templates/shacharit_template.json',
    // '/data/templates/mincha_template.json',
    // '/data/templates/maariv_template.json',
    '/data/nusachim/ashkenaz.json',
    '/data/nusachim/sefard.json',
    // Add paths to icons if not pre-cached by manifest
    '/assets/icons/icon-192x192.png',
    // '/assets/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});
// ... inside sw.js ...
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    // console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
                    return response;
                }

                // Not in cache - try to fetch from network
                // console.log(`[Service Worker] Not in cache, fetching: ${event.request.url}`);
                return fetch(event.request).then(
                    networkResponse => {
                        // Optional: Cache dynamically fetched resources if needed
                        // For this app, primary assets are pre-cached, so this part is less critical
                        // but can be useful for assets not in urlsToCache initially.
                        // console.log(`[Service Worker] Fetched from network: ${event.request.url}`);
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    }
                ).catch(error => {
                    // THIS IS LIKELY THE KEY AREA FOR OFFLINE PAGE LOADING
                    console.error(`[Service Worker] Fetch failed for: ${event.request.url}`, error);
                    // **If this was a navigation request (for an HTML page),
                    // **you need to return a fallback HTML response here.**
                    // **Currently, it just logs and doesn't return a Response,
                    // **so the browser shows its default offline page.

                    // For navigation requests, try to return the cached root page.
                    
                    if (event.request.mode === 'navigate') {
                        console.log('[Service Worker] Navigation fetch failed. Serving /index.html from cache.');
                        // Try to serve the main app shell.
                        // Ensure '/' or '/index.html' is definitely in your urlsToCache.
                        return caches.match('/') || caches.match('/index.html');
                    }

                    // For other types of requests (images, data files etc.),
                    // if they are not critical for the page shell to load,
                    // allowing them to fail might be acceptable, or you could
                    // return a generic placeholder if needed.
                    // For this app, core data is pre-cached. If a non-cached data file is requested offline,
                    // the app's JS should handle the resulting error.
                    // This empty return will result in a network error for non-navigation requests.
                });
            })
            .catch(error => {
                console.error("[Service Worker] Error in caches.match or network fetch: ", error);
                // As a last resort for navigation, if even caches.match failed initially.
                if (event.request.mode === 'navigate') {
                    return caches.match('/') || caches.match('/index.html');
                }
            })
    );
});
// Cache-First for data/ (JSON files) might be a good strategy
// You might want a more sophisticated caching strategy, e.g., "Stale-While-Revalidate" for data.
// Or network-first for data if updates are frequent and critical.
// The current fetch event handler is a basic "Cache falling back to Network, then cache" strategy.

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    console.log('[Service Worker] Activating and claiming clients.');
    return self.clients.claim(); // Add this line
});