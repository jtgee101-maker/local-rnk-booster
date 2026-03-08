import { useEffect, useCallback, useRef } from 'react';

/**
 * useDebounce - delays calling a function until after wait ms have elapsed
 */
export function useDebounce(fn, delay) {
  const timerRef = useRef(null);

  const debouncedFn = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}

/**
 * sessionCache - simple sessionStorage cache with TTL
 */
export const sessionCache = {
  get(key) {
    try {
      const raw = sessionStorage.getItem(`perf_cache_${key}`);
      if (!raw) return null;
      const { value, expires } = JSON.parse(raw);
      if (expires && Date.now() > expires) {
        sessionStorage.removeItem(`perf_cache_${key}`);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  },
  set(key, value, ttlMs = 5 * 60 * 1000) {
    try {
      sessionStorage.setItem(`perf_cache_${key}`, JSON.stringify({
        value,
        expires: Date.now() + ttlMs
      }));
    } catch {
      // sessionStorage full or unavailable — silently ignore
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(`perf_cache_${key}`);
    } catch {}
  }
};

/**
 * prefetchResources - prefetches a list of URLs in the background
 */
export function prefetchResources(urls = []) {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    } catch {
      // silently ignore
    }
  });
}

export default { useDebounce, sessionCache, prefetchResources };