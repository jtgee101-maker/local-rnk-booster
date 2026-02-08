/**
 * 200X Rate Limiter - Token bucket algorithm
 * Prevents API abuse, enables fair usage
 */

interface RateLimitOptions {
  tokensPerInterval: number;
  interval: number; // milliseconds
  maxTokens?: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      maxTokens: options.tokensPerInterval,
      keyPrefix: 'rl:',
      ...options
    };
  }

  /**
   * Check if request is allowed
   */
  async check(key: string): Promise<RateLimitResult> {
    const bucketKey = `${this.options.keyPrefix}${key}`;
    const now = Date.now();

    // Get or create bucket
    let bucket = this.buckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        tokens: this.options.maxTokens!,
        lastRefill: now
      };
      this.buckets.set(bucketKey, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / this.options.interval) * this.options.tokensPerInterval
    );

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        bucket.tokens + tokensToAdd,
        this.options.maxTokens!
      );
      bucket.lastRefill = now;
    }

    // Check if request can be processed
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: bucket.lastRefill + this.options.interval
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil(
      (1 / this.options.tokensPerInterval) * this.options.interval
    );

    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.lastRefill + this.options.interval,
      retryAfter
    };
  }

  /**
   * Middleware for API routes
   */
  async middleware(
    identifier: string,
    options?: { onReject?: () => void }
  ): Promise<boolean> {
    const result = await this.check(identifier);
    
    if (!result.allowed) {
      options?.onReject?.();
      return false;
    }
    
    return true;
  }

  /**
   * Get current bucket state
   */
  getBucketState(key: string): { tokens: number; resetTime: number } | null {
    const bucket = this.buckets.get(`${this.options.keyPrefix}${key}`);
    if (!bucket) return null;

    return {
      tokens: bucket.tokens,
      resetTime: bucket.lastRefill + this.options.interval
    };
  }

  /**
   * Reset bucket for a key
   */
  reset(key: string): void {
    this.buckets.delete(`${this.options.keyPrefix}${key}`);
  }

  /**
   * Cleanup old buckets
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}

// 200X: Multi-tier rate limiting
export class TieredRateLimiter {
  private tiers: Map<string, RateLimiter> = new Map();

  addTier(name: string, limiter: RateLimiter): void {
    this.tiers.set(name, limiter);
  }

  async check(key: string, tierName: string): Promise<RateLimitResult> {
    const limiter = this.tiers.get(tierName);
    if (!limiter) {
      return { allowed: true, remaining: Infinity, resetTime: Date.now() };
    }
    return limiter.check(`${tierName}:${key}`);
  }

  async checkAll(key: string): Promise<{ [tier: string]: RateLimitResult }> {
    const results: { [tier: string]: RateLimitResult } = {};
    
    for (const [name, limiter] of this.tiers.entries()) {
      results[name] = await limiter.check(`${name}:${key}`);
    }
    
    return results;
  }
}

// Preset rate limiters
export const presets = {
  // API: 100 requests per minute
  api: new RateLimiter({
    tokensPerInterval: 100,
    interval: 60000
  }),

  // Strict: 10 requests per minute
  strict: new RateLimiter({
    tokensPerInterval: 10,
    interval: 60000
  }),

  // Generous: 1000 requests per minute
  generous: new RateLimiter({
    tokensPerInterval: 1000,
    interval: 60000
  }),

  // Burst: 100 requests per second
  burst: new RateLimiter({
    tokensPerInterval: 100,
    interval: 1000
  })
};

export default RateLimiter;
