import { useEffect, useCallback, useRef } from 'react';

export function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  const debouncedFn = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return debouncedFn;
}

export const sessionCache = {
  get(key) {
    try {
      const raw = sessionStorage.getItem(`perf_cache_${key}`);
      if (!raw) return null;
      const { value, expires } = JSON.parse(raw);
      if (expires && Date.now() > expires) { sessionStorage.removeItem(`perf_cache_${key}`); return null; }
      return value;
    } catch { return null; }
  },
  set(key, value, ttlMs = 5 * 60 * 1000) {
    try { sessionStorage.setItem(`perf_cache_${key}`, JSON.stringify({ value, expires: Date.now() + ttlMs })); } catch {}
  },
  remove(key) { try { sessionStorage.removeItem(`perf_cache_${key}`); } catch {} }
};

export function prefetchResources(urls = []) {
  if (typeof window === 'undefined') return;
  urls.forEach(url => {
    try { const link = document.createElement('link'); link.rel = 'prefetch'; link.href = url; document.head.appendChild(link); } catch {}
  });
}

export default { useDebounce, sessionCache, prefetchResources };