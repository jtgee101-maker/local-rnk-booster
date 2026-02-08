/**
 * Multi-layer Caching System for LocalRnk
 * Provides in-memory LRU cache with Redis fallback
 */

// LRU Cache Implementation
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

interface CacheConfig {
  ttl?: number;           // Time to live in milliseconds
  tags?: string[];        // Tags for cache invalidation
  skipCache?: boolean;    // Skip cache read/write
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

class CacheLayer {
  private memory: LRUCache<string, CacheEntry<any>>;
  private redis: any = null;
  private stats: CacheStats;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxMemorySize: number = 10000;
  private namespace: string = 'localrnk:';

  constructor(config?: {
    maxMemorySize?: number;
    defaultTTL?: number;
    redis?: any;
    namespace?: string;
  }) {
    this.maxMemorySize = config?.maxMemorySize || 10000;
    this.defaultTTL = config?.defaultTTL || 5 * 60 * 1000;
    this.redis = config?.redis || null;
    this.namespace = config?.namespace || 'localrnk:';
    this.memory = new LRUCache(this.maxMemorySize);
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const namespacedKey = this.namespace + key;
    
    // Try memory first
    const memoryEntry = this.memory.get(namespacedKey);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      this.stats.hits++;
      return memoryEntry.value;
    }

    // If expired in memory, remove it
    if (memoryEntry) {
      this.memory.delete(namespacedKey);
      this.stats.evictions++;
    }

    // Try Redis if available
    if (this.redis) {
      try {
        const redisValue = await this.redis.get(namespacedKey);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          // Backfill memory cache
          this.memory.set(namespacedKey, parsed);
          this.stats.hits++;
          return parsed.value;
        }
      } catch (error) {
        console.warn('Redis get error:', error);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    config?: CacheConfig
  ): Promise<void> {
    if (config?.skipCache) return;

    const namespacedKey = this.namespace + key;
    const ttl = config?.ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      tags: config?.tags || []
    };

    // Always set in memory
    this.memory.set(namespacedKey, entry);

    // Also set in Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(
          namespacedKey,
          Math.ceil(ttl / 1000),
          JSON.stringify(entry)
        );
      } catch (error) {
        console.warn('Redis set error:', error);
      }
    }

    this.stats.size = this.memory.size();
  }

  /**
   * Get or compute value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    if (config?.skipCache) {
      return factory();
    }

    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, config);
    return value;
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    const namespacedKey = this.namespace + key;
    this.memory.delete(namespacedKey);

    if (this.redis) {
      try {
        await this.redis.del(namespacedKey);
      } catch (error) {
        console.warn('Redis delete error:', error);
      }
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    // Invalidate in memory
    for (const key of this.memory.keys()) {
      const entry = this.memory.get(key);
      if (entry && entry.tags.includes(tag)) {
        this.memory.delete(key);
      }
    }

    // Invalidate in Redis if available
    if (this.redis) {
      try {
        // This requires a separate index of tags to keys
        // For now, we'll use a pattern-based approach
        const keys = await this.redis.keys(`${this.namespace}*`);
        for (const key of keys) {
          const value = await this.redis.get(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed.tags?.includes(tag)) {
              await this.redis.del(key);
            }
          }
        }
      } catch (error) {
        console.warn('Redis tag invalidation error:', error);
      }
    }
  }

  /**
   * Invalidate by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    // Invalidate in memory
    for (const key of this.memory.keys()) {
      const cleanKey = key.replace(this.namespace, '');
      if (regex.test(cleanKey)) {
        this.memory.delete(key);
      }
    }

    // Invalidate in Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${this.namespace}*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis pattern invalidation error:', error);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memory.clear();

    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${this.namespace}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis clear error:', error);
      }
    }

    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    hitRate: number;
    missRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.memory.size(),
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      missRate: total > 0 ? (this.stats.misses / total) * 100 : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, size: this.memory.size() };
  }

  /**
   * Create cache key from parts
   */
  static createKey(...parts: (string | number | undefined)[]): string {
    return parts.filter(p => p !== undefined).join(':');
  }
}

// Cache warming utilities
export class CacheWarmer {
  private cache: CacheLayer;

  constructor(cache: CacheLayer) {
    this.cache = cache;
  }

  /**
   * Warm cache with user data
   */
  async warmUserCache(userId: string, userData: any): Promise<void> {
    const key = CacheLayer.createKey('user', userId);
    await this.cache.set(key, userData, { ttl: 15 * 60 * 1000, tags: ['user'] });
  }

  /**
   * Warm cache with tenant data
   */
  async warmTenantCache(tenantId: string, tenantData: any): Promise<void> {
    const key = CacheLayer.createKey('tenant', tenantId);
    await this.cache.set(key, tenantData, { ttl: 30 * 60 * 1000, tags: ['tenant'] });
  }

  /**
   * Warm cache with dashboard stats
   */
  async warmDashboardStats(stats: any): Promise<void> {
    const key = CacheLayer.createKey('dashboard', 'stats');
    await this.cache.set(key, stats, { ttl: 5 * 60 * 1000, tags: ['dashboard'] });
  }

  /**
   * Warm cache with list data
   */
  async warmListCache(
    collection: string,
    listKey: string,
    data: any[],
    ttl?: number
  ): Promise<void> {
    const key = CacheLayer.createKey('list', collection, listKey);
    await this.cache.set(key, data, {
      ttl: ttl || 10 * 60 * 1000,
      tags: ['list', collection]
    });
  }
}

// Predefined cache strategies
export const cacheStrategies = {
  // User data - 15 minutes
  user: { ttl: 15 * 60 * 1000, tags: ['user'] },
  
  // Tenant data - 30 minutes
  tenant: { ttl: 30 * 60 * 1000, tags: ['tenant'] },
  
  // Dashboard stats - 5 minutes
  dashboard: { ttl: 5 * 60 * 1000, tags: ['dashboard'] },
  
  // Lists - 10 minutes
  list: { ttl: 10 * 60 * 1000, tags: ['list'] },
  
  // Analytics - 15 minutes
  analytics: { ttl: 15 * 60 * 1000, tags: ['analytics'] },
  
  // Reference data - 1 hour
  reference: { ttl: 60 * 60 * 1000, tags: ['reference'] },
  
  // Session data - 24 hours
  session: { ttl: 24 * 60 * 60 * 1000, tags: ['session'] },
  
  // Short-lived - 1 minute
  short: { ttl: 60 * 1000, tags: ['short'] }
};

// Create default cache instance
export const cache = new CacheLayer({
  maxMemorySize: 10000,
  defaultTTL: 5 * 60 * 1000
}));

export const cacheWarmer = new CacheWarmer(cache);

export default cache;
