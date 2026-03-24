import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  EXTERNAL_API = 'external_api',
  PAYMENT = 'payment',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

// Error log entry interface
interface ErrorLogEntry {
  error_type: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack_trace?: string;
  context?: {
    url?: string;
    method?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  metadata?: Record<string, unknown>;
  source?: string;
  tags?: string[];
}

// Error tracking configuration
interface ErrorTrackingConfig {
  environment: string;
  release: string;
  serverName: string;
  captureUnhandled: boolean;
  captureRejections: boolean;
  sampleRate: number;
  beforeSend?: (event: ErrorLogEntry) => ErrorLogEntry | null;
}

// Default configuration
const DEFAULT_CONFIG: ErrorTrackingConfig = {
  environment: Deno.env.get('NODE_ENV') || 'development',
  release: Deno.env.get('APP_VERSION') || 'unknown',
  serverName: Deno.env.get('DENO_REGION') || 'unknown',
  captureUnhandled: true,
  captureRejections: true,
  sampleRate: 1.0,
};

let globalConfig: ErrorTrackingConfig = DEFAULT_CONFIG;

// Error patterns for categorization
const ERROR_PATTERNS: { pattern: RegExp; category: ErrorCategory }[] = [
  { pattern: /auth|token|jwt|session|login|logout/i, category: ErrorCategory.AUTHENTICATION },
  { pattern: /permission|forbidden|unauthorized|access/i, category: ErrorCategory.AUTHORIZATION },
  { pattern: /validation|invalid|required|schema|zod/i, category: ErrorCategory.VALIDATION },
  { pattern: /database|db|mongo|postgres|sql|connection/i, category: ErrorCategory.DATABASE },
  { pattern: /network|fetch|timeout|ECONNREFUSED/i, category: ErrorCategory.NETWORK },
  { pattern: /stripe|payment|charge|card|billing/i, category: ErrorCategory.PAYMENT },
  { pattern: /rate.*limit|too.*many.*requests/i, category: ErrorCategory.RATE_LIMIT },
  { pattern: /api|webhook|integration|third.*party/i, category: ErrorCategory.EXTERNAL_API },
];

// Categorize error based on message and stack trace
function categorizeError(error: Error): ErrorCategory {
  const textToCheck = `${error.message} ${error.stack || ''}`;
  
  for (const { pattern, category } of ERROR_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return category;
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

// Determine severity based on error characteristics
function determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
  // Critical errors
  if (
    error.message.includes('CRITICAL') ||
    error.message.includes('FATAL') ||
    category === ErrorCategory.PAYMENT ||
    (category === ErrorCategory.DATABASE && error.message.includes('connection'))
  ) {
    return ErrorSeverity.CRITICAL;
  }
  
  // High severity
  if (
    category === ErrorCategory.AUTHENTICATION ||
    category === ErrorCategory.DATABASE ||
    error.message.includes('unhandled') ||
    error.message.includes('unreachable')
  ) {
    return ErrorSeverity.HIGH;
  }
  
  // Low severity
  if (
    category === ErrorCategory.VALIDATION ||
    category === ErrorCategory.RATE_LIMIT
  ) {
    return ErrorSeverity.LOW;
  }
  
  return ErrorSeverity.MEDIUM;
}

// Configure error tracking
export function configureErrorTracking(config: Partial<ErrorTrackingConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

// Get current timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Extract relevant stack trace lines
function formatStackTrace(stack?: string): string | undefined {
  if (!stack) return undefined;
  
  // Limit stack trace to first 20 lines
  const lines = stack.split('\n').slice(0, 20);
  return lines.join('\n');
}

// Main error logging function
export async function logError(
  error: Error | string,
  options: Partial<ErrorLogEntry> = {},
  req?: Request
): Promise<{ success: boolean; id?: string }> {
  try {
    // Apply sampling
    if (Math.random() > globalConfig.sampleRate) {
      return { success: true };
    }
    
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const category = options.category || categorizeError(errorObj);
    const severity = options.severity || determineSeverity(errorObj, category);
    
    // Build context from request if provided
    let context: ErrorLogEntry['context'] = options.context;
    if (req && !context) {
      const url = new URL(req.url);
      context = {
        url: req.url,
        method: req.method,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        requestId: req.headers.get('x-request-id') || undefined,
      };
      
      // Try to get user ID from auth header
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(atob(token.split('.')[1]));
          context.userId = payload.sub || payload.user_id;
        } catch {
          // Invalid token, ignore
        }
      }
    }
    
    const errorEntry: ErrorLogEntry = {
      error_type: options.error_type || errorObj.name || 'Error',
      category,
      severity,
      message: errorObj.message,
      stack_trace: formatStackTrace(errorObj.stack),
      context,
      metadata: {
        ...options.metadata,
        environment: globalConfig.environment,
        release: globalConfig.release,
        serverName: globalConfig.serverName,
        timestamp: getTimestamp(),
      },
      source: options.source || 'server',
      tags: options.tags || [],
    };
    
    // Apply beforeSend hook
    if (globalConfig.beforeSend) {
      const modified = globalConfig.beforeSend(errorEntry);
      if (!modified) {
        return { success: true }; // Filtered out
      }
    }
    
    // Log to console
    console.error('[ERROR TRACKING]', JSON.stringify(errorEntry));
    
    // Store in database if request is available
    if (req) {
      try {
        const base44 = createClientFromRequest(req);
        const result = await base44.asServiceRole.entities.ErrorLog.create({
          error_type: errorEntry.error_type,
          category: errorEntry.category,
          severity: errorEntry.severity,
          message: errorEntry.message,
          stack_trace: errorEntry.stack_trace,
          context: errorEntry.context,
          metadata: errorEntry.metadata,
          source: errorEntry.source,
          tags: errorEntry.tags,
        });
        
        // Send alert for critical errors
        if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
          await sendErrorAlert(errorEntry, result._id);
        }
        
        return { success: true, id: result._id };
      } catch (dbError) {
        console.error('Failed to store error in database:', dbError);
      }
    }
    
    return { success: true };
  } catch (trackingError) {
    console.error('Error tracking failed:', trackingError);
    return { success: false };
  }
}

