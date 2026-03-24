/**
 * Centralized error logging for all functions
 * Logs errors to ErrorLog entity for admin monitoring
 */

export const logError = async (base44, errorDetails) => {
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

export const handleFunctionError = (error, context = {}) => {
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