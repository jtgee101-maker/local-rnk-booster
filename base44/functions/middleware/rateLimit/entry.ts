import { createClient } from 'npm:@base44/sdk@0.8.6';

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

// Default configurations
const DEFAULT_IP_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'ratelimit:ip:'
};

const DEFAULT_USER_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200,
  keyPrefix: 'ratelimit:user:'
};

// Stricter limits for expensive operations
const EXPENSIVE_ENDPOINTS: Record<string, RateLimitConfig> = {
  '/api/analyze': { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'ratelimit:analyze:' },
  '/api/generate-pdf': { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'ratelimit:pdf:' },
  '/api/broadcast': { windowMs: 60 * 1000, maxRequests: 3, keyPrefix: 'ratelimit:broadcast:' },
  '/api/enhanced-gmb': { windowMs: 60 * 1000, maxRequests: 8, keyPrefix: 'ratelimit:gmb:' },
};

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

function getClientIP(req: Request): string {
  // Get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || 
         realIP || 
         (forwarded ? forwarded.split(',')[0].trim() : null) || 
         'unknown';
}

function getUserId(req: Request): string | null {
  // Extract user ID from JWT token if present
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.substring(7);
    // Basic JWT decode (payload only, no verification here)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const fullKey = `${config.keyPrefix}${key}`;
  const data = rateLimitStore.get(fullKey);
  
  if (!data || data.resetTime <= now) {
    // First request or window expired
    rateLimitStore.set(fullKey, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (data.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: data.resetTime
    };
  }
  
  data.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - data.count,
    resetTime: data.resetTime
  };
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function rateLimit(req: Request, endpoint?: string): RateLimitResult {
  const clientIP = getClientIP(req);
  const userId = getUserId(req);
  
  // Check endpoint-specific limits first
  if (endpoint && EXPENSIVE_ENDPOINTS[endpoint]) {
    const config = EXPENSIVE_ENDPOINTS[endpoint];
    const key = userId ? `${clientIP}:${userId}` : clientIP;
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: result.resetTime,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      };
    }
  }
  
  // Check per-user limit if authenticated
  if (userId) {
    const userResult = checkRateLimit(userId, DEFAULT_USER_LIMIT);
    if (!userResult.allowed) {
      return {
        allowed: false,
        limit: DEFAULT_USER_LIMIT.maxRequests,
        remaining: 0,
        resetTime: userResult.resetTime,
        retryAfter: Math.ceil((userResult.resetTime - Date.now()) / 1000)
      };
    }
  }
  
  // Check per-IP limit
  const ipResult = checkRateLimit(clientIP, DEFAULT_IP_LIMIT);
  
  return {
    allowed: ipResult.allowed,
    limit: DEFAULT_IP_LIMIT.maxRequests,
    remaining: ipResult.remaining,
    resetTime: ipResult.resetTime,
    retryAfter: ipResult.allowed ? undefined : Math.ceil((ipResult.resetTime - Date.now()) / 1000)
  };
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        'Retry-After': result.retryAfter?.toString() || '60'
      }
    }
  );
}

export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
}

// Main middleware handler for Deno
export default async function rateLimitMiddleware(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const result = rateLimit(req, url.pathname);
  
  if (!result.allowed) {
    return createRateLimitResponse(result);
  }
  
  return null; // Continue to next middleware
}