/**
 * Cache Strategies Module
 * Provides different caching strategies for different resource types
 */

/**
 * Cache First Strategy
 * Returns cached response immediately, fetches update in background
 * Best for: Static assets (JS, CSS, fonts, images)
 */
export async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refresh in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response);
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network First Strategy
 * Tries network first, falls back to cache
 * Best for: API calls, dynamic content that needs to be fresh
 */
export async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Returns cached version immediately, updates cache in background
 * Best for: Frequently updated data, images
 */
export async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
}

/**
 * Network Only Strategy
 * Only uses network, no caching
 * Best for: Authentication, sensitive data
 */
export async function networkOnly(request) {
  return fetch(request);
}

/**
 * Cache Only Strategy
 * Only uses cache, no network
 * Best for: Offline-only mode, critical assets
 */
export async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (!cached) {
    throw new Error('Resource not found in cache');
  }
  
  return cached;
}

/**
 * Race Strategy
 * Returns whichever resolves first (cache or network)
 * Best for: Quick response times when freshness isn't critical
 */
export async function race(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (!cached) {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }
  
  return Promise.race([
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }),
    cached
  ]);
}

/**
 * Predefined strategies for common use cases
 */
export const Strategies = {
  // Static assets - never change, cache aggressively
  STATIC: {
    name: 'static',
    strategy: cacheFirst,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // API responses - stale while revalidate
  API: {
    name: 'api',
    strategy: staleWhileRevalidate,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 200
  },
  
  // Dynamic data - network first
  DYNAMIC: {
    name: 'dynamic',
    strategy: networkFirst,
    maxAge: 60 * 1000, // 1 minute
    maxEntries: 100
  },
  
  // Images - stale while revalidate
  IMAGES: {
    name: 'images',
    strategy: staleWhileRevalidate,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 300
  },
  
  // Auth - network only
  AUTH: {
    name: 'auth',
    strategy: networkOnly
  },
  
  // Precached - cache only
  PRECACHE: {
    name: 'precache',
    strategy: cacheOnly,
    maxEntries: 50
  }
};

/**
 * Match request to strategy based on URL patterns
 */
export function getStrategyForRequest(url) {
  const pathname = url.pathname;
  
  // Static assets
  if (/\.(js|css|woff2?|ttf|otf)$/i.test(pathname)) {
    return Strategies.STATIC;
  }
  
  // Images
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)) {
    return Strategies.IMAGES;
  }
  
  // Auth endpoints
  if (/^\/(auth|login|logout|api\/auth)/i.test(pathname)) {
    return Strategies.AUTH;
  }
  
  // API endpoints
  if (/^\/api\//i.test(pathname)) {
    return Strategies.API;
  }
  
  // Everything else
  return Strategies.DYNAMIC;
}

/**
 * Execute strategy for a request
 */
export async function executeStrategy(request, strategyConfig) {
  const { strategy, name } = strategyConfig;
  return strategy(request, `localrnk-${name}`);
}

/**
 * Batch cache multiple requests
 */
export async function batchCache(urls, cacheName) {
  const cache = await caches.open(cacheName);
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        return { url, success: true };
      }
      return { url, success: false, error: 'Bad response' };
    } catch (error) {
      return { url, success: false, error: error.message };
    }
  });
  
  return Promise.all(promises);
}

/**
 * Clear expired cache entries
 */
export async function clearExpired(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();
  
  const expired = requests.filter((request) => {
    const url = new URL(request.url);
    const timestamp = url.searchParams.get('_sw_cache_time');
    if (!timestamp) return false;
    return now - parseInt(timestamp, 10) > maxAge;
  });
  
  await Promise.all(expired.map((req) => cache.delete(req)));
  return expired.length;
}

/**
 * Get cache stats
 */
export async function getCacheStats(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  let totalSize = 0;
  const entries = [];
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
      entries.push({
        url: request.url,
        size: blob.size,
        type: response.headers.get('content-type')
      });
    }
  }
  
  return {
    name: cacheName,
    entryCount: entries.length,
    totalSize,
    entries: entries.slice(0, 100) // Limit details
  };
}

export default {
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,
  race,
  Strategies,
  getStrategyForRequest,
  executeStrategy,
  batchCache,
  clearExpired,
  getCacheStats
};
