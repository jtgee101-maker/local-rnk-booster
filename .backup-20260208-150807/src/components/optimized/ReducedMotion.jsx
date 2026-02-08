import { useEffect, useState } from 'react';

/**
 * Respects user's reduced motion preferences
 * Improves performance and accessibility
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// HOC for conditional animations
export function withReducedMotion(Component) {
  return function ReducedMotionWrapper(props) {
    const prefersReducedMotion = useReducedMotion();
    
    return (
      <Component 
        {...props} 
        animate={prefersReducedMotion ? false : props.animate}
        transition={prefersReducedMotion ? { duration: 0 } : props.transition}
      />
    );
  };
}