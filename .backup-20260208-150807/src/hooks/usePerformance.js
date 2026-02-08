/**
 * Performance Hooks Module
 * Track Core Web Vitals and component performance
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Performance observer singleton
let observer = null;
const metricCallbacks = new Set();

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Core Web Vitals
  observeWebVitals();
  
  // Long tasks
  observeLongTasks();
  
  // Resource timing
  observeResourceTiming();
}

/**
 * Observe Core Web Vitals
 */
function observeWebVitals() {
  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        reportMetric('LCP', {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName || 'unknown',
          rating: getLCPRating(lastEntry.startTime)
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }
    
    // First Input Delay (FID) / Interaction to Next Paint (INP)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            reportMetric('FID', {
              value: entry.processingStart - entry.startTime,
              rating: getFIDRating(entry.processingStart - entry.startTime)
            });
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input', 'event'] });
    } catch (e) {
      console.warn('FID observation not supported');
    }
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries = [];
    
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        
        reportMetric('CLS', {
          value: clsValue,
          entries: clsEntries.length,
          rating: getCLSRating(clsValue)
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation not supported');
    }
    
    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        reportMetric('TTFB', {
          value: navigation.responseStart,
          rating: getTTFBRating(navigation.responseStart)
        });
        
        reportMetric('FCP', {
          value: navigation.responseEnd,
          rating: getFCPRating(navigation.responseEnd)
        });
      }
    });
  }
}

/**
 * Observe long tasks
 */
function observeLongTasks() {
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          reportMetric('LongTask', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks not supported
    }
  }
}

/**
 * Observe resource timing
 */
function observeResourceTiming() {
  if ('PerformanceObserver' in window) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        // Report slow resources (>500ms)
        const slowResources = entries
          .filter((e) => e.duration > 500)
          .map((e) => ({
            name: e.name,
            duration: e.duration,
            size: e.transferSize
          }));
        
        if (slowResources.length > 0) {
          reportMetric('SlowResources', slowResources);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource timing not supported
    }
  }
}

/**
 * Report metric to callbacks and analytics
 */
function reportMetric(name, data) {
  const metric = {
    name,
    data,
    timestamp: Date.now(),
    url: window.location.href
  };
  
  // Call registered callbacks
  metricCallbacks.forEach((cb) => cb(metric));
  
  // Send to analytics in production
  if (import.meta.env.PROD) {
    sendToAnalytics(metric);
  }
  
  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}:`, data);
  }
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric) {
  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/performance',
      JSON.stringify(metric)
    );
  } else {
    fetch('/api/analytics/performance', {
      method: 'POST',
      body: JSON.stringify(metric),
      keepalive: true
    }).catch(() => {});
  }
}

// Rating helpers
function getLCPRating(value) {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

function getFIDRating(value) {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
}

function getCLSRating(value) {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

function getTTFBRating(value) {
  if (value <= 800) return 'good';
  if (value <= 1800) return 'needs-improvement';
  return 'poor';
}

function getFCPRating(value) {
  if (value <= 1800) return 'good';
  if (value <= 3000) return 'needs-improvement';
  return 'poor';
}

// === React Hooks ===

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName, threshold = 16) {
  const startTime = useRef(performance.now());
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;
    
    if (duration > threshold) {
      console.warn(
        `[Performance] Slow render in ${componentName}:`,
        `${duration.toFixed(2)}ms (render #${renderCount.current})`
      );
      
      reportMetric('SlowRender', {
        component: componentName,
        duration,
        renderCount: renderCount.current
      });
    }
    
    startTime.current = performance.now();
  });
}

/**
 * Hook to track custom metrics
 */
export function usePerformanceMetric(metricName) {
  const startTime = useRef(null);
  
  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);
  
  const end = useCallback((metadata = {}) => {
    if (startTime.current === null) return;
    
    const duration = performance.now() - startTime.current;
    reportMetric(metricName, { duration, ...metadata });
    startTime.current = null;
    
    return duration;
  }, [metricName]);
  
  const measure = useCallback((fn, metadata = {}) => {
    start();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => end(metadata));
    }
    
    end(metadata);
    return result;
  }, [start, end]);
  
  return { start, end, measure };
}

/**
 * Hook to listen to performance metrics
 */
export function usePerformanceObserver(callback) {
  useEffect(() => {
    metricCallbacks.add(callback);
    return () => metricCallbacks.delete(callback);
  }, [callback]);
}

/**
 * Hook to track network requests
 */
export function useNetworkTracking() {
  const requests = useRef([]);
  
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [url, options] = args;
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        requests.current.push({
          url: typeof url === 'string' ? url : url.url,
          method: options?.method || 'GET',
          duration,
          status: response.status,
          timestamp: Date.now()
        });
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        requests.current.push({
          url: typeof url === 'string' ? url : url.url,
          method: options?.method || 'GET',
          duration,
          error: error.message,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  const getRequests = useCallback(() => requests.current, []);
  const clearRequests = useCallback(() => {
    requests.current = [];
  }, []);
  
  return { getRequests, clearRequests };
}

/**
 * Hook to track memory usage (Chrome only)
 */
export function useMemoryTracking() {
  const [memory, setMemory] = useState(null);
  
  useEffect(() => {
    if (!performance.memory) return;
    
    const interval = setInterval(() => {
      setMemory({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memory;
}

/**
 * Get all performance metrics summary
 */
export function getPerformanceSummary() {
  const navigation = performance.getEntriesByType('navigation')[0];
  
  return {
    // Timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domProcessing: navigation?.domComplete - navigation?.domLoading,
    loadComplete: navigation?.loadEventEnd,
    
    // Resources
    resourceCount: performance.getEntriesByType('resource').length,
    
    // Memory (Chrome only)
    memory: performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    } : null
  };
}

/**
 * Mark and measure performance
 */
export function mark(name) {
  if (performance.mark) {
    performance.mark(name);
  }
}

export function measure(name, startMark, endMark) {
  if (performance.measure) {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name);
    return entries[entries.length - 1];
  }
  return null;
}

export default {
  init: initPerformanceMonitoring,
  useRenderTime,
  usePerformanceMetric,
  usePerformanceObserver,
  useNetworkTracking,
  useMemoryTracking,
  getSummary: getPerformanceSummary,
  mark,
  measure
};
