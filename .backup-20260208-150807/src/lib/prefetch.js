/**
 * Prefetch System Module
 * Intelligent route and resource prefetching
 */

import { useEffect, useCallback, useRef } from 'react';

// Configuration
const CONFIG = {
  // Hover delay before prefetching (ms)
  hoverDelay: 100,
  
  // Time window for user behavior tracking (ms)
  behaviorWindow: 5 * 60 * 1000, // 5 minutes
  
  // Max concurrent prefetch requests
  maxConcurrent: 3,
  
  // Minimum confidence threshold for predictive prefetching (0-1)
  predictionThreshold: 0.6,
  
  // Idle time before prefetching (ms)
  idleTimeout: 100
};

// State
const prefetchQueue = [];
const prefetchedUrls = new Set();
const inProgress = new Set();
const userBehavior = new Map(); // route -> { visits, lastVisit, transitions }
let idleCallbackId = null;

/**
 * Prefetch a URL (route or resource)
 */
export async function prefetch(url, priority = 'auto') {
  // Skip if already prefetched or in progress
  if (prefetchedUrls.has(url) || inProgress.has(url)) {
    return;
  }
  
  // Check if we're at max concurrent requests
  if (inProgress.size >= CONFIG.maxConcurrent) {
    // Queue for later
    prefetchQueue.push({ url, priority });
    return;
  }
  
  inProgress.add(url);
  
  try {
    // Determine prefetch method based on URL type
    if (isRoute(url)) {
      await prefetchRoute(url);
    } else {
      await prefetchResource(url);
    }
    
    prefetchedUrls.add(url);
  } catch (error) {
    console.warn('[Prefetch] Failed:', url, error.message);
  } finally {
    inProgress.delete(url);
    processQueue();
  }
}

/**
 * Prefetch a route (JS chunk + data)
 */
async function prefetchRoute(route) {
  // Prefetch route component
  if (window.__LOCALRNK_ROUTES__?.[route]) {
    const loader = window.__LOCALRNK_ROUTES__[route];
    if (typeof loader === 'function') {
      await loader();
    }
  }
  
  // Prefetch route data
  try {
    await fetch(`/api/prefetch?route=${encodeURIComponent(route)}`, {
      method: 'HEAD',
      priority: 'low'
    });
  } catch {
    // Data prefetch is optional
  }
}

/**
 * Prefetch a static resource
 */
async function prefetchResource(url) {
  // Use link rel=prefetch for resources
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = getResourceType(url);
  
  return new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
    
    // Cleanup after load
    setTimeout(() => link.remove(), 1000);
  });
}

/**
 * Process the prefetch queue
 */
function processQueue() {
  if (prefetchQueue.length === 0 || inProgress.size >= CONFIG.maxConcurrent) {
    return;
  }
  
  // Sort by priority
  prefetchQueue.sort((a, b) => {
    const priorityOrder = { high: 0, auto: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Process next item
  const next = prefetchQueue.shift();
  if (next) {
    prefetch(next.url, next.priority);
  }
}

/**
 * Check if URL is a route vs a static resource
 */
function isRoute(url) {
  return (
    !url.includes('.') ||
    url.endsWith('/') ||
    /^\/(?!.*\.(js|css|png|jpg|woff|svg)$).*$/.test(url)
  );
}

/**
 * Get resource type for prefetch hint
 */
function getResourceType(url) {
  if (/\.(js|mjs)$/i.test(url)) return 'script';
  if (/\.css$/i.test(url)) return 'style';
  if (/\.(woff2?|ttf|otf)$/i.test(url)) return 'font';
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url)) return 'image';
  return 'fetch';
}

// === User Behavior Tracking ===

/**
 * Track a route visit for predictive prefetching
 */
export function trackRouteVisit(route) {
  const now = Date.now();
  const data = userBehavior.get(route) || {
    visits: 0,
    lastVisit: 0,
    transitions: new Map()
  };
  
  data.visits++;
  data.lastVisit = now;
  
  userBehavior.set(route, data);
  
  // Clean old entries periodically
  if (Math.random() < 0.1) {
    cleanOldBehavior();
  }
}

/**
 * Track a transition between routes
 */
export function trackRouteTransition(from, to) {
  const data = userBehavior.get(from);
  if (!data) return;
  
  const transitions = data.transitions;
  const count = transitions.get(to) || 0;
  transitions.set(to, count + 1);
}

/**
 * Get predicted next routes based on current route
 */
export function getPredictedRoutes(currentRoute) {
  const data = userBehavior.get(currentRoute);
  if (!data) return [];
  
  const totalTransitions = Array.from(data.transitions.values())
    .reduce((a, b) => a + b, 0);
  
  if (totalTransitions === 0) return [];
  
  // Calculate probabilities and filter by threshold
  return Array.from(data.transitions.entries())
    .map(([route, count]) => ({
      route,
      probability: count / totalTransitions
    }))
    .filter((item) => item.probability >= CONFIG.predictionThreshold)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3); // Top 3 predictions
}

