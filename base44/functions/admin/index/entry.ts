/**
 * Admin Functions Index
 * 
 * Central export point for all admin-related functions
 */

// Error Tracking
export {
  logError,
  configureErrorTracking,
  withErrorTracking,
  trackPromiseRejection,
  errorBoundary,
  getErrorStats,
  clearOldErrors,
  ErrorSeverity,
  ErrorCategory,
} from './logError.ts';

// Alert System
export {
  sendAlert,
  checkErrorRate,
  checkApiHealth,
  acknowledgeAlert,
  resolveAlert,
  getAlertHistory,
  AlertChannel,
  AlertSeverity,
  AlertStatus,
} from './sendAlert.ts';