// Send alert for critical/high severity errors
async function sendErrorAlert(errorEntry: ErrorLogEntry, errorId: string): Promise<void> {
  try {
    const alertData = {
      type: 'error_alert',
      severity: errorEntry.severity,
      category: errorEntry.category,
      message: errorEntry.message,
      errorId,
      timestamp: getTimestamp(),
      context: errorEntry.context,
    };
    
    // Trigger alert function
    await fetch(`${Deno.env.get('APP_URL')}/.netlify/functions/admin/sendAlert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
  } catch (alertError) {
    console.error('Failed to send error alert:', alertError);
  }
}

// Create wrapped handler with error tracking
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<ErrorLogEntry> = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Find request in arguments
      const req = args.find(arg => arg instanceof Request) as Request | undefined;
      await logError(error as Error, options, req);
      throw error;
    }
  }) as T;
}

// Track promise rejection
export function trackPromiseRejection<T>(
  promise: Promise<T>,
  options: Partial<ErrorLogEntry> = {}
): Promise<T> {
  return promise.catch(async (error) => {
    await logError(error, { ...options, source: 'promise_rejection' });
    throw error;
  });
}

// Error boundary for async operations
export async function errorBoundary<T>(
  operation: () => Promise<T>,
  fallback?: T,
  options: Partial<ErrorLogEntry> = {},
  req?: Request
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    await logError(error as Error, options, req);
    return fallback;
  }
}

// Get error statistics
export async function getErrorStats(
  req: Request,
  options: {
    startDate?: Date;
    endDate?: Date;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
  } = {}
): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byDay: Record<string, number>;
  topErrors: Array<{ type: string; count: number }>;
}> {
  try {
    const base44 = createClientFromRequest(req);
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (options.category) filter.category = options.category;
    if (options.severity) filter.severity = options.severity;
    
    // Fetch errors
    const errors = await base44.asServiceRole.entities.ErrorLog.filter(filter, {
      sort: { field: 'created_at', direction: 'desc' },
      limit: 1000,
    });
    
    // Calculate stats
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};
    
    for (const error of errors) {
      // Category count
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      
      // Severity count
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // Daily count
      const day = new Date(error.created_at).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
      
      // Error type count
      errorCounts[error.error_type] = (errorCounts[error.error_type] || 0) + 1;
    }
    
    // Get top errors
    const topErrors = Object.entries(errorCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      total: errors.length,
      byCategory,
      bySeverity,
      byDay,
      topErrors,
    };
  } catch (error) {
    console.error('Failed to get error stats:', error);
    throw error;
  }
}

// Clear old errors (for log rotation)
export async function clearOldErrors(
  req: Request,
  olderThanDays: number = 30
): Promise<{ deleted: number }> {
  try {
    const base44 = createClientFromRequest(req);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Note: This assumes your database supports this type of query
    // You may need to adjust based on your actual database
    const oldErrors = await base44.asServiceRole.entities.ErrorLog.filter({
      created_at: { $lt: cutoffDate.toISOString() },
    });
    
    // Delete old errors
    let deleted = 0;
    for (const error of oldErrors) {
      await base44.asServiceRole.entities.ErrorLog.delete(error._id);
      deleted++;
    }
    
    return { deleted };
  } catch (error) {
    console.error('Failed to clear old errors:', error);
    throw error;
  }
}