import { useEffect } from 'react';

/**
 * P0 FIX: Universal mobile viewport height fix
 * Handles iOS Safari viewport height issues across all pages
 */
export default function MobileViewportFix() {
  useEffect(() => {
    // Set CSS custom property for actual viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      // Small delay for iOS to recalculate
      setTimeout(setVH, 100);
    });

    // iOS-specific fix
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.documentElement.style.setProperty('height', '-webkit-fill-available');
    }

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return null;
}