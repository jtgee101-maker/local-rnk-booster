import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function ScrollTracker({ 
  pageName = 'unknown',
  enabled = true 
}) {
  useEffect(() => {
    if (!enabled) return;

    let maxScroll = 0;
    let scrollTracked = {
      25: false,
      50: false,
      75: false,
      90: false,
      100: false
    };

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercent = Math.round((scrollPosition / scrollHeight) * 100);

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      Object.keys(scrollTracked).forEach(threshold => {
        const thresholdNum = parseInt(threshold);
        if (scrollPercent >= thresholdNum && !scrollTracked[threshold]) {
          scrollTracked[threshold] = true;
          base44.analytics.track({
            eventName: 'scroll_depth',
            properties: {
              page: pageName,
              depth: thresholdNum,
              max_scroll: maxScroll
            }
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, pageName]);

  return null;
}