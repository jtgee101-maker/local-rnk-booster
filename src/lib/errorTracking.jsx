/**
 * Error Tracking Integration for LocalRnk
 * Sentry integration with session tracking and breadcrumbs
 * 
 * Usage:
 *   import { initErrorTracking, captureError, captureMessage } from '@/lib/errorTracking';
 *   
 *   // Initialize in your app entry point
 *   initErrorTracking();
 *   
 *   // Capture errors
 *   try {
 *     riskyOperation();
 *   } catch (error) {
 *     captureError(error, { context: 'user_action' });
 *   }
 * 
 * Environment Variables:
 *   VITE_SENTRY_DSN - Sentry DSN for error tracking
 *   VITE_APP_ENV - Environment (development, staging, production)
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ErrorTracking');

// Configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'unknown';

// Session tracking
let sessionId = null;
let sessionStartTime = null;
let breadcrumbBuffer = [];
const MAX_BREADCRUMBS = 100;

/**
 * Initialize Sentry error tracking
 */
export function initErrorTracking() {
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  if (APP_ENV === 'development' && !import.meta.env.VITE_ENABLE_SENTRY_DEV) {
    logger.debug('Sentry disabled in development. Set VITE_ENABLE_SENTRY_DEV=true to enable.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    release: APP_VERSION,
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/localrnk\.com/,
          /^https:\/\/.*\.netlify\.app/,
        ],
      }),
      // Add console breadcrumbs
      new Sentry.Integrations.Breadcrumbs({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
      }),
    ],
    tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,
    sampleRate: APP_ENV === 'production' ? 1.0 : 1.0,
    
    // Before sending, add our custom context
    beforeSend: (event) => {
      // Add session info
      if (sessionId) {
        event.tags = event.tags || {};
        event.tags.session_id = sessionId;
        event.tags.session_duration_ms = sessionStartTime 
          ? Date.now() - sessionStartTime 
          : 0;
      }
      
      // Add breadcrumb buffer
      if (breadcrumbBuffer.length > 0) {
        event.breadcrumbs = [...breadcrumbBuffer, ...(event.breadcrumbs || [])];
      }
      
      return event;
    },
  });

  // Initialize session
  initSession();
  
  // Set up global error handlers
  setupGlobalHandlers();
  
  // Track performance
  trackWebVitals();
  
  console.log('[ErrorTracking] Sentry initialized successfully');
}

/**
 * Initialize user session tracking
 */
function initSession() {
  sessionId = generateSessionId();
  sessionStartTime = Date.now();
  
  Sentry.setTag('session_id', sessionId);
  
  // Set user context if available
  const user = getCurrentUser();
  if (user) {
    setUserContext(user);
  }
  
  addBreadcrumb({
    category: 'session',
    message: 'Session started',
    level: 'info',
    data: { session_id: sessionId },
  });
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current user from auth context
 */
function getCurrentUser() {
  try {
    // Try to get user from localStorage or your auth system
    const authData = localStorage.getItem('auth_user');
    return authData ? JSON.parse(authData) : null;
  } catch {
    return null;
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (!user) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name || user.username,
    ...user.metadata,
  });
  
  addBreadcrumb({
    category: 'auth',
    message: 'User context set',
    level: 'info',
    data: { user_id: user.id },
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
  
  addBreadcrumb({
    category: 'auth',
    message: 'User context cleared',
    level: 'info',
  });
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb) {
  const crumb = {
    timestamp: new Date().toISOString(),
    ...breadcrumb,
  };
  
  // Add to buffer
  breadcrumbBuffer.push(crumb);
  
  // Keep buffer size limited
  if (breadcrumbBuffer.length > MAX_BREADCRUMBS) {
    breadcrumbBuffer = breadcrumbBuffer.slice(-MAX_BREADCRUMBS);
  }
  
  // Also add to Sentry immediately
  Sentry.addBreadcrumb(crumb);
  
  return crumb;
}

/**
 * Capture an error
 */
export function captureError(error, context = {}) {
  // Add breadcrumb before capturing
  addBreadcrumb({
    category: 'error',
    message: error.message || 'Unknown error',
    level: 'error',
    data: {
      error_name: error.name,
      ...context,
    },
  });
  
  // Set additional context
  if (context.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }
  
  if (context.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      Sentry.setExtra(key, value);
    });
  }
  
  // Capture the error
  const eventId = Sentry.captureException(error);
  
  // Log to console in development
  if (APP_ENV === 'development') {
    console.error('[ErrorTracking] Captured error:', error, context);
  }
  
  return eventId;
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message, level = 'info', context = {}) {
  addBreadcrumb({
    category: 'message',
    message,
    level,
    data: context,
  });
  
  const eventId = Sentry.captureMessage(message, level);
  
  return eventId;
}

