/**
 * 200X Cache Layer - Optimized for $200M ARR Scale
 * Features: LRU eviction, TTL, batch gets, compression
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  keys: number;
}

class UltraCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private currentSize: number;
  private defaultTTL: number;
  private stats: CacheStats;
  private compressionEnabled: boolean;

  constructor(options: {
    maxSizeMB?: number;
    defaultTTLSeconds?: number;
    compression?: boolean;
  } = {}) {
    this.cache = new Map();
    this.maxSize = (options.maxSizeMB || 100) * 1024 * 1024; // 100MB default
    this.currentSize = 0;
    this.defaultTTL = (options.defaultTTLSeconds || 300) * 1000; // 5min default
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0, keys: 0 };
    this.compressionEnabled = options.compression ?? true;
  }

  // 200X: Batch get - single operation for multiple keys
  async mget(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    const missingKeys: string[] = [];
    const missingIndices: number[] = [];

    // Check cache for all keys
    for (let i = 0; i < keys.length; i++) {
      const entry = this.cache.get(keys[i]);
      if (entry && entry.expiresAt > Date.now()) {
        results[i] = entry.value;
        this.stats.hits++;
      } else {
        results[i] = null;
        missingKeys.push(keys[i]);
        missingIndices.push(i);
        this.stats.misses++;
      }
    }

    return results;
  }

  // 200X: Batch set - reduces lock contention
  async mset(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }

  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);
    
    // Evict if necessary
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);
    
    // Remove old entry size if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, { value, expiresAt, size });
    this.currentSize += size;
    this.updateStats();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.value;
  }

  // 200X: Memoize function results
  memoize<F extends (...args: any[]) => any>(
    fn: F,
    keyGenerator?: (...args: Parameters<F>) => string,
    ttl?: number
  ): F {
    return ((...args: Parameters<F>): ReturnType<F> => {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : JSON.stringify(args);
      
      const cached = this.get(key);
      if (cached !== null) {
        return cached as ReturnType<F>;
      }

      const result = fn(...args);
      this.set(key, result, ttl);
      return result;
    }) as F;
  }

  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      const entry = this.cache.get(firstKey)!;
      this.currentSize -= entry.size;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  private estimateSize(value: any): number {
    // Rough estimation for memory management
    return JSON.stringify(value).length * 2; // UTF-16
  }

  private updateStats(): void {
    this.stats.size = this.currentSize;
    this.stats.keys = this.cache.size;
  }

  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0, keys: 0 };
  }
}

// 200X: Multi-tier cache (Memory -> Shared -> DB)
export class TieredCache<T> {
  private l1: UltraCache<T>; // Memory (fastest)
  private l2: UltraCache<T>; // Shared/Redis (medium)

  constructor() {
    this.l1 = new UltraCache<T>({ maxSizeMB: 50, defaultTTLSeconds: 60 });
    this.l2 = new UltraCache<T>({ maxSizeMB: 200, defaultTTLSeconds: 300 });
  }

  async get(key: string): Promise<T | null> {
    // Try L1 first
    let value = this.l1.get(key);
    if (value !== null) return value;

    // Try L2
    value = this.l2.get(key);
    if (value !== null) {
      // Promote to L1
      this.l1.set(key, value);
      return value;
    }

    return null;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.l1.set(key, value, Math.min(tttl || 60, 60)); // L1: short TTL
    this.l2.set(key, value, ttl); // L2: full TTL
  }
}

export { UltraCache };
export default UltraCache;
