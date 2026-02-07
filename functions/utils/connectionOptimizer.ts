/**
 * Database Connection Optimization for LocalRnk
 * 
 * Serverless Function Optimizations:
 * - Connection reuse across invocations
 * - Connection pooling configuration
 * - Cold start reduction
 * - Read replica routing
 */

interface ConnectionConfig {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  waitQueueTimeoutMS: number;
  connectTimeoutMS: number;
  socketTimeoutMS: number;
  retryWrites: boolean;
  retryReads: boolean;
  readPreference: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  readPreferenceTags?: { use: string }[];
}

interface QueryRouting {
  writeOperations: string[];
  readOperations: string[];
  analyticsOperations: string[];
}

class ConnectionOptimizer {
  private config: ConnectionConfig;
  private cachedConnection: any = null;
  private connectionPromise: Promise<any> | null = null;
  private lastConnectionTime: number = 0;
  private readonly CONNECTION_MAX_AGE = 10 * 60 * 1000; // 10 minutes

  constructor(config?: Partial<ConnectionConfig>) {
    // Default optimized configuration for serverless
    this.config = {
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      readPreference: 'primaryPreferred',
      ...config
    };
  }

  /**
   * Get optimized connection options for MongoDB
   */
  getConnectionOptions(): ConnectionConfig {
    return { ...this.config };
  }

  /**
   * Get connection string with optimized params
   */
  getOptimizedUri(baseUri: string): string {
    const params = new URLSearchParams({
      maxPoolSize: String(this.config.maxPoolSize),
      minPoolSize: String(this.config.minPoolSize),
      maxIdleTimeMS: String(this.config.maxIdleTimeMS),
      waitQueueTimeoutMS: String(this.config.waitQueueTimeoutMS),
      connectTimeoutMS: String(this.config.connectTimeoutMS),
      socketTimeoutMS: String(this.config.socketTimeoutMS),
      retryWrites: String(this.config.retryWrites),
      retryReads: String(this.config.retryReads),
      readPreference: this.config.readPreference
    });

    const separator = baseUri.includes('?') ? '&' : '?';
    return `${baseUri}${separator}${params.toString()}`;
  }

  /**
   * Get cached connection (for serverless reuse)
   */
  async getCachedConnection(factory: () => Promise<any>): Promise<any> {
    const now = Date.now();

    // Check if connection is too old
    if (this.cachedConnection && (now - this.lastConnectionTime > this.CONNECTION_MAX_AGE)) {
      try {
        await this.cachedConnection.close();
      } catch (e) {
        // Ignore close errors
      }
      this.cachedConnection = null;
      this.connectionPromise = null;
    }

    // Return existing connection
    if (this.cachedConnection) {
      return this.cachedConnection;
    }

    // Return in-flight connection promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = factory().then(conn => {
      this.cachedConnection = conn;
      this.lastConnectionTime = Date.now();
      this.connectionPromise = null;
      return conn;
    });

    return this.connectionPromise;
  }

  /**
   * Close cached connection
   */
  async closeConnection(): Promise<void> {
    if (this.cachedConnection) {
      try {
        await this.cachedConnection.close();
      } catch (e) {
        // Ignore
      }
      this.cachedConnection = null;
      this.connectionPromise = null;
    }
  }

  /**
   * Determine read preference based on operation
   */
  getReadPreference(operation: string, isAnalytics: boolean = false): string {
    const routing: QueryRouting = {
      writeOperations: ['insert', 'update', 'delete', 'create', 'modify'],
      readOperations: ['find', 'count', 'distinct'],
      analyticsOperations: ['aggregate', 'group', 'mapReduce']
    };

    // Analytics queries should use secondary
    if (isAnalytics || routing.analyticsOperations.some(op => operation.includes(op))) {
      return 'secondaryPreferred';
    }

    // Writes must use primary
    if (routing.writeOperations.some(op => operation.includes(op))) {
      return 'primary';
    }

    // Reads can use secondary
    return 'secondaryPreferred';
  }

  /**
   * Wrap collection with read preference routing
   */
  wrapWithRouting(collection: any, collectionName: string): any {
    const wrapped: any = {};
    const self = this;

    // Read operations - can use secondary
    const readOps = ['find', 'findOne', 'count', 'countDocuments', 'distinct', 'aggregate'];
    for (const op of readOps) {
      if (typeof collection[op] === 'function') {
        wrapped[op] = function(...args: any[]) {
          const isAnalytics = op === 'aggregate' && args[0]?.some((stage: any) => 
            stage.$group || stage.$lookup || stage.$unwind
          );
          
          const readPref = self.getReadPreference(op, isAnalytics);
          
          // For aggregate, add $readPreference hint
          if (op === 'aggregate') {
            const options = args[1] || {};
            options.readPreference = readPref;
            return collection[op](args[0], options);
          }
          
          return collection[op](...args);
        };
      }
    }

    // Write operations - must use primary
    const writeOps = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'bulkWrite'];
    for (const op of writeOps) {
      if (typeof collection[op] === 'function') {
        wrapped[op] = collection[op].bind(collection);
      }
    }

    return wrapped;
  }
}

