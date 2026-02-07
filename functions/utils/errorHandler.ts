/**
 * Error Handler Utility for Netlify Functions
 * Standardizes error responses across all functions
 */

export class FunctionError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorCodes = {
  BAD_REQUEST: { code: 'BAD_REQUEST', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503 },
};

export function handleError(error) {
  console.error('Function error:', error);

  if (error instanceof FunctionError) {
    return {
      statusCode: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Generic error response
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    }),
  };
}

export function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
  };
}

// Wrapper for handler functions
export function withErrorHandler(handler) {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Validation helper
export function validateRequired(body, fields) {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    throw new FunctionError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'BAD_REQUEST'
    );
  }
}

// Rate limit check helper
export function checkRateLimit(ip, requests, windowMs = 60000, maxRequests = 100) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const recentRequests = requests.filter(req => req.timestamp > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    throw new FunctionError(
      'Rate limit exceeded. Please try again later.',
      429,
      'RATE_LIMITED'
    );
  }
  
  return recentRequests;
}
