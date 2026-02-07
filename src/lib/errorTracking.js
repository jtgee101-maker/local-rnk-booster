/**
 * Error Tracking Module
 * Captures and reports errors for monitoring
 */

const ERROR_ENDPOINT = '/api/errors/log';

export class ErrorTracker {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0, // Report 100% of errors
      environment: import.meta.env.MODE || 'development',
      ...config
    };
    
    this.init();
  }

  init() {
    if (!this.config.enabled) return;

    // Capture global errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error, {
        type: 'uncaught',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        type: 'unhandledrejection'
      });
    });

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureMessage(args.join(' '), 'error');
      originalConsoleError.apply(console, args);
    };
  }

  captureException(error, context = {}) {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate) return;

    const errorData = {
      type: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        environment: this.config.environment
      }
    };

    this.sendError(errorData);
  }

  captureMessage(message, level = 'info') {
    if (!this.config.enabled) return;

    const errorData = {
      type: 'message',
      message,
      level,
      context: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        environment: this.config.environment
      }
    };

    this.sendError(errorData);
  }

  async sendError(errorData) {
    try {
      // Send to backend
      await fetch(ERROR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (e) {
      // Fallback: log to console if send fails
      console.warn('Failed to send error:', e);
    }
  }
}

// Singleton instance
let errorTracker = null;

export function initErrorTracking(config) {
  if (!errorTracker) {
    errorTracker = new ErrorTracker(config);
  }
  return errorTracker;
}

export function captureException(error, context) {
  errorTracker?.captureException(error, context);
}

export function captureMessage(message, level) {
  errorTracker?.captureMessage(message, level);
}

export default ErrorTracker;