/**
 * Capture API error with details
 */
export function captureAPIError(error, requestInfo = {}, responseInfo = {}) {
  const context = {
    tags: {
      error_type: 'api_error',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
    },
    extra: {
      request: {
        url: requestInfo.url,
        method: requestInfo.method,
        headers: sanitizeHeaders(requestInfo.headers),
        body: sanitizeBody(requestInfo.body),
      },
      response: {
        status: responseInfo.status,
        statusText: responseInfo.statusText,
        headers: responseInfo.headers,
        body: responseInfo.body,
      },
    },
  };
  
  return captureError(error, context);
}

/**
 * Sanitize headers to remove sensitive info
 */
function sanitizeHeaders(headers = {}) {
  const sensitive = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized = { ...headers };
  
  sensitive.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize request body to remove sensitive info
 */
function sanitizeBody(body) {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'ssn'];
  
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    
    function sanitize(obj) {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitize(value);
          }
        }
        return result;
      }
      return obj;
    }
    
    return sanitize(parsed);
  } catch {
    return '[Unable to parse]';
  }
}

/**
 * Set up global error handlers
 */
function setupGlobalHandlers() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason || new Error('Unhandled Promise Rejection'), {
      tags: { error_type: 'unhandled_rejection' },
    });
  });
  
  // Global error handler
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      tags: { error_type: 'global_error' },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  // Track route changes
  if (window.history) {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      addBreadcrumb({
        category: 'navigation',
        message: `Navigated to: ${window.location.pathname}`,
        level: 'info',
      });
    };
  }
}

/**
 * Track Core Web Vitals and performance
 */
function trackWebVitals() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // CLS
  let clsValue = 0;
  let clsEntries = [];
  
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    }
  });
  
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Browser doesn't support layout-shift
  }
  
  // LCP
  let lcpValue = 0;
  let lcpEntry = null;
  
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    lcpValue = lastEntry.startTime;
    lcpEntry = lastEntry;
  });
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Browser doesn't support LCP
  }
  
  // FID
  let fidValue = 0;
  
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      fidValue = entry.processingStart - entry.startTime;
    }
  });
  
  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // Browser doesn't support FID
  }
  
  // Report metrics on page hide
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const metrics = {
        cls: clsValue,
        lcp: lcpValue,
        fid: fidValue,
      };
      
      // Send to Sentry as transaction
      Sentry.captureMessage('Web Vitals', 'info', {
        extra: { web_vitals: metrics },
      });
      
      // Add breadcrumb
      addBreadcrumb({
        category: 'performance',
        message: 'Core Web Vitals captured',
        level: 'info',
        data: metrics,
      });
    }
  });
}

/**
 * Create error boundary for React components
 */
export function withErrorBoundary(Component, options = {}) {
  return Sentry.withErrorBoundary(Component, {
    fallback: options.fallback || (({ error, resetError }) => (
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <p>We've been notified and are working on a fix.</p>
        {APP_ENV !== 'production' && (
          <pre>{error.message}</pre>
        )}
        <button onClick={resetError}>Try again</button>
      </div>
    )),
    ...options,
  });
}

/**
 * Get current session info
 */
export function getSessionInfo() {
  return {
    sessionId,
    startTime: sessionStartTime,
    duration: sessionStartTime ? Date.now() - sessionStartTime : 0,
    breadcrumbs: breadcrumbBuffer.length,
  };
}

/**
 * Flush any pending events
 */
export async function flush(timeout = 2000) {
  return Sentry.flush(timeout);
}

export default {
  init: initErrorTracking,
  captureError,
  captureMessage,
  captureAPIError,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  withErrorBoundary,
  getSessionInfo,
  flush,
};
