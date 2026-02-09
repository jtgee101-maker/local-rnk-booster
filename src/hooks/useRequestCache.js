/**
 * 200X Builder - Request Cache & Deduplication
 * Optimized API calls with smart caching
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Request cache storage
const requestCache = new Map();
const pendingRequests = new Map();

// Default cache durations
const CACHE_DURATIONS = {
  'user': 5 * 60 * 1000,      // 5 minutes
  'tenant': 10 * 60 * 1000,   // 10 minutes
  'analytics': 60 * 1000,     // 1 minute
  'static': 30 * 60 * 1000,   // 30 minutes
  'default': 2 * 60 * 1000    // 2 minutes
};

/**
 * Generate cache key from request
 */
const generateCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${url}?${sortedParams}`;
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = (entry, duration) => {
  if (!entry) return false;
  return Date.now() - entry.timestamp < duration;
};

/**
 * Make cached request with deduplication
 */
export const cachedRequest = async (url, options = {}) => {
  const {
    method = 'GET',
    params = {},
    body = null,
    cacheDuration = CACHE_DURATIONS.default,
    cacheKey = null,
    skipCache = false,
    deduplicate = true
  } = options;

  const key = cacheKey || generateCacheKey(url, { ...params, method });

  // Skip cache for non-GET requests
  if (method !== 'GET') {
    skipCache = true;
  }

  // Check cache
  if (!skipCache) {
    const cached = requestCache.get(key);
    if (isCacheValid(cached, cacheDuration)) {
      return cached.data;
    }
  }

  // Check for pending request (deduplication)
  if (deduplicate && pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Make request
  const requestPromise = makeRequest(url, { method, params, body });
  
  if (deduplicate) {
    pendingRequests.set(key, requestPromise);
  }

  try {
    const data = await requestPromise;
    
    // Cache successful GET requests
    if (method === 'GET' && !skipCache) {
      requestCache.set(key, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  } finally {
    if (deduplicate) {
      pendingRequests.delete(key);
    }
  }
};

/**
 * Execute HTTP request
 */
const makeRequest = async (url, options) => {
  const { method, params, body } = options;
  
  // Build URL with query params
  const queryString = Object.keys(params).length > 0
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  const fullUrl = url + queryString;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': generateRequestId()
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clear specific cache entry or all cache
 */
export const clearCache = (pattern = null) => {
  if (!pattern) {
    requestCache.clear();
    return;
  }

  // Clear matching entries
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key);
    }
  }
};

/**
 * Preload data into cache
 */
export const preloadCache = (url, data, params = {}) => {
  const key = generateCacheKey(url, params);
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * React hook for cached data fetching
 */
export const useCachedRequest = (url, options = {}) => {
  const {
    params = {},
    cacheDuration = CACHE_DURATIONS.default,
    enabled = true,
    onSuccess = null,
    onError = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const retryAttempt = useRef(0);

  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await cachedRequest(url, {
        params,
        cacheDuration,
        skipCache
      });

      setData(result);
      retryAttempt.current = 0;
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (retryAttempt.current < retryCount) {
        retryAttempt.current++;
        setTimeout(() => fetchData(skipCache), retryDelay * retryAttempt.current);
        return;
      }

      setError(err);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), cacheDuration, enabled, onSuccess, onError, retryCount, retryDelay]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    const key = generateCacheKey(url, params);
    requestCache.delete(key);
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    retry: () => {
      retryAttempt.current = 0;
      return fetchData(true);
    }
  };
};

/**
 * React hook for request deduplication (no caching)
 */
export const useDeduplicatedRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await cachedRequest(url, {
        ...options,
        deduplicate: true,
        skipCache: true
      });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
};

/**
 * Batch multiple requests
 */
export const batchRequests = async (requests) => {
  const promises = requests.map(req => {
    if (typeof req === 'string') {
      return cachedRequest(req);
    }
    return cachedRequest(req.url, req.options || {});
  });

  return Promise.allSettled(promises);
};

/**
 * Get cache stats (for debugging)
 */
export const getCacheStats = () => {
  return {
    entries: requestCache.size,
    pending: pendingRequests.size,
    keys: Array.from(requestCache.keys())
  };
};

export default {
  cachedRequest,
  clearCache,
  preloadCache,
  useCachedRequest,
  useDeduplicatedRequest,
  batchRequests,
  getCacheStats,
  CACHE_DURATIONS
};
