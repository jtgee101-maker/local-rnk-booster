/**
 * 200X Database Utilities - Unified Integration Layer
 * 
 * Combines ConnectionPool, QueryOptimizer, and RateLimiter
 * for all database operations.
 */

import { ConnectionPool } from './connectionPool.ts';
import { QueryOptimizer } from './queryOptimizer.ts';
import { RateLimiter } from './rateLimiter.ts';
import { PerformanceMonitor } from './performanceMonitor.ts';
import { UltraCache } from './cache-200x.ts';

// 200X: Global rate limiter for API endpoints
export const apiRateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 60000, // 100 requests per minute
  maxTokens: 150
});

// 200X: Strict rate limiter for sensitive operations
export const strictRateLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 60000, // 10 requests per minute
  maxTokens: 20
});

// 200X: Query optimizer instance
export const queryOptimizer = new QueryOptimizer();

// 200X: Performance monitor
export const performanceMonitor = new PerformanceMonitor();

// 200X: Cache for query results
export const queryCache = new UltraCache({ maxSizeMB: 100, defaultTTLSeconds: 300 });

/**
 * Execute database query with 200X optimizations
 * - Query optimization
 * - Connection pooling
 * - Caching
 * - Performance monitoring
 */
export async function executeQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    retryAttempts?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const { cacheKey, cacheTTL = 300, retryAttempts = 3, operationName = 'query' } = options;
  
  // Check cache
  if (cacheKey) {
    const cached = queryCache.get(cacheKey);
    if (cached !== null) {
      performanceMonitor.record(`${operationName}_cache_hit`, 1);
      return cached as T;
    }
  }
  
  // Execute with monitoring and retry
  return performanceMonitor.time(operationName, async () => {
    return queryOptimizer.execute(
      queryFn,
      {
        cacheKey,
        cacheTTL,
        retryAttempts
      }
    );
  });
}

/**
 * Middleware for rate limiting API endpoints
 */
export async function withRateLimit(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const result = await limiter.check(identifier);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: result.retryAfter
  };
}

/**
 * Batch process items with 200X optimizations
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    operationName?: string;
  } = {}
): Promise<Array<{ success: boolean; input: T; output?: R; error?: Error }>> {
  const { batchSize = 10, concurrency = 3, operationName = 'batchProcess' } = options;
  
  return performanceMonitor.time(operationName, async () => {
    const { BatchProcessor } = await import('./batchProcessor.ts');
    return BatchProcessor.process(items, processor, {
      batchSize,
      concurrency,
      retryAttempts: 3,
      retryDelay: 1000
    });
  });
}

/**
 * Get performance stats for monitoring
 */
export function getDatabaseStats(): {
  cacheHitRate: number;
  queryStats: ReturnType<QueryOptimizer['getStats']>;
  rateLimitBuckets: number;
} {
  return {
    cacheHitRate: queryCache.getStats().hitRate,
    queryStats: queryOptimizer.getStats(),
    rateLimitBuckets: (apiRateLimiter as any).buckets?.size || 0
  };
}

export default {
  apiRateLimiter,
  strictRateLimiter,
  queryOptimizer,
  performanceMonitor,
  queryCache,
  executeQuery,
  withRateLimit,
  batchProcess,
  getDatabaseStats
};
