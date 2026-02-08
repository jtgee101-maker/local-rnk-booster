import React, { useState, useEffect } from 'react';

/**
 * Defers rendering of a component until after initial page load
 * Improves initial render performance for non-critical content
 */
export default function DeferredComponent({ 
  children, 
  delay = 100,
  fallback = null 
}) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return fallback;
  }

  return <>{children}</>;
}