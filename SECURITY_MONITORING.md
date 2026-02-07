# API Security & Monitoring System

This document describes the comprehensive security and monitoring system implemented for the LocalRnk API.

## Table of Contents

1. [Overview](#overview)
2. [Security Middleware](#security-middleware)
3. [Rate Limiting](#rate-limiting)
4. [Authentication & RBAC](#authentication--rbac)
5. [Input Validation](#input-validation)
6. [Security Headers](#security-headers)
7. [Request Logging](#request-logging)
8. [Error Tracking](#error-tracking)
9. [Alert System](#alert-system)
10. [Health Checks](#health-checks)
11. [Monitoring Dashboard](#monitoring-dashboard)

## Overview

The security and monitoring system provides comprehensive protection and observability for the LocalRnk API:

- **Protection**: Rate limiting, input validation, authentication, security headers
- **Observability**: Request logging, error tracking, health monitoring
- **Alerting**: Real-time alerts for critical issues
- **Dashboard**: Visual monitoring interface

## Security Middleware

### Location
- `functions/middleware/rateLimit.ts`
- `functions/middleware/validation.ts`
- `functions/middleware/auth.ts`
- `functions/middleware/security.ts`
- `functions/middleware/logger.ts`
- `functions/middleware/index.ts` (combined exports)

### Usage

```typescript
import { applyAllMiddleware, schemas } from '../middleware/index.ts';

Deno.serve(async (req) => {
  // Apply all middleware at once
  const middleware = await applyAllMiddleware(req, {
    validationOptions: {
      bodySchema: schemas.createLead,
    },
    authOptions: {
      requiredPermission: Permission.WRITE_CAMPAIGNS,
    },
  });

  if (!middleware.success) {
    return middleware.response;
  }

  const { user, data } = middleware;
  // Continue with validated data and authenticated user...
});
```

## Rate Limiting

### Features
- Per-IP rate limiting (100 requests/minute)
- Per-user rate limiting (200 requests/minute for authenticated users)
- Per-endpoint limits for expensive operations
- Redis-backed storage (configurable)

### Configuration

```typescript
// Expensive endpoints with stricter limits
const EXPENSIVE_ENDPOINTS = {
  '/api/analyze': { maxRequests: 10, windowMs: 60000 },
  '/api/generate-pdf': { maxRequests: 5, windowMs: 60000 },
  '/api/broadcast': { maxRequests: 3, windowMs: 60000 },
};
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
Retry-After: 60 (when rate limited)
```

## Authentication & RBAC

### Features
- JWT token validation
- Role-based access control (RBAC)
- Permission-based access control
- Session management
- Token refresh logic

### User Roles
```typescript
enum UserRole {
  USER = 'user',
  ANALYST = 'analyst',
  MARKETER = 'marketer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

### Permissions
```typescript
enum Permission {
  READ_ANALYTICS = 'read:analytics',
  WRITE_CAMPAIGNS = 'write:campaigns',
  DELETE_CAMPAIGNS = 'delete:campaigns',
  MANAGE_USERS = 'manage:users',
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_ADMIN_PANEL = 'view:admin_panel',
  MANAGE_BILLING = 'manage:billing',
  EXPORT_DATA = 'export:data',
  SEND_BROADCASTS = 'send:broadcasts',
  MANAGE_INTEGRATIONS = 'manage:integrations',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
}
```

### Usage

```typescript
import { authenticate, requirePermission, Permission } from '../middleware/auth.ts';

// Basic authentication
const auth = await authenticate(req);
if (!auth.success) return auth.response;

// Check specific permission
const permissionCheck = await requirePermission(Permission.MANAGE_USERS)(req, auth.user);
if (permissionCheck) return permissionCheck;
```

## Input Validation

### Features
- Zod schemas for all endpoints
- XSS prevention via HTML sanitization
- Content type validation
- Payload size limits
- Query parameter validation

### Available Schemas
```typescript
import { schemas } from '../middleware/validation.ts';

// Available schemas:
// - schemas.uuid
// - schemas.email
// - schemas.phone
// - schemas.url
// - schemas.pagination
// - schemas.createLead
// - schemas.registerUser
// - schemas.login
// - schemas.createCampaign
// - schemas.analyticsQuery
```

### Usage

```typescript
import { validateRequest, schemas } from '../middleware/validation.ts';

const result = await validateRequest(req, {
  bodySchema: schemas.createLead,
  querySchema: schemas.pagination,
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
});

if (!result.success) {
  return result.response;
}

const { body, query } = result.data;
```

## Security Headers

### Implemented Headers
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Additional XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### CORS Configuration
```typescript
const corsConfig = {
  allowedOrigins: ['https://localrank.ai', 'https://app.localrank.ai'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowCredentials: true,
  maxAge: 86400,
};
```

## Request Logging

### Features
- Structured JSON logging
- Request ID tracking
- Performance metrics
- User attribution
- Automatic log rotation

### Log Format
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "requestId": "1234567890",
  "method": "POST",
  "path": "/api/leads",
  "ip": "192.168.1.1",
  "userId": "user_123",
  "statusCode": 200,
  "duration": 150,
  "requestSize": 1024,
  "responseSize": 2048
}
```

### Usage

```typescript
import { loggerMiddleware, logger } from '../middleware/logger.ts';

Deno.serve(async (req) => {
  return loggerMiddleware(req, async (req) => {
    // Your handler logic
    return new Response('OK');
  });
});

// Manual logging
logger.info('Operation completed', { operation: 'sync', duration: 100 });
logger.error('Operation failed', error, { context: 'database' });
```

## Error Tracking

### Location
- `functions/admin/logError.ts`

### Features
- Automatic error categorization
- Severity detection
- Stack trace capture
- Context preservation
- Alert triggering for critical errors

### Error Categories
- AUTHENTICATION
- AUTHORIZATION
- VALIDATION
- DATABASE
- NETWORK
- EXTERNAL_API
- PAYMENT
- RATE_LIMIT
- SERVER
- UNKNOWN

### Usage

```typescript
import { logError, withErrorTracking, ErrorSeverity } from '../admin/logError.ts';

// Manual error logging
try {
  await riskyOperation();
} catch (error) {
  await logError(error, {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
  }, req);
}

// Wrap function with automatic error tracking
const safeFunction = withErrorTracking(riskyFunction, {
  source: 'payment_processor',
});

// Error boundary
const result = await errorBoundary(
  () => riskyOperation(),
  defaultValue,
  { category: ErrorCategory.EXTERNAL_API }
);
```

## Alert System

### Location
- `functions/admin/sendAlert.ts`

### Features
- Multi-channel alerts (Email, SMS, Slack, Discord, Webhook)
- Configurable thresholds
- Alert deduplication
- Cooldown periods
- Acknowledgment workflow

### Alert Channels
```typescript
enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
  WEBHOOK = 'webhook',
}
```

### Usage

```typescript
import { sendAlert, AlertSeverity, AlertChannel } from '../admin/sendAlert.ts';

await sendAlert({
  type: 'error_rate_threshold',
  severity: AlertSeverity.CRITICAL,
  title: 'High Error Rate Detected',
  message: 'Error rate is 15% (150 errors out of 1000 requests)',
  details: { errorRate: 15, threshold: 5 },
  channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
  recipients: ['admin@localrank.ai'],
}, req);
```

## Health Checks

### Location
- `functions/health.ts`

### Features
- Database connection check
- External API health (Stripe, Google Maps, Email)
- Memory usage monitoring
- Response time benchmarks
- Health history tracking

### Endpoints
- `GET /.netlify/functions/health` - Current health status
- `GET /.netlify/functions/health/history` - Health history

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 50,
      "message": "Database connection OK"
    }
  ],
  "summary": {
    "total": 6,
    "healthy": 6,
    "degraded": 0,
    "unhealthy": 0
  }
}
```

## Monitoring Dashboard

### Location
- `src/pages/admin/Monitoring.jsx`

### Features
- Real-time API request volume chart
- Error rate visualization
- Response time percentiles (p50, p95, p99)
- Error distribution by category
- Live error log viewer
- Alert management
- Health check status
- Auto-refresh capability

### Access
Navigate to `/monitoring` in the admin panel to access the dashboard.

### Dashboard Sections

1. **Overview Tab**
   - Request volume over time
   - Response time trends
   - Error distribution pie chart
   - Response time percentiles

2. **Errors Tab**
   - Filterable error log list
   - Expandable error details
   - Stack trace viewer

3. **Alerts Tab**
   - Active and historical alerts
   - Acknowledgment actions
   - Severity filtering

4. **Health Tab**
   - Component health status
   - Response time for each check
   - Environment information

## Environment Variables

Required environment variables:

```bash
# Authentication
JWT_SECRET=your-secret-key

# External Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# App Configuration
APP_URL=https://localrank.ai
APP_VERSION=1.0.0
NODE_ENV=production
```

## Best Practices

1. **Always use middleware** for new endpoints
2. **Log all errors** with appropriate context
3. **Set up alerts** for critical business paths
4. **Monitor health checks** regularly
5. **Review error logs** weekly
6. **Set appropriate rate limits** for new endpoints
7. **Validate all inputs** using Zod schemas
8. **Use RBAC** for sensitive operations

## Integration Example

```typescript
import { applyAllMiddleware, schemas, Permission } from '../middleware/index.ts';
import { logError, ErrorCategory } from '../admin/logError.ts';

Deno.serve(async (req) => {
  // Apply security middleware
  const middleware = await applyAllMiddleware(req, {
    validationOptions: {
      bodySchema: schemas.createLead,
    },
    authOptions: {
      requiredPermission: Permission.WRITE_CAMPAIGNS,
    },
  });

  if (!middleware.success) {
    return middleware.response;
  }

  const { user, data } = middleware;

  try {
    // Your business logic
    const result = await createLead(data.body);
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    await logError(error, {
      category: ErrorCategory.DATABASE,
      context: { userId: user.userId },
    }, req);
    
    return Response.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
});
```

## Support

For issues or questions regarding the security and monitoring system:
1. Check the error logs in the Monitoring Dashboard
2. Review the health check status
3. Verify alert configurations
4. Contact the development team