/**
 * Cold start optimization utilities
 */
export class ColdStartOptimizer {
  private warmupFns: (() => Promise<void>)[] = [];
  private isWarm: boolean = false;

  /**
   * Register a warmup function
   */
  onWarmup(fn: () => Promise<void>): void {
    this.warmupFns.push(fn);
  }

  /**
   * Execute warmup sequence
   */
  async warmup(): Promise<void> {
    if (this.isWarm) return;

    const start = performance.now();
    
    // Run warmup functions in parallel where possible
    await Promise.all(this.warmupFns.map(fn => fn()));
    
    this.isWarm = true;
    
    console.log(`Cold start warmup completed in ${(performance.now() - start).toFixed(2)}ms`);
  }

  /**
   * Check if environment is warm
   */
  checkWarmth(): boolean {
    return this.isWarm;
  }

  /**
   * Create lazy initialization wrapper
   */
  static lazy<T>(factory: () => T): () => T {
    let instance: T | null = null;
    return () => {
      if (instance === null) {
        instance = factory();
      }
      return instance;
    };
  }

  /**
   * Create async lazy initialization wrapper
   */
  static lazyAsync<T>(factory: () => Promise<T>): () => Promise<T> {
    let instance: T | null = null;
    let promise: Promise<T> | null = null;
    
    return async () => {
      if (instance !== null) return instance;
      if (promise !== null) return promise;
      
      promise = factory().then(result => {
        instance = result;
        return result;
      });
      
      return promise;
    };
  }
}

/**
 * Connection health monitoring
 */
class ConnectionHealthMonitor {
  private checks: {
    timestamp: Date;
    latency: number;
    success: boolean;
  }[] = [];
  private maxHistory = 100;

  /**
   * Record a health check
   */
  recordCheck(latency: number, success: boolean): void {
    this.checks.push({ timestamp: new Date(), latency, success });
    
    if (this.checks.length > this.maxHistory) {
      this.checks.shift();
    }
  }

  /**
   * Get health statistics
   */
  getStats(): {
    avgLatency: number;
    successRate: number;
    totalChecks: number;
    recentFailures: number;
  } {
    if (this.checks.length === 0) {
      return { avgLatency: 0, successRate: 100, totalChecks: 0, recentFailures: 0 };
    }

    const recentChecks = this.checks.slice(-20);
    const latencies = recentChecks.map(c => c.latency);
    const successes = recentChecks.filter(c => c.success).length;

    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      successRate: (successes / recentChecks.length) * 100,
      totalChecks: this.checks.length,
      recentFailures: recentChecks.length - successes
    };
  }

  /**
   * Check if connection is healthy
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    return stats.successRate >= 95 && stats.avgLatency < 100;
  }
}

/**
 * Base44-specific connection wrapper
 * Optimizes for base44 serverless environment
 */
export function optimizeBase44Connection(base44: any): {
  db: any;
  warmup: () => Promise<void>;
  healthCheck: () => Promise<{ healthy: boolean; stats: any }>;
} {
  const optimizer = new ConnectionOptimizer();
  const coldStart = new ColdStartOptimizer();
  const healthMonitor = new ConnectionHealthMonitor();

  // Warmup sequence
  coldStart.onWarmup(async () => {
    // Pre-warm common collections
    const collections = ['users', 'tenants', 'orders', 'leads'];
    for (const name of collections) {
      try {
        const start = performance.now();
        await base44.db.collections[name]?.findOne?.({});
        healthMonitor.recordCheck(performance.now() - start, true);
      } catch (e) {
        healthMonitor.recordCheck(0, false);
      }
    }
  });

  // Wrap collections with optimizations
  const wrappedDb = { ...base44.db };
  
  if (base44.db.collections) {
    wrappedDb.collections = {};
    for (const [name, collection] of Object.entries(base44.db.collections)) {
      wrappedDb.collections[name] = optimizer.wrapWithRouting(collection, name);
    }
  }

  return {
    db: wrappedDb,
    warmup: () => coldStart.warmup(),
    healthCheck: async () => {
      const start = performance.now();
      let healthy = false;
      
      try {
        await base44.db.collections.users?.findOne?.({});
        healthy = true;
        healthMonitor.recordCheck(performance.now() - start, true);
      } catch (e) {
        healthMonitor.recordCheck(performance.now() - start, false);
      }

      return {
        healthy,
        stats: healthMonitor.getStats()
      };
    }
  };
}

// Preset configurations for different environments
export const connectionPresets = {
  // For high-traffic production
  production: {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 300000,
    readPreference: 'primaryPreferred' as const
  },

  // For serverless/functions
  serverless: {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 60000,
    readPreference: 'primaryPreferred' as const
  },

  // For analytics workloads
  analytics: {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 600000,
    readPreference: 'secondaryPreferred' as const
  },

  // For development
  development: {
    maxPoolSize: 5,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    readPreference: 'primary' as const
  }
};

export default ConnectionOptimizer;
