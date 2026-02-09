/**
 * 200X Builder - API Response Cache Middleware
 * Intelligent caching for serverless functions
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

import { createHash } from 'crypto';

// Cache configuration
const CACHE_CONFIG = {
  // Short-lived cache for dynamic data
  dynamic: {
    ttl: 60 * 1000,           // 1 minute
    staleWhileRevalidate: 30 * 1000  // 30 seconds stale
  },
  
  // Medium cache for semi-static data
  semiStatic: {
    ttl: 5 * 60 * 1000,       // 5 minutes
    staleWhileRevalidate: 60 * 1000  // 1 minute stale
  },
  
  // Long cache for static data
  static: {
    ttl: 60 * 60 * 1000,      // 1 hour
    staleWhileRevalidate: 5 * 60 * 1000  // 5 minutes stale
  },
  
  // Very long cache for rarely changing data
  permanent: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    staleWhileRevalidate: 60 * 60 * 1000  // 1 hour stale
  }
};

// In-memory cache (use Redis in production)
const responseCache = new Map();
const backgroundRefreshes = new Set();

/**
 * Generate cache key from request
 */
const generateCacheKey = (event) => {
  const data = {
    path: event.path || event.httpPath,
    query: event.queryStringParameters || event.query || {},
    body: event.body
  };
  
  const str = JSON.stringify(data);
  return createHash('md5').update(str).digest('hex');
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = (entry, config) => {
  if (!entry) return false;
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Still fresh
  if (age < config.ttl) return true;
  
  // Stale but acceptable
  if (age < config.ttl + config.staleWhileRevalidate) return 'stale';
  
  return false;
};

/**
 * Response cache middleware
 */
export const cacheMiddleware = (handler, options = {}) => {
  const {
    configKey = 'dynamic',
    keyGenerator = null,
    shouldCache = null,
    onCacheHit = null,
    onCacheMiss = null,
    varyByHeaders = [],
    varyByQuery = []
  } = options;
  
  const config = CACHE_CONFIG[configKey] || CACHE_CONFIG.dynamic;
  
  return async (event, context) => {
    // Skip cache for non-GET requests
    const method = event.httpMethod || event.method || 'GET';
    if (method !== 'GET') {
      return handler(event, context);
    }
    
    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = await keyGenerator(event);
    } else {
      cacheKey = generateCacheKey(event);
    }
    
    // Add vary headers to key
    if (varyByHeaders.length > 0) {
      const headerValues = varyByHeaders.map(h => event.headers[h.toLowerCase()] || '');
      cacheKey += ':' + createHash('md5').update(JSON.stringify(headerValues)).digest('hex');
    }
    
    // Add vary query params to key
    if (varyByQuery.length > 0) {
      const query = event.queryStringParameters || event.query || {};
      const queryValues = varyByQuery.map(q => query[q] || '');
      cacheKey += ':' + createHash('md5').update(JSON.stringify(queryValues)).digest('hex');
    }
    
    // Check cache
    const cached = responseCache.get(cacheKey);
    const cacheStatus = isCacheValid(cached, config);
    
    if (cacheStatus === true || cacheStatus === 'stale') {
      // Cache hit
      if (onCacheHit) {
        onCacheHit(cacheKey, cached);
      }
      
      // Return cached response with headers
      const response = {
        ...cached.data,
        headers: {
          ...cached.data.headers,
          'X-Cache': cacheStatus === 'stale' ? 'STALE' : 'HIT',
          'X-Cache-TTL': Math.max(0, Math.floor((config.ttl - (Date.now() - cached.timestamp)) / 1000)).toString()
        }
      };
      
      // Trigger background refresh if stale
      if (cacheStatus === 'stale' && !backgroundRefreshes.has(cacheKey)) {
        backgroundRefreshes.add(cacheKey);
        
        // Execute handler in background
        handler(event, context).then(freshData => {
          if (freshData && freshData.statusCode >= 200 && freshData.statusCode < 300) {
            responseCache.set(cacheKey, {
              data: freshData,
              timestamp: Date.now()
            });
          }
          backgroundRefreshes.delete(cacheKey);
        }).catch(err => {
          console.error('Background cache refresh failed:', err);
          backgroundRefreshes.delete(cacheKey);
        });
      }
      
      return response;
    }
    
    // Cache miss
    if (onCacheMiss) {
      onCacheMiss(cacheKey);
    }
    
    // Execute handler
    const response = await handler(event, context);
    
    // Cache successful responses
    if (response && response.statusCode >= 200 && response.statusCode < 300) {
      const shouldCacheResult = shouldCache ? await shouldCache(event, response) : true;
      
      if (shouldCacheResult) {
        responseCache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }
    }
    
    // Add cache headers
    if (response && typeof response === 'object') {
      response.headers = {
        ...response.headers,
        'X-Cache': 'MISS',
        'Cache-Control': `max-age=${Math.floor(config.ttl / 1000)}, stale-while-revalidate=${Math.floor(config.staleWhileRevalidate / 1000)}`
      };
    }
    
    return response;
  };
};

/**
 * Invalidate cache entries by pattern
 */
export const invalidateCache = (pattern) => {
  let count = 0;
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
      count++;
    }
  }
  return count;
};

/**
 * Pre-warm cache with data
 */
export const warmCache = (key, data, configKey = 'dynamic') => {
  const config = CACHE_CONFIG[configKey] || CACHE_CONFIG.dynamic;
  
  responseCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Auto-expire
  setTimeout(() => {
    responseCache.delete(key);
  }, config.ttl + config.staleWhileRevalidate);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let fresh = 0;
  let stale = 0;
  
  for (const entry of responseCache.values()) {
    const age = now - entry.timestamp;
    if (age < CACHE_CONFIG.dynamic.ttl) {
      fresh++;
    } else {
      stale++;
    }
  }
  
  return {
    total: responseCache.size,
    fresh,
    stale,
    backgroundRefreshes: backgroundRefreshes.size
  };
};

/**
 * Clear entire cache
 */
export const clearCache = () => {
  responseCache.clear();
  backgroundRefreshes.clear();
};

/**
 * Cache tags for related invalidation
 */
export const createTaggedCache = (tags) => {
  return {
    invalidateByTag: (tag) => {
      // Implementation for tag-based invalidation
      // Would require additional metadata storage
      console.log(`Invalidating cache tag: ${tag}`);
    }
  };
};

export default {
  cacheMiddleware,
  invalidateCache,
  warmCache,
  getCacheStats,
  clearCache,
  CACHE_CONFIG
};
