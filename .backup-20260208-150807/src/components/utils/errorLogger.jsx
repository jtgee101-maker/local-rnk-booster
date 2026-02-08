import { base44 } from '@/api/base44Client';

/**
 * Log errors to the ErrorLog entity for monitoring
 */
export async function logError({
  errorType,
  severity = 'medium',
  message,
  stackTrace = null,
  metadata = {}
}) {
  try {
    await base44.entities.ErrorLog.create({
      error_type: errorType,
      severity,
      message,
      stack_trace: stackTrace,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator?.userAgent,
        page_url: window?.location?.href
      },
      resolved: false
    });
  } catch (error) {
    // Fail silently - don't break the app if logging fails
    console.error('Failed to log error:', error);
  }
}

/**
 * Log specific error types with proper categorization
 */
export const errorLogger = {
  // Google Maps API errors
  mapsError: (error, context = {}) => 
    logError({
      errorType: 'integration_error',
      severity: 'high',
      message: `Google Maps Error: ${error.message || error}`,
      stackTrace: error.stack,
      metadata: { 
        service: 'google_maps',
        ...context 
      }
    }),
  
  // Payment/Stripe errors
  paymentError: (error, context = {}) =>
    logError({
      errorType: 'payment_failure',
      severity: 'critical',
      message: `Payment Error: ${error.message || error}`,
      stackTrace: error.stack,
      metadata: {
        service: 'stripe',
        ...context
      }
    }),
  
  // Email sending errors
  emailError: (error, context = {}) =>
    logError({
      errorType: 'email_failure',
      severity: 'high',
      message: `Email Error: ${error.message || error}`,
      stackTrace: error.stack,
      metadata: {
        service: 'email',
        ...context
      }
    }),
  
  // Form validation errors
  validationError: (error, context = {}) =>
    logError({
      errorType: 'system_error',
      severity: 'low',
      message: `Validation Error: ${error.message || error}`,
      metadata: {
        type: 'validation',
        ...context
      }
    }),
  
  // General system errors
  systemError: (error, context = {}) =>
    logError({
      errorType: 'system_error',
      severity: 'medium',
      message: `System Error: ${error.message || error}`,
      stackTrace: error.stack,
      metadata: context
    })
};