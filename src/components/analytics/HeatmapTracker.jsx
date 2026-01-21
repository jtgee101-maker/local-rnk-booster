import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Heat mapping tracker for user behavior analytics
 * Tracks clicks, scrolls, and mouse movements
 */
export default function HeatmapTracker({ pageName }) {
  const sessionId = useRef(null);
  const interactions = useRef([]);
  const lastFlush = useRef(Date.now());

  useEffect(() => {
    // Get or create session ID
    sessionId.current = sessionStorage.getItem('analytics_session') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session', sessionId.current);

    // Track clicks
    const handleClick = (e) => {
      const rect = e.target.getBoundingClientRect();
      interactions.current.push({
        type: 'click',
        x: e.clientX,
        y: e.clientY,
        element: e.target.tagName,
        class: e.target.className,
        text: e.target.innerText?.substring(0, 50),
        timestamp: Date.now(),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });
      flushIfNeeded();
    };

    // Track scroll depth
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        interactions.current.push({
          type: 'scroll',
          depth: scrollPercent,
          timestamp: Date.now()
        });
        flushIfNeeded();
      }
    };

    // Track mouse movements (sampled)
    let mouseMoveTimeout;
    const handleMouseMove = (e) => {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        interactions.current.push({
          type: 'hover',
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        });
      }, 500); // Sample every 500ms
    };

    // Flush data every 10 seconds or when 50 interactions
    const flushIfNeeded = () => {
      const now = Date.now();
      if (interactions.current.length >= 50 || now - lastFlush.current > 10000) {
        flushData();
      }
    };

    const flushData = async () => {
      if (interactions.current.length === 0) return;

      const data = [...interactions.current];
      interactions.current = [];
      lastFlush.current = Date.now();

      try {
        await base44.entities.ConversionEvent.create({
          funnel_version: 'heatmap',
          event_name: 'user_interactions',
          session_id: sessionId.current,
          properties: {
            page: pageName,
            interactions: data,
            device: {
              width: window.innerWidth,
              height: window.innerHeight,
              user_agent: navigator.userAgent
            }
          }
        });
      } catch (error) {
        console.error('Heatmap tracking error:', error);
      }
    };

    // Flush on page unload
    const handleUnload = () => {
      if (interactions.current.length > 0) {
        // Use sendBeacon for reliable tracking on page exit
        const data = {
          funnel_version: 'heatmap',
          event_name: 'user_interactions',
          session_id: sessionId.current,
          properties: {
            page: pageName,
            interactions: interactions.current
          }
        };
        navigator.sendBeacon('/api/analytics', JSON.stringify(data));
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('beforeunload', handleUnload);

    // Periodic flush
    const interval = setInterval(flushData, 15000);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(interval);
      flushData(); // Final flush
    };
  }, [pageName]);

  return null;
}