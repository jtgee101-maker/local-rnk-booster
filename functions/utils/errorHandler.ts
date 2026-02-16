/**
 * Error Handler Utility for Base44 Functions
 * Standardizes error responses across all functions
 */

export class FunctionError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
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

/**
 * Handle errors and return standardized response
 * For Base44 functions (return objects)
 */
export function handleError(error: unknown): { success: false; error: string; code: string; timestamp: string } {
  console.error('Function error:', error);

  if (error instanceof FunctionError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    };
  }

  // Generic error response
  return {
    success: false,
    error: process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message 
      : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create success response
 * For Base44 functions (return objects)
 */
export function successResponse<T>(data: T, meta: Record<string, unknown> = {}): { success: true; data: T; timestamp: string } & Record<string, unknown> {
  return {
    success: true,
    data,
    ...meta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrapper for Base44 handler functions
 * Usage: export default withErrorHandler(handlerName);
 */
export function withErrorHandler<T extends Record<string, unknown>>(
  handler: (request: unknown, context: unknown) => Promise<T>
): (request: unknown, context: unknown) => Promise<T | ReturnType<typeof handleError>> {
  return async (request: unknown, context: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Wrapper for Deno.serve handlers
 * Usage: Deno.serve(withDenoErrorHandler(async (req) => { ... }));
 */
export function withDenoErrorHandler(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      console.error('Deno serve error:', error);

      const statusCode = error instanceof FunctionError ? error.statusCode : 500;
      const code = error instanceof FunctionError ? error.code : 'INTERNAL_ERROR';
      const message = error instanceof FunctionError 
        ? error.message 
        : (process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error');

      return Response.json({
        error: code,
        message,
        timestamp: new Date().toISOString(),
      }, { status: statusCode });
    }
  };
}

/**
 * Validation helper - throws FunctionError if fields missing
 */
export function validateRequired(data: Record<string, unknown>, fields: string[]): void {
  const missing = fields.filter(field => {
    const value = data?.[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new FunctionError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'BAD_REQUEST'
    );
  }
}

/**
 * Validate request body exists
 */
export function validateBody(request: { data?: unknown; body?: unknown }): unknown {
  if (!request?.data && !request?.body) {
    throw new FunctionError('Request body is required', 400, 'BAD_REQUEST');
  }
  return request.data || request.body;
}

/**
 * Validate admin access
 */
export function requireAdmin(request: { user?: { role: string } }, allowedRoles = ['admin', 'super-admin']): { role: string } {
  const user = request?.user;
  if (!user || !allowedRoles.includes(user.role)) {
    throw new FunctionError('Admin access required', 403, 'FORBIDDEN');
  }
  return user;
}

/**
 * Validate super admin access
 */
export function requireSuperAdmin(request: { user?: { role: string } }): { role: string } {
  const user = request?.user;
  if (!user || user.role !== 'super-admin') {
    throw new FunctionError('Super admin access required', 403, 'FORBIDDEN');
  }
  return user;
}

/**
 * Rate limit check helper
 */
export function checkRateLimit(
  _ip: string,
  requests: Array<{ timestamp: number }>,
  windowMs = 60000,
  maxRequests = 100
): Array<{ timestamp: number }> {
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

/**
 * Async wrapper for logging errors without throwing
 */
export async function logErrorAsync(
  base44: {
    asServiceRole?: { entities?: { ErrorLog?: { create: (data: Record<string, unknown>) => Promise<unknown> } } };
    functions?: { invoke?: (name: string, data: Record<string, unknown>) => Promise<unknown> };
  },
  errorType: string,
  message: string,
  metadata: Record<string, unknown> & { severity?: string } = {}
): Promise<void> {
  try {
    if (base44?.asServiceRole?.entities?.ErrorLog) {
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: errorType,
        severity: metadata.severity || 'medium',
        message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        resolved: false
      });
    } else if (base44?.functions?.invoke) {
      await base44.functions.invoke('logError', {
        error_type: errorType,
        severity: metadata.severity || 'medium',
        message,
        metadata
      });
    }
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}