/**
 * Clean old behavior data
 */
function cleanOldBehavior() {
  const cutoff = Date.now() - CONFIG.behaviorWindow;
  
  for (const [route, data] of userBehavior) {
    if (data.lastVisit < cutoff) {
      userBehavior.delete(route);
    }
  }
}

// === React Hooks ===

/**
 * Hook to prefetch on link hover
 */
export function usePrefetchOnHover(url, options = {}) {
  const { delay = CONFIG.hoverDelay, priority = 'auto' } = options;
  const timeoutRef = useRef(null);
  
  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      prefetch(url, priority);
    }, delay);
  }, [url, delay, priority]);
  
  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook to prefetch on viewport entry (Intersection Observer)
 */
export function usePrefetchOnVisible(url, options = {}) {
  const { priority = 'low', rootMargin = '100px' } = options;
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch(url, priority);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [url, priority, rootMargin]);
  
  return ref;
}

/**
 * Hook for intelligent route prefetching based on behavior
 */
export function useIntelligentPrefetch(currentRoute) {
  useEffect(() => {
    // Track this visit
    trackRouteVisit(currentRoute);
    
    // Get predicted next routes
    const predictions = getPredictedRoutes(currentRoute);
    
    if (predictions.length === 0) return;
    
    // Schedule prefetch during idle time
    cancelIdleCallback(idleCallbackId);
    
    idleCallbackId = requestIdleCallback(() => {
      predictions.forEach((prediction, index) => {
        // Stagger prefetches
        setTimeout(() => {
          prefetch(prediction.route, 'low');
        }, index * 500);
      });
    }, { timeout: 2000 });
    
    return () => cancelIdleCallback(idleCallbackId);
  }, [currentRoute]);
}

/**
 * Hook to prefetch critical resources on mount
 */
export function usePrefetchCritical(resources) {
  useEffect(() => {
    // Use requestIdleCallback for non-critical prefetching
    idleCallbackId = requestIdleCallback(() => {
      resources.forEach((url, index) => {
        setTimeout(() => {
          prefetch(url, 'high');
        }, index * 100);
      });
    });
    
    return () => cancelIdleCallback(idleCallbackId);
  }, []);
}

/**
 * Prefetch component - declarative prefetching
 */
export function Prefetch({ urls, priority = 'auto', when = 'idle' }) {
  useEffect(() => {
    const doPrefetch = () => {
      urls.forEach((url, index) => {
        setTimeout(() => {
          prefetch(url, priority);
        }, index * 100);
      });
    };
    
    if (when === 'immediate') {
      doPrefetch();
    } else if (when === 'idle') {
      idleCallbackId = requestIdleCallback(doPrefetch, { timeout: 2000 });
      return () => cancelIdleCallback(idleCallbackId);
    }
  }, [urls, priority, when]);
  
  return null;
}

// === Utilities ===

/**
 * Batch prefetch multiple URLs
 */
export function prefetchBatch(urls, options = {}) {
  const { priority = 'auto', stagger = 50 } = options;
  
  urls.forEach((url, index) => {
    setTimeout(() => {
      prefetch(url, priority);
    }, index * stagger);
  });
}

/**
 * Prefetch based on likelihood score
 */
export function prefetchLikely(probabilities) {
  Object.entries(probabilities)
    .filter(([, prob]) => prob >= CONFIG.predictionThreshold)
    .sort(([, a], [, b]) => b - a)
    .slice(0, CONFIG.maxConcurrent)
    .forEach(([url]) => prefetch(url, 'auto'));
}

/**
 * Get prefetch statistics
 */
export function getPrefetchStats() {
  return {
    prefetched: prefetchedUrls.size,
    inProgress: inProgress.size,
    queued: prefetchQueue.length,
    behaviorPatterns: userBehavior.size
  };
}

/**
 * Clear prefetch cache
 */
export function clearPrefetchCache() {
  prefetchedUrls.clear();
  prefetchQueue.length = 0;
}

// Polyfill for requestIdleCallback
const requestIdleCallback = window.requestIdleCallback ||
  ((cb) => setTimeout(cb, 1));
  
const cancelIdleCallback = window.cancelIdleCallback ||
  ((id) => clearTimeout(id));

export default {
  prefetch,
  prefetchBatch,
  prefetchLikely,
  trackRouteVisit,
  trackRouteTransition,
  getPredictedRoutes,
  usePrefetchOnHover,
  usePrefetchOnVisible,
  useIntelligentPrefetch,
  usePrefetchCritical,
  Prefetch,
  getStats: getPrefetchStats,
  clearCache: clearPrefetchCache
};
