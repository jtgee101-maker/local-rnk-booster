/**
 * Database Performance Monitor
 * Tracks query execution times and identifies slow queries
 */

interface QueryMetrics {
  collection: string;
  operation: string;
  query: any;
  duration: number;
  timestamp: Date;
  slow: boolean;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms
  private maxMetricsSize = 1000;

  /**
   * Wrap a database operation with timing
   */
  async track<T>(
    collection: string,
    operation: string,
    query: any,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        collection,
        operation,
        query: this.sanitizeQuery(query),
        duration,
        timestamp: new Date(),
        slow: duration > this.SLOW_QUERY_THRESHOLD
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        collection,
        operation,
        query: this.sanitizeQuery(query),
        duration,
        timestamp: new Date(),
        slow: true
      });
      throw error;
    }
  }

  /**
   * Record a metric, maintaining max size
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Log slow queries immediately
    if (metric.slow) {
      console.warn(`[SLOW QUERY] ${metric.collection}.${metric.operation} took ${metric.duration.toFixed(2)}ms`, {
        query: metric.query,
        timestamp: metric.timestamp
      });
    }
  }

  /**
   * Get top 10 slowest queries
   */
  getSlowestQueries(limit: number = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => m.slow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get query statistics by collection
   */
  getCollectionStats(): Record<string, {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    operations: Record<string, { count: number; avgDuration: number }>
  }> {
    const stats: Record<string, any> = {};

    for (const metric of this.metrics) {
      if (!stats[metric.collection]) {
        stats[metric.collection] = {
          totalQueries: 0,
          totalDuration: 0,
          slowQueries: 0,
          operations: {}
        };
      }

      const coll = stats[metric.collection];
      coll.totalQueries++;
      coll.totalDuration += metric.duration;
      if (metric.slow) coll.slowQueries++;

      if (!coll.operations[metric.operation]) {
        coll.operations[metric.operation] = { count: 0, totalDuration: 0 };
      }
      coll.operations[metric.operation].count++;
      coll.operations[metric.operation].totalDuration += metric.duration;
    }

    // Calculate averages
    for (const collName in stats) {
      const coll = stats[collName];
      coll.avgDuration = coll.totalQueries > 0 ? coll.totalDuration / coll.totalQueries : 0;
      
      for (const opName in coll.operations) {
        const op = coll.operations[opName];
        op.avgDuration = op.count > 0 ? op.totalDuration / op.count : 0;
        delete op.totalDuration;
      }
      
      delete coll.totalDuration;
    }

    return stats;
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalQueries: number;
      slowQueryCount: number;
      slowQueryPercentage: number;
      avgResponseTime: number;
    };
    slowestQueries: QueryMetrics[];
    collectionStats: ReturnType<typeof this.getCollectionStats>;
    recommendations: string[];
  } {
    const totalQueries = this.metrics.length;
    const slowQueries = this.metrics.filter(m => m.slow);
    const avgResponseTime = totalQueries > 0
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;

    const collectionStats = this.getCollectionStats();
    const recommendations = this.generateRecommendations(collectionStats);

    return {
      summary: {
        totalQueries,
        slowQueryCount: slowQueries.length,
        slowQueryPercentage: totalQueries > 0 ? (slowQueries.length / totalQueries) * 100 : 0,
        avgResponseTime
      },
      slowestQueries: this.getSlowestQueries(10),
      collectionStats,
      recommendations
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    stats: ReturnType<typeof this.getCollectionStats>
  ): string[] {
    const recommendations: string[] = [];

    for (const [collection, data] of Object.entries(stats)) {
      if (data.slowQueries > data.totalQueries * 0.1) {
        recommendations.push(
          `Collection '${collection}' has ${data.slowQueries} slow queries (${((data.slowQueries/data.totalQueries)*100).toFixed(1)}%). Consider adding indexes.`
        );
      }

      // Check for N+1 pattern (high count of findOne operations)
      const findOneOps = data.operations['findOne'];
      if (findOneOps && findOneOps.count > 100 && findOneOps.avgDuration > 50) {
        recommendations.push(
          `Collection '${collection}' has many findOne operations. Consider using $in queries or joins to reduce N+1 queries.`
        );
      }
    }

    return recommendations;
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: any): any {
    if (!query || typeof query !== 'object') return query;
    
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn'];
    const sanitized = { ...query };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const dbMonitor = new PerformanceMonitor();

/**
 * Decorator for tracking function calls
 */
export function trackQuery(collection: string, operation: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return dbMonitor.track(collection, operation, args[0], () => 
        originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
}

/**
 * Wrap base44 db operations with monitoring
 */
export function wrapWithMonitoring(db: any) {
  const wrapped = { ...db };
  
  if (db.collections) {
    wrapped.collections = {};
    
    for (const [collectionName, collection] of Object.entries(db.collections)) {
      wrapped.collections[collectionName] = wrapCollection(collectionName, collection);
    }
  }
  
  return wrapped;
}

function wrapCollection(name: string, collection: any) {
  if (!collection) return collection;
  
  const wrapped: any = {};
  
  const operations = ['find', 'findOne', 'count', 'countDocuments', 'aggregate', 'insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];
  
  for (const op of operations) {
    if (typeof collection[op] === 'function') {
      wrapped[op] = (...args: any[]) => {
        return dbMonitor.track(name, op, args[0], () => collection[op](...args));
      };
    }
  }
  
  // Handle chained operations (find().sort().limit())
  if (collection.find) {
    wrapped.find = (...args: any[]) => {
      const cursor = collection.find(...args);
      return wrapCursor(name, cursor);
    };
  }
  
  return wrapped;
}

function wrapCursor(collectionName: string, cursor: any) {
  if (!cursor) return cursor;
  
  const wrapped: any = {};
  const chainMethods = ['sort', 'skip', 'limit', 'project'];
  
  for (const method of chainMethods) {
    if (typeof cursor[method] === 'function') {
      wrapped[method] = (...args: any[]) => {
        const newCursor = cursor[method](...args);
        return wrapCursor(collectionName, newCursor);
      };
    }
  }
  
  // Terminal operations
  const terminalOps = ['toArray', 'next', 'forEach', 'count'];
  for (const op of terminalOps) {
    if (typeof cursor[op] === 'function') {
      wrapped[op] = (...args: any[]) => {
        return dbMonitor.track(collectionName, `cursor.${op}`, {}, () => cursor[op](...args));
      };
    }
  }
  
  return wrapped;
}

export default dbMonitor;
