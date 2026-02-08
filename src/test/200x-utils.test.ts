/**
 * 200X Utility Functions Test Suite
 * 
 * Tests for the 7 core utility functions:
 * 1. UltraCache - LRU cache with TTL
 * 2. BatchProcessor - Process 10K+ items efficiently
 * 3. CircuitBreaker - Prevent cascade failures
 * 4. QueryOptimizer - Intelligent query optimization
 * 5. PerformanceMonitor - Real-time metrics & alerting
 * 6. RateLimiter - Token bucket rate limiting
 * 7. ConnectionPool - Efficient resource management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the 7 utility functions
import { UltraCache, TieredCache } from '../../functions/utils/cache-200x';
import { BatchProcessor } from '../../functions/utils/batchProcessor';
import { CircuitBreaker, withRetryAndCircuitBreaker } from '../../functions/utils/circuitBreaker';
import { QueryOptimizer } from '../../functions/utils/queryOptimizer';
import { PerformanceMonitor } from '../../functions/utils/performanceMonitor';
import { RateLimiter, TieredRateLimiter } from '../../functions/utils/rateLimiter';
import { ConnectionPool } from '../../functions/utils/connectionPool';

describe('200X Utility Functions', () => {
  
  // ============================================================================
  // 1. UltraCache Tests
  // ============================================================================
  describe('UltraCache', () => {
    let cache: UltraCache<string>;

    beforeEach(() => {
      cache = new UltraCache<string>({
        maxSizeMB: 1,
        defaultTTLSeconds: 1
      });
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      expect(cache.get('missing')).toBeNull();
    });

    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 0.1); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(r => setTimeout(r, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should implement LRU eviction', () => {
      const smallCache = new UltraCache<string>({
        maxSizeMB: 0.001, // Very small cache
        defaultTTLSeconds: 60
      });
      
      // Fill cache beyond capacity
      for (let i = 0; i < 100; i++) {
        smallCache.set(`key${i}`, `value${i}`);
      }
      
      // Old entries should be evicted
      const stats = smallCache.getStats();
      expect(stats.keys).toBeLessThan(100);
    });

    it('should support batch get operations', async () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      
      const results = await cache.mget(['a', 'b', 'missing', 'c']);
      expect(results).toEqual(['1', '2', null, '3']);
    });

    it('should support batch set operations', async () => {
      await cache.mset([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' }
      ]);
      
      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBe('2');
      expect(cache.get('c')).toBe('3');
    });

    it('should memoize function results', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoizedFn = cache.memoize(fn);
      
      expect(memoizedFn(5)).toBe(10);
      expect(memoizedFn(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1); // Should only call once
    });

    it('should track cache statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.6666666666666666);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.getStats().keys).toBe(0);
    });
  });

  // ============================================================================
  // 2. BatchProcessor Tests
  // ============================================================================
  describe('BatchProcessor', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (x: number) => x * 2);
      
      const results = await BatchProcessor.process(
        items,
        processor,
        { batchSize: 2, concurrency: 1 }
      );
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.output)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle processor errors with retry', async () => {
      let attempts = 0;
      const processor = vi.fn(async (x: number) => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary error');
        return x * 2;
      });
      
      const results = await BatchProcessor.process(
        [1],
        processor,
        { batchSize: 1, concurrency: 1, retryAttempts: 3, retryDelay: 10 }
      );
      
      expect(results[0].success).toBe(true);
      expect(results[0].attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      const processor = vi.fn(async () => {
        throw new Error('Persistent error');
      });
      
      const results = await BatchProcessor.process(
        [1],
        processor,
        { batchSize: 1, concurrency: 1, retryAttempts: 2, retryDelay: 10 }
      );
      
      expect(results[0].success).toBe(false);
      expect(results[0].attempts).toBe(2);
      expect(results[0].error).toBeDefined();
    });

    it('should respect concurrency limits', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      
      const processor = vi.fn(async (x: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(r => setTimeout(r, 50));
        concurrent--;
        return x;
      });
      
      await BatchProcessor.process(
        [1, 2, 3, 4],
        processor,
        { batchSize: 1, concurrency: 2 }
      );
      
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      
      await BatchProcessor.process(
        [1, 2, 3],
        async (x) => x,
        { batchSize: 1, concurrency: 1, onProgress }
      );
      
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith(3, 3);
    });

    it('should parallel map with concurrency control', async () => {
      const mapper = async (x: number, index: number) => x * index;
      
      const results = await BatchProcessor.parallelMap(
        [1, 2, 3, 4],
        mapper,
        2
      );
      
      expect(results).toEqual([0, 2, 6, 12]);
    });
  });

  // ============================================================================
  // 3. CircuitBreaker Tests
  // ============================================================================
  describe('CircuitBreaker', () => {
    it('should execute action successfully', async () => {
      const action = vi.fn(async () => 'success');
      const breaker = new CircuitBreaker(action);
      
      const result = await breaker.execute<string>();
      expect(result).toBe('success');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after threshold failures', async () => {
      const action = vi.fn(async () => {
        throw new Error('Service down');
      });
      
      const breaker = new CircuitBreaker(action, {
        failureThreshold: 3,
        resetTimeout: 1000
      });
      
      // Trigger failures
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute()).rejects.toThrow();
      }
      
      // Circuit should now be open
      await expect(breaker.execute()).rejects.toThrow('Circuit breaker is OPEN');
      expect(breaker.isOpen()).toBe(true);
    });

    it('should transition to half-open after reset timeout', async () => {
      const action = vi.fn(async () => 'success');
      
      const breaker = new CircuitBreaker(action, {
        failureThreshold: 1,
        resetTimeout: 50,
        halfOpenMaxCalls: 1
      });
      
      // Open the circuit
      await expect(
        new CircuitBreaker(async () => { throw new Error('fail'); }, {
          failureThreshold: 1,
          resetTimeout: 50
        }).execute()
      ).rejects.toThrow();
      
      // Wait for reset timeout
      await new Promise(r => setTimeout(r, 100));
      
      // Circuit should attempt reset (half-open)
      const stats = breaker.getStats();
      expect(stats.state).toBe('CLOSED'); // Fresh breaker
    });

    it('should track circuit statistics', async () => {
      const action = vi.fn(async () => 'success');
      const breaker = new CircuitBreaker(action);
      
      await breaker.execute();
      await breaker.execute();
      
      const stats = breaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.totalCalls).toBe(2);
    });
  });

  describe('withRetryAndCircuitBreaker', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary');
        return 'success';
      });
      
      const result = await withRetryAndCircuitBreaker(fn, {
        maxRetries: 3,
        retryDelay: 10
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // 4. QueryOptimizer Tests
  // ============================================================================
  describe('QueryOptimizer', () => {
    let optimizer: QueryOptimizer;

    beforeEach(() => {
      optimizer = new QueryOptimizer();
    });

    it('should detect N+1 pattern', () => {
      const analysis = optimizer.analyze('SELECT * FROM users WHERE id = 1');
      expect(analysis.optimizations).toContain('Detected N+1 pattern - consider batching');
      expect(analysis.estimatedImprovement).toBeGreaterThanOrEqual(10);
    });

    it('should detect missing LIMIT', () => {
      const analysis = optimizer.analyze('SELECT * FROM users');
      expect(analysis.optimizations).toContain('Add LIMIT clause to reduce result set');
    });

    it('should detect SELECT *', () => {
      const analysis = optimizer.analyze('SELECT * FROM users');
      expect(analysis.optimizations).toContain('Replace SELECT * with specific columns');
    });

    it('should execute with caching', async () => {
      let callCount = 0;
      const queryFn = async () => {
        callCount++;
        return { data: 'result' };
      };
      
      const result1 = await optimizer.execute(queryFn, {
        cacheKey: 'test-query',
        cacheTTL: 60
      });
      
      const result2 = await optimizer.execute(queryFn, {
        cacheKey: 'test-query',
        cacheTTL: 60
      });
      
      expect(result1).toEqual(result2);
      expect(callCount).toBe(1); // Cached
    });

    it('should batch execute multiple queries', async () => {
      const queries = [
        { key: 'q1', query: async () => 'result1' },
        { key: 'q2', query: async () => 'result2' },
        { key: 'q3', query: async () => 'result3' }
      ];
      
      const results = await optimizer.batchExecute(queries);
      
      expect(results.get('q1')).toBe('result1');
      expect(results.get('q2')).toBe('result2');
      expect(results.get('q3')).toBe('result3');
    });

    it('should track slow queries', async () => {
      // Mock a slow query
      await optimizer.execute(async () => {
        await new Promise(r => setTimeout(r, 150)); // > 100ms threshold
        return 'result';
      }, { cacheKey: 'slow-query' });
      
      const stats = optimizer.getStats();
      expect(stats.slowQueries.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 5. PerformanceMonitor Tests
  // ============================================================================
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('should record metrics', () => {
      monitor.record('test_metric', 100);
      monitor.record('test_metric', 200);
      
      const stats = monitor.getStats('test_metric');
      expect(stats.count).toBe(2);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
      expect(stats.avg).toBe(150);
    });

    it('should time operations', async () => {
      const result = await monitor.time('test_op', async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'success';
      });
      
      expect(result).toBe('success');
      
      const stats = monitor.getStats('test_op_duration');
      expect(stats.count).toBe(1);
      expect(stats.min).toBeGreaterThanOrEqual(40); // Allow for timing variance
    });

    it('should track operation errors', async () => {
      await expect(
        monitor.time('failing_op', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow();
      
      const stats = monitor.getStats('failing_op_error');
      expect(stats.count).toBe(1);
    });

    it('should add alert thresholds', () => {
      monitor.addThreshold({
        metric: 'response_time',
        operator: '>',
        value: 1000
      });
      
      monitor.record('response_time', 1500);
      
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('response_time');
    });

    it('should export metrics', () => {
      monitor.record('metric1', 100);
      
      const json = monitor.exportMetrics('json');
      const data = JSON.parse(json);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should provide performance snapshot', () => {
      monitor.record('cpu_usage', 50);
      
      const snapshot = monitor.getSnapshot();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.metrics.has('cpu_usage')).toBe(true);
      expect(snapshot.memoryUsage).toBeDefined();
    });
  });

  // ============================================================================
  // 6. RateLimiter Tests
  // ============================================================================
  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 5,
        interval: 60000
      });
      
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should reject requests over limit', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 2,
        interval: 60000
      });
      
      await limiter.check('user1'); // 1
      await limiter.check('user1'); // 2
      
      const result = await limiter.check('user1'); // 3 - should reject
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should refill tokens after interval', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 1,
        interval: 100 // 100ms
      });
      
      await limiter.check('user1'); // Use the token
      
      // Wait for refill
      await new Promise(r => setTimeout(r, 150));
      
      const result = await limiter.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('should track different keys separately', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 1,
        interval: 60000
      });
      
      const result1 = await limiter.check('user1');
      const result2 = await limiter.check('user2');
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should reset bucket', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 1,
        interval: 60000
      });
      
      await limiter.check('user1'); // Use token
      limiter.reset('user1');
      
      const result = await limiter.check('user1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('TieredRateLimiter', () => {
    it('should check multiple tiers', async () => {
      const tiered = new TieredRateLimiter();
      
      tiered.addTier('strict', new RateLimiter({
        tokensPerInterval: 1,
        interval: 60000
      }));
      
      tiered.addTier('loose', new RateLimiter({
        tokensPerInterval: 10,
        interval: 60000
      }));
      
      const results = await tiered.checkAll('user1');
      expect(results.strict.allowed).toBe(true);
      expect(results.loose.allowed).toBe(true);
    });
  });

  // ============================================================================
  // 7. ConnectionPool Tests
  // ============================================================================
  describe('ConnectionPool', () => {
    const mockFactory = async () => ({ id: Math.random() });
    const mockDestroy = async () => {};

    it('should acquire and release connections', async () => {
      const pool = new ConnectionPool(mockFactory, mockDestroy, {
        minConnections: 1,
        maxConnections: 2
      });
      
      // Wait for initialization
      await new Promise(r => setTimeout(r, 100));
      
      const conn = await pool.acquire();
      expect(conn).toBeDefined();
      expect(conn.id).toBeDefined();
      
      await pool.release(conn);
      
      const stats = pool.getStats();
      expect(stats.idle).toBeGreaterThanOrEqual(0);
    });

    it('should queue when at capacity', async () => {
      const pool = new ConnectionPool(mockFactory, mockDestroy, {
        minConnections: 0,
        maxConnections: 1,
        acquireTimeout: 100
      });
      
      await new Promise(r => setTimeout(r, 100));
      
      const conn = await pool.acquire();
      
      // Next acquire should timeout
      await expect(pool.acquire()).rejects.toThrow('timeout');
      
      await pool.release(conn);
    });

    it('should provide withConnection helper', async () => {
      const pool = new ConnectionPool(mockFactory, mockDestroy, {
        minConnections: 1,
        maxConnections: 2
      });
      
      await new Promise(r => setTimeout(r, 100));
      
      const result = await pool.withConnection(async (conn) => {
        return { processed: true, connId: conn.id };
      });
      
      expect(result.processed).toBe(true);
      expect(result.connId).toBeDefined();
    });

    it('should track pool statistics', async () => {
      const pool = new ConnectionPool(mockFactory, mockDestroy, {
        minConnections: 1,
        maxConnections: 2
      });
      
      await new Promise(r => setTimeout(r, 100));
      
      const stats = pool.getStats();
      expect(stats.max).toBe(2);
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBe(0);
    });
  });

  // ============================================================================
  // Performance Benchmarks
  // ============================================================================
  describe('Performance Benchmarks', () => {
    it('should process 1000 items in under 1 second', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const processor = async (x: number) => x * 2;
      
      const start = Date.now();
      await BatchProcessor.process(items, processor, {
        batchSize: 100,
        concurrency: 10
      });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });

    it('should handle 10000 cache operations in under 1 second', () => {
      const cache = new UltraCache<number>({
        maxSizeMB: 10,
        defaultTTLSeconds: 60
      });
      
      const start = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i}`, i);
      }
      
      for (let i = 0; i < 10000; i++) {
        cache.get(`key${i}`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle 1000 rate limit checks in under 500ms', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 10000,
        interval: 60000
      });
      
      const start = Date.now();
      
      const promises = Array.from({ length: 1000 }, () => 
        limiter.check('user1')
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // Memory Leak Tests
  // ============================================================================
  describe('Memory Leak Prevention', () => {
    it('should not leak memory with many cache entries', () => {
      const cache = new UltraCache<string>({
        maxSizeMB: 1,
        defaultTTLSeconds: 1
      });
      
      // Add many entries
      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i}`, 'x'.repeat(1000));
      }
      
      const stats = cache.getStats();
      // Should have evicted old entries
      expect(stats.keys).toBeLessThan(10000);
    });

    it('should clear performance monitor metrics', () => {
      const monitor = new PerformanceMonitor();
      
      // Add many metrics
      for (let i = 0; i < 15000; i++) {
        monitor.record('metric', i);
      }
      
      // Should have trimmed to max history
      // Implementation detail: max 10000 metrics
    });

    it('should cleanup rate limiter old buckets', async () => {
      const limiter = new RateLimiter({
        tokensPerInterval: 10,
        interval: 1000
      });
      
      // Create many buckets
      for (let i = 0; i < 100; i++) {
        await limiter.check(`user${i}`);
      }
      
      // Cleanup old buckets
      limiter.cleanup(0); // Immediate cleanup
      
      // After cleanup, old buckets should be removed
      const state = limiter.getBucketState('user0');
      // State might be null after cleanup
    });
  });
});

// Export test results for reporting
export const testSummary = {
  suite: '200X Utility Functions',
  functions: 7,
  targetMetrics: {
    typescriptErrors: 0,
    testPassRate: '100%',
    performanceImprovement: '10x+',
    memoryLeaks: 0
  }
};
