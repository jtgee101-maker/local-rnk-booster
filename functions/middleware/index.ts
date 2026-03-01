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
} from './rateLimit';

// Validation
export {
  schemas,
  validateRequest,
  validateBody,
  validateQueryParams,
  sanitizeObject,
  createValidationErrorResponse,
  type ValidationOptions,
} from './validation';

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
} from './auth';

// Security Headers & CORS
import { securityMiddleware } from './security';
export {
  securityMiddleware as exportedSecurityMiddleware,
  applySecurityHeaders,
  addCORSHeaders,
  secureResponse,
  type SecurityConfig,
} from './security';

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
} from './logger';

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
    const { rateLimit } = await import('./rateLimit');
    const rateLimitResult = rateLimit(req);
    if (!rateLimitResult.allowed) {
      const { createRateLimitResponse } = await import('./rateLimit');
      return { 
        success: false, 
        response: createRateLimitResponse(rateLimitResult) 
      };
    }
  }

  // 3. Validation
  let validatedData: { body?: unknown; query?: unknown } | undefined;
  if (!options.skipValidation && options.validationOptions) {
    const { validateRequest } = await import('./validation');
    const validationResult = await validateRequest(req, options.validationOptions);
    if (!validationResult.success) {
      return { success: false, response: (validationResult as { response: Response }).response };
    }
    validatedData = validationResult.data;
  }

  // 4. Authentication
  let authContext: AuthContext | undefined;
  if (!options.skipAuth) {
    const { authenticate } = await import('./auth');
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return { success: false, response: (authResult as { response: Response }).response };
    }
    authContext = authResult.user;

    // Check permissions if specified
    if (options.authOptions?.requiredPermission) {
      const { hasPermission } = await import('./auth');
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
      const { hasRole, UserRole } = await import('./auth');
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
import type { AuthContext } from './auth';
import { validateRequest } from './validation';