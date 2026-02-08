/**
 * 200X Connection Pool - Efficient resource management
 * Prevents connection exhaustion
 */

interface PoolOptions {
  minConnections?: number;
  maxConnections?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  maxQueueSize?: number;
}

interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  max: number;
}

interface PooledConnection<T> {
  connection: T;
  acquiredAt: number;
  lastUsed: number;
  id: string;
}

export class ConnectionPool<T> {
  private pool: PooledConnection<T>[] = [];
  private active: Set<PooledConnection<T>> = new Set();
  private waiting: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private connectionCounter = 0;
  private isShutdown = false;

  constructor(
    private readonly factory: () => Promise<T>,
    private readonly destroy: (connection: T) => Promise<void>,
    private readonly options: PoolOptions = {}
  ) {
    this.options = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeout: 30000,
      idleTimeout: 300000,
      maxQueueSize: 100,
      ...options
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Create minimum connections
    for (let i = 0; i < (this.options.minConnections || 2); i++) {
      await this.createConnection();
    }

    // Start idle cleanup
    this.startCleanup();
  }

  private async createConnection(): Promise<void> {
    if (this.pool.length + this.active.size >= (this.options.maxConnections || 10)) {
      return;
    }

    try {
      const connection = await this.factory();
      const pooled: PooledConnection<T> = {
        connection,
        acquiredAt: 0,
        lastUsed: Date.now(),
        id: `conn-${++this.connectionCounter}`
      };
      this.pool.push(pooled);
    } catch (error) {
      console.error('[ConnectionPool] Failed to create connection:', error);
    }
  }

  async acquire(): Promise<T> {
    if (this.isShutdown) {
      throw new Error('Pool is shutdown');
    }

    // Return idle connection immediately
    const idle = this.pool.pop();
    if (idle) {
      idle.acquiredAt = Date.now();
      this.active.add(idle);
      return idle.connection;
    }

    // Create new if under max
    if (this.active.size < (this.options.maxConnections || 10)) {
      try {
        const connection = await this.factory();
        const pooled: PooledConnection<T> = {
          connection,
          acquiredAt: Date.now(),
          lastUsed: Date.now(),
          id: `conn-${++this.connectionCounter}`
        };
        this.active.add(pooled);
        return connection;
      } catch (error) {
        console.error('[ConnectionPool] Failed to create connection:', error);
      }
    }

    // Queue if at capacity
    if (this.waiting.length >= (this.options.maxQueueSize || 100)) {
      throw new Error('Pool queue is full');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waiting.findIndex(w => w.resolve === resolve);
        if (index > -1) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.options.acquireTimeout);

      this.waiting.push({ resolve, reject, timeout });
    });
  }

  async release(connection: T): Promise<void> {
    // Find in active
    let pooled: PooledConnection<T> | undefined;
    for (const p of this.active) {
      if (p.connection === connection) {
        pooled = p;
        break;
      }
    }

    if (!pooled) {
      console.warn('[ConnectionPool] Releasing unknown connection');
      return;
    }

    this.active.delete(pooled);
    pooled.acquiredAt = 0;
    pooled.lastUsed = Date.now();

    // Fulfill waiting request
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()!;
      clearTimeout(waiter.timeout);
      pooled.acquiredAt = Date.now();
      this.active.add(pooled);
      waiter.resolve(pooled.connection);
    } else {
      this.pool.push(pooled);
    }
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const idleTimeout = this.options.idleTimeout || 300000;
      
      // Remove idle connections past timeout
      const toRemove: PooledConnection<T>[] = [];
      for (let i = this.pool.length - 1; i >= 0; i--) {
        const conn = this.pool[i];
        if (now - conn.lastUsed > idleTimeout && this.pool.length > (this.options.minConnections || 2)) {
          toRemove.push(conn);
          this.pool.splice(i, 1);
        }
      }

      // Destroy removed connections
      Promise.all(toRemove.map(c => this.destroy(c.connection)))
        .catch(err => console.error('[ConnectionPool] Cleanup error:', err));
    }, 60000); // Check every minute
  }

  async withConnection<R>(fn: (connection: T) => Promise<R>): Promise<R> {
    const connection = await this.acquire();
    try {
      return await fn(connection);
    } finally {
      await this.release(connection);
    }
  }

  getStats(): PoolStats {
    return {
      total: this.pool.length + this.active.size,
      active: this.active.size,
      idle: this.pool.length,
      waiting: this.waiting.length,
      max: this.options.maxConnections || 10
    };
  }

  async shutdown(): Promise<void> {
    this.isShutdown = true;
    
    // Reject all waiting
    for (const waiter of this.waiting) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool is shutting down'));
    }
    this.waiting = [];

    // Destroy all connections
    await Promise.all([
      ...this.pool.map(c => this.destroy(c.connection)),
      ...Array.from(this.active).map(c => this.destroy(c.connection))
    ]);
    
    this.pool = [];
    this.active.clear();
  }
}

export default ConnectionPool;
