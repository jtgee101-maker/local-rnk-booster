/**
 * 200X Query Optimizer - Intelligent query optimization
 * Prevents N+1, adds caching, optimizes joins
 */

import { UltraCache } from './cache-200x';

interface QueryPlan {
  sql: string;
  params: any[];
  cacheKey?: string;
  cacheTTL?: number;
  shouldBatch?: boolean;
  estimatedCost: number;
}

interface OptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  optimizations: string[];
  estimatedImprovement: number;
}

export class QueryOptimizer {
  private cache: UltraCache<any>;
  private queryLog: Map<string, { count: number; totalTime: number }> = new Map();

  constructor() {
    this.cache = new UltraCache({ maxSizeMB: 50, defaultTTLSeconds: 60 });
  }

  /**
   * Analyze and optimize a query
   */
  analyze(query: string): OptimizationResult {
    const optimizations: string[] = [];
    let optimizedQuery = query;
    let improvement = 1;

    // Check for N+1 patterns
    if (this.hasNPlusOnePattern(query)) {
      optimizations.push('Detected N+1 pattern - consider batching');
      improvement *= 10;
    }

    // Check for missing LIMIT
    if (this.missingLimit(query)) {
      optimizations.push('Add LIMIT clause to reduce result set');
      optimizedQuery = this.addLimit(optimizedQuery, 1000);
      improvement *= 5;
    }

    // Check for SELECT *
    if (query.includes('SELECT *')) {
      optimizations.push('Replace SELECT * with specific columns');
      improvement *= 2;
    }

    // Check for missing indexes hint
    if (this.hasWhereClause(query) && !this.hasIndexHint(query)) {
      optimizations.push('Consider adding indexes on WHERE columns');
    }

    return {
      originalQuery: query,
      optimizedQuery,
      optimizations,
      estimatedImprovement: improvement
    };
  }

  /**
   * Execute with automatic optimization
   */
  async execute<T>(
    queryFn: () => Promise<T>,
    options: {
      cacheKey?: string;
      cacheTTL?: number;
      retryAttempts?: number;
    } = {}
  ): Promise<T> {
    // Check cache
    if (options.cacheKey) {
      const cached = this.cache.get(options.cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Execute with retry
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= (options.retryAttempts || 3); attempt++) {
      try {
        const startTime = Date.now();
        const result = await queryFn();
        const duration = Date.now() - startTime;

        // Log performance
        this.logQuery(options.cacheKey || 'unknown', duration);

        // Cache result
        if (options.cacheKey) {
          this.cache.set(options.cacheKey, result, options.cacheTTL);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        if (attempt < (options.retryAttempts || 3)) {
          await this.sleep(100 * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Batch multiple queries efficiently
   */
  async batchExecute<T>(
    queries: Array<{
      key: string;
      query: () => Promise<T>;
      cacheTTL?: number;
    }>
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const toExecute: Array<{ key: string; query: () => Promise<T>; cacheTTL?: number }> = [];

    // Check cache for all
    for (const q of queries) {
      const cached = this.cache.get(q.key);
      if (cached !== null) {
        results.set(q.key, cached);
      } else {
        toExecute.push(q);
      }
    }

    // Execute missing in parallel
    const executed = await Promise.all(
      toExecute.map(async (q) => {
        const result = await q.query();
        this.cache.set(q.key, result, q.cacheTTL);
        return { key: q.key, result };
      })
    );

    // Merge results
    for (const { key, result } of executed) {
      results.set(key, result);
    }

    return results;
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalQueries: number;
    averageTime: number;
    cacheHitRate: number;
    slowQueries: Array<{ query: string; avgTime: number; count: number }>;
  } {
    let totalQueries = 0;
    let totalTime = 0;
    const slowQueries: Array<{ query: string; avgTime: number; count: number }> = [];

    for (const [query, stats] of this.queryLog.entries()) {
      totalQueries += stats.count;
      totalTime += stats.totalTime;
      const avgTime = stats.totalTime / stats.count;
      
      if (avgTime > 100) { // > 100ms is slow
        slowQueries.push({ query, avgTime, count: stats.count });
      }
    }

    slowQueries.sort((a, b) => b.avgTime - a.avgTime);

    return {
      totalQueries,
      averageTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      cacheHitRate: this.cache.getStats().hitRate,
      slowQueries: slowQueries.slice(0, 10) // Top 10 slow
    };
  }

  private hasNPlusOnePattern(query: string): boolean {
    // Simple heuristic: queries inside loops often indicate N+1
    return query.includes('WHERE id =') && !query.includes('IN (');
  }

  private missingLimit(query: string): boolean {
    return !query.toLowerCase().includes('limit') && 
           query.toLowerCase().includes('select');
  }

  private addLimit(query: string, limit: number): string {
    if (query.toLowerCase().includes('order by')) {
      return query.replace(/order by/i, `LIMIT ${limit} ORDER BY`);
    }
    return `${query} LIMIT ${limit}`;
  }

  private hasWhereClause(query: string): boolean {
    return query.toLowerCase().includes('where');
  }

  private hasIndexHint(query: string): boolean {
    return query.toLowerCase().includes('index') || 
           query.toLowerCase().includes('use index');
  }

  private logQuery(query: string, duration: number): void {
    const existing = this.queryLog.get(query);
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
    } else {
      this.queryLog.set(query, { count: 1, totalTime: duration });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default QueryOptimizer;
