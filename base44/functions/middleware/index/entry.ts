/**
 * Security & Monitoring Middleware Index
 * 
 * Central export point for all middleware modules
 */

// Rate Limiting
export { 
  rateLimit, 
  createRateLimitResponse, 
  addRateLimitHeaders,
  type RateLimitResult 
} from './rateLimit.ts';

// Validation
export {
  schemas,
  validateRequest,
  validateBody,
  validateQueryParams,
  sanitizeObject,
  createValidationErrorResponse,
  type ValidationOptions,
} from './validation.ts';

// Authentication & RBAC
export {
  authenticate,
  generateTokens,
  refreshAccessToken,
  revokeToken,
  revokeAllUserSessions,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  createAuthMiddleware,
  UserRole,
  Permission,
  type AuthContext,
} from './auth.ts';

// Security Headers & CORS
export {
  securityMiddleware,
  applySecurityHeaders,
  addCORSHeaders,
  secureResponse,
  type SecurityConfig,
} from './security.ts';

// Request Logging
export {
  loggerMiddleware,
  logRequest,
  createRequestContext,
  logRequestStart,
  logRequestComplete,
  generateRequestId,
  logger,
  trackPerformance,
  LogLevel,
  type RequestContext,
  type LogEntry,
} from './logger.ts';

// Combined middleware helper
export async function applyAllMiddleware(
  req: Request,
  options: {
    skipAuth?: boolean;
    skipRateLimit?: boolean;
    skipValidation?: boolean;
    authOptions?: { requiredPermission?: string; requiredRole?: string };
    validationOptions?: Parameters<typeof validateRequest>[1];
  } = {}
): Promise<
  | { success: true; user?: AuthContext; data?: { body?: unknown; query?: unknown } }
  | { success: false; response: Response }
> {
  // 1. Security headers & CORS
  const securityResponse = securityMiddleware(req);
  if (securityResponse) {
    return { success: false, response: securityResponse };
  }

  // 2. Rate limiting
  if (!options.skipRateLimit) {
    const { rateLimit } = await import('./rateLimit.ts');
    const rateLimitResult = rateLimit(req);
    if (!rateLimitResult.allowed) {
      const { createRateLimitResponse } = await import('./rateLimit.ts');
      return { 
        success: false, 
        response: createRateLimitResponse(rateLimitResult) 
      };
    }
  }

  // 3. Validation
  let validatedData: { body?: unknown; query?: unknown } | undefined;
  if (!options.skipValidation && options.validationOptions) {
    const { validateRequest } = await import('./validation.ts');
    const validationResult = await validateRequest(req, options.validationOptions);
    if (!validationResult.success) {
      return { success: false, response: validationResult.response };
    }
    validatedData = validationResult.data;
  }

  // 4. Authentication
  let authContext: AuthContext | undefined;
  if (!options.skipAuth) {
    const { authenticate } = await import('./auth.ts');
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return { success: false, response: authResult.response };
    }
    authContext = authResult.user;

    // Check permissions if specified
    if (options.authOptions?.requiredPermission) {
      const { hasPermission } = await import('./auth.ts');
      if (!hasPermission(authContext, options.authOptions.requiredPermission as any)) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: 'Forbidden', message: 'Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          ),
        };
      }
    }

    // Check role if specified
    if (options.authOptions?.requiredRole) {
      const { hasRole, UserRole } = await import('./auth.ts');
      if (!hasRole(authContext, options.authOptions.requiredRole as any)) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: 'Forbidden', message: 'Insufficient role' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          ),
        };
      }
    }
  }

  return {
    success: true,
    user: authContext,
    data: validatedData,
  };
}

// Import types for the combined middleware
import type { AuthContext } from './auth.ts';
import { validateRequest } from './validation.ts';