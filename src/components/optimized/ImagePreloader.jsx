import { useEffect } from 'react';

/**
 * Preloads critical images for better performance
 * Use for hero images, above-the-fold content
 */
export default function ImagePreloader({ images = [] }) {
  useEffect(() => {
    const preloadImages = images.map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(preloadImages).catch((err) => {
      console.warn('Image preload failed:', err);
    });
  }, [images]);

  return null;
}

// Hook version for inline use
export function useImagePreloader(images = []) {
  useEffect(() => {
    if (!images.length) return;

    const links = images.map((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach((link) => document.head.removeChild(link));
    };
  }, [images]);
}