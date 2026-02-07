/**
 * Service Worker for LocalRnk PWA
 * Provides caching, background sync, and push notifications
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `localrnk-static-${CACHE_VERSION}`;
const API_CACHE = `localrnk-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `localrnk-images-${CACHE_VERSION}`;

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API routes patterns
const API_ROUTES = [/^\/api\//, /^\/auth\//];

// Image patterns
const IMAGE_EXTENSIONS = /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('localrnk-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (except for API mutations handled by background sync)
  if (request.method !== 'GET') {
    // Queue for background sync if offline
    if (!navigator.onLine) {
      event.waitUntil(queueForSync(request));
    }
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Strategy selection based on request type
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// === Cache Strategies ===

/**
 * Cache First Strategy
 * Best for: Static assets (JS, CSS, fonts)
 * Returns cached version immediately, fetches update in background
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refresh cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Network First Strategy
 * Best for: API calls, dynamic content
 * Tries network first, falls back to cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response('Network error and no cache', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Offline and no cached data available' })
    });
  }
}

/**
 * Stale While Revalidate Strategy
 * Best for: Images, frequently updated data
 * Returns cached version immediately, updates cache in background
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
      return cached;
    });
  
  return cached || fetchPromise;
}

// === Helper Functions ===

function isStaticAsset(url) {
  const staticExtensions = /\.(?:js|css|woff2?|ttf|otf)$/i;
  return staticExtensions.test(url.pathname);
}

function isAPIRequest(url) {
  return API_ROUTES.some((pattern) => pattern.test(url.pathname));
}

function isImageRequest(url) {
  return IMAGE_EXTENSIONS.test(url.pathname);
}

// === Background Sync ===

const SYNC_QUEUE_NAME = 'localrnk-sync-queue';

async function queueForSync(request) {
  const db = await openSyncDB();
  const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE_NAME);
  
  await store.add({
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now()
  });
  
  // Register for background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('localrnk-sync');
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'localrnk-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction(SYNC_QUEUE_NAME, 'readonly');
  const store = tx.objectStore(SYNC_QUEUE_NAME);
  const requests = await store.getAll();
  
  for (const item of requests) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body
      });
      
      if (response.ok) {
        // Remove from queue on success
        const deleteTx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
        await deleteTx.objectStore(SYNC_QUEUE_NAME).delete(item.id);
        
        // Notify clients
        notifyClients('sync-complete', { url: item.url, success: true });
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', item.url, error);
    }
  }
}

// === Push Notifications ===

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from LocalRnk',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'LocalRnk',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const data = notification.data;
  
  let url = '/';
  if (action === 'view' && data.url) {
    url = data.url;
  } else if (action === 'dismiss') {
    return;
  } else if (data.url) {
    url = data.url;
  }
  
  event.waitUntil(
    self.clients.openWindow(url)
  );
});

// === Periodic Background Sync ===

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'localrnk-data-sync') {
    event.waitUntil(periodicDataSync());
  }
});

async function periodicDataSync() {
  // Refresh critical data in background
  const urlsToRefresh = [
    '/api/dashboard/stats',
    '/api/notifications/unread'
  ];
  
  for (const url of urlsToRefresh) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(url, response);
      }
    } catch (error) {
      console.log('[SW] Periodic sync failed for:', url);
    }
  }
}

// === Message Handling (from main thread) ===

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'PRECACHE_URLS':
      event.waitUntil(precacheUrls(payload.urls));
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  notifyClients('cache-cleared', {});
}

async function precacheUrls(urls) {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(urls);
  notifyClients('precache-complete', { count: urls.length });
}

async function notifyClients(type, data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type, data });
  });
}

// === IndexedDB Helper ===

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocalRnkSyncDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
        db.createObjectStore(SYNC_QUEUE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
}
