const CACHE_NAME = 'hybrid-siddur-cache-v1'; // Increment version to update cache
const urlsToCache = [
    '/', // Alias for index.html
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // Add paths to core data files that are essential for app shell
    // e.g., 'data/templates/main_menu_config.json'
    // For larger data sets (nusachim, prayer templates), consider a more dynamic caching strategy
    // or caching them on first fetch. For simplicity, we'll cache core app shell files here.
    'assets/icons/icon-192x192.png', // Example: Cache a primary icon
    'assets/icons/icon-512x512.png'  // Example: Cache a larger icon
];

// Install event: Open cache and add core files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Install completed, all files cached.');
                return self.skipWaiting(); // Force the waiting service worker to become the active service worker
            })
            .catch(error => {
                console.error('Service Worker: Caching failed during install:', error);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activate completed, old caches cleared.');
            return self.clients.claim(); // Take control of all open clients once activated
        })
    );
});

// Fetch event: Serve cached content when offline, or fetch from network
self.addEventListener('fetch', event => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // For navigation requests (HTML), use a network-first strategy to get the latest page,
    // but fall back to cache if offline. For other assets, use cache-first.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If a valid response is received, cache it (optional for navigations)
                    // and return it.
                    // Be careful with caching POST responses or opaque responses.
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, try to serve from cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match('index.html'); // Fallback to index
                        });
                })
        );
    } else {
        // Cache-first strategy for static assets
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Cache hit - return response
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Not in cache - fetch from network, then cache it
                    return fetch(event.request).then(
                        networkResponse => {
                            // Check if we received a valid response
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }

                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        }
                    ).catch(error => {
                        console.error('Service Worker: Fetching failed for:', event.request.url, error);
                        // Optionally, you could return a custom offline fallback page for specific asset types
                        // For example, for images: return caches.match('/assets/icons/offline-image.png');
                    });
                })
        );
    }
});