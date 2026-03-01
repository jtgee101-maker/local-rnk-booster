/**
 * Centralized error logging for all functions
 * Logs errors to ErrorLog entity for admin monitoring
 */

interface ErrorDetails {
  type?: string;
  severity?: string;
  message?: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

interface Base44Client {
  asServiceRole: {
    entities: {
      ErrorLog: {
        create: (data: Record<string, unknown>) => Promise<void>;
      };
    };
  };
}

export const logError = async (base44: Base44Client, errorDetails: ErrorDetails) => {
  try {
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: errorDetails.type || 'system_error',
      severity: errorDetails.severity || 'medium',
      message: errorDetails.message || 'Unknown error',
      stack_trace: errorDetails.stackTrace || null,
      metadata: errorDetails.metadata || {}
    });
  } catch (error) {
    console.error('Failed to log error to database:', error);
    console.error('Original error:', errorDetails);
  }
};

interface ErrorContext {
  functionName?: string;
  additionalContext?: Record<string, unknown>;
  errorType?: string;
}

export const handleFunctionError = (error: { message: string; stack?: string }, context: ErrorContext = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    function: context.functionName || 'unknown',
    message: error.message,
    stack: error.stack,
    context: context.additionalContext || {}
  };

  console.error(`[ERROR] ${context.functionName || 'Function'}:`, errorLog);

  return {
    message: error.message,
    type: context.errorType || 'system_error',
    logId: `${Date.now()}_${Math.random().toString(36).substring(7)}`
  };
};