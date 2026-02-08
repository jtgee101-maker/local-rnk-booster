/**
 * Error Logging Utility - Quick Add
 * Helper to add error logging to any function
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

interface ErrorContext {
  functionName: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log error with automatic context
 */
export async function logFunctionError(
  error: Error,
  req: Request,
  context: ErrorContext
): Promise<void> {
  try {
    const base44 = createClientFromRequest(req);
    
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: error.name || 'Error',
      message: error.message,
      stack_trace: error.stack?.substring(0, 1000),
      source: context.functionName,
      metadata: {
        ...context.metadata,
        user_id: context.userId,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

/**
 * Wrapper for try-catch with logging
 */
export async function withErrorLogging<T>(
  fn: () => Promise<T>,
  req: Request,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await logFunctionError(error as Error, req, context);
    throw error;
  }
}
