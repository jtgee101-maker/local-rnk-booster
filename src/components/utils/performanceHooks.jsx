import { useEffect, useRef, useCallback } from 'react';

// Debounce for performance-heavy operations
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Device performance detection
export const getDevicePerformance = () => {
  if (typeof navigator === 'undefined') return 'high';
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 4;
  
  if (memory < 4 || cores < 4) return 'low';
  if (memory < 8 || cores < 8) return 'medium';
  return 'high';
};

// Connection speed detection
export const useConnectionSpeed = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return '4g';
  }
  return navigator.connection.effectiveType || '4g';
};

// Prefetch resources
export const prefetchResources = (urls) => {
  if (typeof window === 'undefined') return;
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Session cache helpers
const CACHE_PREFIX = 'lr_';
const CACHE_DURATION = 30 * 60 * 1000;

export const sessionCache = {
  set: (key, value) => {
    try {
      const item = { value, expires: Date.now() + CACHE_DURATION };
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {}
  },
  get: (key) => {
    try {
      const item = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expires) {
        sessionStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.value;
    } catch (e) {
      return null;
    }
  }
};