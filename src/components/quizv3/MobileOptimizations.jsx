import { useEffect } from 'react';

/**
 * Component to handle mobile-specific optimizations
 * - Prevents zoom on input focus (iOS)
 * - Adds viewport height fix for mobile browsers
 * - Optimizes touch event handling
 */
export default function MobileOptimizations() {
  useEffect(() => {
    // Prevent iOS zoom on input focus by ensuring font-size is at least 16px
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const fontSize = window.getComputedStyle(input).fontSize;
      if (parseInt(fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });

    // Fix viewport height for mobile browsers (address bar issue)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Optimize scroll performance
    document.body.style.webkitOverflowScrolling = 'touch';

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return null;
}