/**
 * 200X Builder - API Rate Limiting Middleware
 * Enhanced rate limiting for serverless functions
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

import { base44 } from '@base44/sdk';

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Default limits
  default: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100          // 100 requests per minute
  },
  
  // Strict limits for expensive operations
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 20
  },
  
  // Lenient limits for public endpoints
  public: {
    windowMs: 60 * 1000,
    maxRequests: 200
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 10           // 10 login attempts per minute
  }
};

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

/**
 * Clean up old entries periodically
 */
const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupOldEntries, 5 * 60 * 1000);

/**
 * Generate rate limit key
 */
const generateKey = (identifier, route) => {
  return `${identifier}:${route}`;
};

/**
 * Check if request is rate limited
 */
export const checkRateLimit = (identifier, route, configKey = 'default') => {
  const config = RATE_LIMIT_CONFIG[configKey] || RATE_LIMIT_CONFIG.default;
  const key = generateKey(identifier, route);
  const now = Date.now();
  
  let data = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!data || now - data.windowStart > config.windowMs) {
    data = {
      windowStart: now,
      windowMs: config.windowMs,
      requests: 0,
      limited: false
    };
  }
  
  // Check if limit exceeded
  if (data.requests >= config.maxRequests) {
    data.limited = true;
    rateLimitStore.set(key, data);
    
    return {
      limited: true,
      remaining: 0,
      resetTime: data.windowStart + config.windowMs,
      retryAfter: Math.ceil((data.windowStart + config.windowMs - now) / 1000)
    };
  }
  
  // Increment request count
  data.requests++;
  rateLimitStore.set(key, data);
  
  return {
    limited: false,
    remaining: config.maxRequests - data.requests,
    resetTime: data.windowStart + config.windowMs,
    limit: config.maxRequests
  };
};

/**
 * Rate limiting middleware for serverless functions
 */
export const rateLimitMiddleware = (handler, options = {}) => {
  const {
    configKey = 'default',
    identifierExtractor = null,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached = null
  } = options;
  
  return async (event, context) => {
    try {
      // Extract identifier (IP, user ID, API key, etc.)
      let identifier;
      
      if (identifierExtractor) {
        identifier = await identifierExtractor(event);
      } else {
        // Default: use IP + user agent hash
        const ip = event.headers['x-forwarded-for'] || 
                   event.headers['x-nf-client-connection-ip'] || 
                   'unknown';
        const userAgent = event.headers['user-agent'] || 'unknown';
        identifier = `${ip}:${userAgent}`;
      }
      
      const route = event.path || event.httpPath || 'unknown';
      
      // Check rate limit
      const result = checkRateLimit(identifier, route, configKey);
      
      if (result.limited) {
        // Log rate limit hit
        await logRateLimitHit(identifier, route, result);
        
        // Custom handler
        if (onLimitReached) {
          return onLimitReached(result, event, context);
        }
        
        // Default response
        return {
          statusCode: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
            'Retry-After': result.retryAfter.toString()
          },
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Please retry after ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
            limit: result.limit
          })
        };
      }
      
      // Execute handler
      const response = await handler(event, context);
      
      // Add rate limit headers to successful response
      if (response && typeof response === 'object') {
        response.headers = {
          ...response.headers,
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Fall through to handler on middleware error
      return handler(event, context);
    }
  };
};

/**
 * Log rate limit violations
 */
const logRateLimitHit = async (identifier, route, result) => {
  try {
    // Log to error tracking
    await base44.entities.ErrorLog.insert({
      error_type: 'api',
      severity: 'warning',
      message: `Rate limit exceeded for ${identifier} on ${route}`,
      metadata: {
        identifier,
        route,
        retryAfter: result.retryAfter,
        limit: result.limit
      },
      status: 'new',
      occurrence_count: 1,
      first_occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to log rate limit hit:', e);
  }
};

/**
 * Get rate limit status for an identifier
 */
export const getRateLimitStatus = (identifier, route, configKey = 'default') => {
  const config = RATE_LIMIT_CONFIG[configKey] || RATE_LIMIT_CONFIG.default;
  const key = generateKey(identifier, route);
  const data = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!data || now - data.windowStart > config.windowMs) {
    return {
      limited: false,
      remaining: config.maxRequests,
      limit: config.maxRequests,
      windowMs: config.windowMs
    };
  }
  
  return {
    limited: data.limited,
    remaining: Math.max(0, config.maxRequests - data.requests),
    limit: config.maxRequests,
    resetTime: data.windowStart + config.windowMs,
    windowMs: config.windowMs
  };
};

/**
 * Reset rate limit for an identifier
 */
export const resetRateLimit = (identifier, route) => {
  const key = generateKey(identifier, route);
  rateLimitStore.delete(key);
};

/**
 * Create identifier from request context
 */
export const createIdentifier = (event, type = 'ip') => {
  switch (type) {
    case 'ip':
      return event.headers['x-forwarded-for'] || 
             event.headers['x-nf-client-connection-ip'] || 
             'unknown';
    
    case 'user':
      return event.user?.id || event.context?.userId || 'anonymous';
    
    case 'apikey':
      return event.headers['x-api-key'] || 'no-api-key';
    
    case 'composite':
      const ip = event.headers['x-forwarded-for'] || 'unknown';
      const userId = event.user?.id || 'anon';
      return `${ip}:${userId}`;
    
    default:
      return 'unknown';
  }
};

export default {
  checkRateLimit,
  rateLimitMiddleware,
  getRateLimitStatus,
  resetRateLimit,
  createIdentifier,
  RATE_LIMIT_CONFIG
};
