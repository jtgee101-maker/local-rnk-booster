import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from './cacheStrategies';

// Mock the Cache API
type MockCache = {
  match: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  keys: ReturnType<typeof vi.fn>;
};

type MockCacheStorage = {
  open: ReturnType<typeof vi.fn>;
};

describe('Cache Strategies', () => {
  let mockCache: MockCache;
  let mockCaches: MockCacheStorage;

  beforeEach(() => {
    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn(),
    };

    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };

    // @ts-ignore - mocking global caches
    global.caches = mockCaches;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cacheFirst', () => {
    it('should return cached response if available', async () => {
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/api/data');
      const result = await cacheFirst(request, 'test-cache');

      expect(result).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(request);
    });

    it('should fetch and cache if no cached response', async () => {
      mockCache.match.mockResolvedValue(undefined);
      
      const networkResponse = new Response('network data', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/data');
      const result = await cacheFirst(request, 'test-cache');

      expect(result).toBe(networkResponse);
      expect(mockCache.put).toHaveBeenCalledWith(request, networkResponse);
    });

    it('should not cache failed responses', async () => {
      mockCache.match.mockResolvedValue(undefined);
      
      const errorResponse = new Response('error', { status: 500 });
      global.fetch = vi.fn().mockResolvedValue(errorResponse);

      const request = new Request('https://example.com/api/data');
      const result = await cacheFirst(request, 'test-cache');

      expect(result).toBe(errorResponse);
      expect(mockCache.put).not.toHaveBeenCalled();
    });
  });

  describe('networkFirst', () => {
    it('should return network response on success', async () => {
      const networkResponse = new Response('network data', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/data');
      const result = await networkFirst(request, 'test-cache');

      expect(result).toBe(networkResponse);
      expect(mockCache.put).toHaveBeenCalledWith(request, networkResponse);
    });

    it('should fall back to cache on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/api/data');
      const result = await networkFirst(request, 'test-cache');

      expect(result).toBe(cachedResponse);
    });

    it('should throw if network fails and no cache', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      mockCache.match.mockResolvedValue(undefined);

      const request = new Request('https://example.com/api/data');
      await expect(networkFirst(request, 'test-cache')).rejects.toThrow('Network error');
    });
  });

  describe('staleWhileRevalidate', () => {
    it('should return cached response immediately if available', async () => {
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);
      global.fetch = vi.fn().mockResolvedValue(new Response('network data'));

      const request = new Request('https://example.com/api/data');
      const result = await staleWhileRevalidate(request, 'test-cache');

      expect(result).toBe(cachedResponse);
    });

    it('should fetch from network if no cache', async () => {
      mockCache.match.mockResolvedValue(undefined);
      const networkResponse = new Response('network data', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/data');
      const result = await staleWhileRevalidate(request, 'test-cache');

      expect(result).toBe(networkResponse);
    });
  });

  describe('networkOnly', () => {
    it('should only use network', async () => {
      const networkResponse = new Response('network data');
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/data');
      const result = await networkOnly(request);

      expect(result).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('cacheOnly', () => {
    it('should return cached response if available', async () => {
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/api/data');
      const result = await cacheOnly(request, 'test-cache');

      expect(result).toBe(cachedResponse);
    });

    it('should throw if no cached response', async () => {
      mockCache.match.mockResolvedValue(undefined);

      const request = new Request('https://example.com/api/data');
      await expect(cacheOnly(request, 'test-cache')).rejects.toThrow('Resource not found in cache');
    });
  });

  describe('race', () => {
    it('should return network response if faster', async () => {
      mockCache.match.mockResolvedValue(undefined);
      const networkResponse = new Response('network data', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/data');
      const result = await race(request, 'test-cache');

      expect(result).toBe(networkResponse);
    });

    it('should return cached response immediately if available', async () => {
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      const request = new Request('https://example.com/api/data');
      const result = await race(request, 'test-cache');

      expect(result).toBe(cachedResponse);
    });
  });

  describe('Strategies', () => {
    it('should have STATIC strategy', () => {
      expect(Strategies.STATIC).toBeDefined();
      expect(Strategies.STATIC.name).toBe('static');
      expect(Strategies.STATIC.strategy).toBe(cacheFirst);
    });

    it('should have API strategy', () => {
      expect(Strategies.API).toBeDefined();
      expect(Strategies.API.name).toBe('api');
      expect(Strategies.API.strategy).toBe(staleWhileRevalidate);
    });

    it('should have DYNAMIC strategy', () => {
      expect(Strategies.DYNAMIC).toBeDefined();
      expect(Strategies.DYNAMIC.name).toBe('dynamic');
      expect(Strategies.DYNAMIC.strategy).toBe(networkFirst);
    });

    it('should have IMAGES strategy', () => {
      expect(Strategies.IMAGES).toBeDefined();
      expect(Strategies.IMAGES.name).toBe('images');
      expect(Strategies.IMAGES.strategy).toBe(staleWhileRevalidate);
    });

    it('should have AUTH strategy', () => {
      expect(Strategies.AUTH).toBeDefined();
      expect(Strategies.AUTH.name).toBe('auth');
      expect(Strategies.AUTH.strategy).toBe(networkOnly);
    });

    it('should have PRECACHE strategy', () => {
      expect(Strategies.PRECACHE).toBeDefined();
      expect(Strategies.PRECACHE.name).toBe('precache');
      expect(Strategies.PRECACHE.strategy).toBe(cacheOnly);
    });
  });

  describe('getStrategyForRequest', () => {
    it('should return STATIC for JS files', () => {
      const url = new URL('https://example.com/app.js');
      expect(getStrategyForRequest(url)).toBe(Strategies.STATIC);
    });

    it('should return STATIC for CSS files', () => {
      const url = new URL('https://example.com/styles.css');
      expect(getStrategyForRequest(url)).toBe(Strategies.STATIC);
    });

    it('should return IMAGES for image files', () => {
      const url = new URL('https://example.com/image.png');
      expect(getStrategyForRequest(url)).toBe(Strategies.IMAGES);
    });

    it('should return AUTH for auth endpoints', () => {
      const url = new URL('https://example.com/auth/login');
      expect(getStrategyForRequest(url)).toBe(Strategies.AUTH);
    });

    it('should return API for API endpoints', () => {
      const url = new URL('https://example.com/api/users');
      expect(getStrategyForRequest(url)).toBe(Strategies.API);
    });

    it('should return DYNAMIC for other paths', () => {
      const url = new URL('https://example.com/page');
      expect(getStrategyForRequest(url)).toBe(Strategies.DYNAMIC);
    });
  });

  describe('executeStrategy', () => {
    it('should execute the specified strategy', async () => {
      const cachedResponse = new Response('cached');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/data');
      const result = await executeStrategy(request, Strategies.STATIC);

      expect(result).toBe(cachedResponse);
    });
  });

  describe('batchCache', () => {
    it('should cache multiple URLs', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('data', { status: 200 }));

      const urls = ['https://example.com/1', 'https://example.com/2'];
      const results = await batchCache(urls, 'test-cache');

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle failed requests', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce(new Response('data', { status: 200 }))
        .mockResolvedValueOnce(new Response('error', { status: 500 }));

      const urls = ['https://example.com/1', 'https://example.com/2'];
      const results = await batchCache(urls, 'test-cache');

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce(new Response('data', { status: 200 }))
        .mockRejectedValueOnce(new Error('Network error'));

      const urls = ['https://example.com/1', 'https://example.com/2'];
      const results = await batchCache(urls, 'test-cache');

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Network error');
    });
  });

  describe('clearExpired', () => {
    it('should delete expired entries', async () => {
      const expiredRequest = new Request('https://example.com/expired?_sw_cache_time=1');
      const validRequest = new Request(`https://example.com/valid?_sw_cache_time=${Date.now()}`);
      
      mockCache.keys.mockResolvedValue([expiredRequest, validRequest]);

      const result = await clearExpired('test-cache', 1000);

      expect(result).toBe(1);
      expect(mockCache.delete).toHaveBeenCalledWith(expiredRequest);
      expect(mockCache.delete).not.toHaveBeenCalledWith(validRequest);
    });

    it('should not delete entries without timestamp', async () => {
      const requestWithoutTimestamp = new Request('https://example.com/no-timestamp');
      mockCache.keys.mockResolvedValue([requestWithoutTimestamp]);

      const result = await clearExpired('test-cache', 1000);

      expect(result).toBe(0);
      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const request = new Request('https://example.com/data');
      const response = new Response('data', {
        headers: { 'content-type': 'text/plain' }
      });
      
      mockCache.keys.mockResolvedValue([request]);
      mockCache.match.mockResolvedValue(response);

      const stats = await getCacheStats('test-cache');

      expect(stats.name).toBe('test-cache');
      expect(stats.entryCount).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.entries).toHaveLength(1);
    });

    it('should handle empty cache', async () => {
      mockCache.keys.mockResolvedValue([]);

      const stats = await getCacheStats('test-cache');

      expect(stats.name).toBe('test-cache');
      expect(stats.entryCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });
});
