import { useState, useEffect, useCallback } from 'react';
import { 
  initGhostTracker, 
  getUTMParams, 
  getUTMParam, 
  hasUTMParams, 
  clearUTMParams,
  trackConversion as trackConv
} from '@/lib/ghostTracker';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UTMTracker');

/**
 * useUTMTracker - React Hook for UTM Ghost Tracking
 * 
 * Tracks UTM parameters across the user journey and provides
 * methods to access and report on attribution data.
 * 
 * @returns {Object} UTM tracking utilities
 */
export function useUTMTracker() {
  const [utmParams, setUtmParams] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const params = initGhostTracker();
    setUtmParams(params);
    setIsInitialized(true);

    // Listen for URL changes (SPA navigation)
    const handleRouteChange = () => {
      const newParams = initGhostTracker();
      setUtmParams(newParams);
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Get a specific parameter
  const getParam = useCallback((key) => {
    return utmParams[key] || null;
  }, [utmParams]);

  // Check if any UTM params exist
  const hasParams = useCallback(() => {
    return Object.keys(utmParams).some(key => 
      key.startsWith('utm_') && utmParams[key]
    );
  }, [utmParams]);

  // Get attribution summary
  const getAttribution = useCallback(() => {
    return {
      source: utmParams.utm_source || 'direct',
      medium: utmParams.utm_medium || 'none',
      campaign: utmParams.utm_campaign || null,
      city: utmParams.city || null,
      niche: utmParams.niche || null,
      referrer: utmParams.referrer || null,
      landingPage: utmParams.landing_page || null,
      timestamp: utmParams.landing_timestamp || null
    };
  }, [utmParams]);

  // Track a conversion event
  const trackConversion = useCallback(async (eventType, value = null, metadata = {}) => {
    if (!isInitialized) return;
    
    try {
      await trackConv(eventType, value);
      
      // Log for debugging
      logger.debug('Conversion tracked:', {
        event: eventType,
        value,
        attribution: getAttribution(),
        metadata
      });
    } catch (error) {
      console.warn('Failed to track conversion:', error);
    }
  }, [isInitialized, getAttribution]);

  // Track common events
  const trackLead = useCallback((value = null) => {
    return trackConversion('lead', value);
  }, [trackConversion]);

  const trackPurchase = useCallback((value) => {
    return trackConversion('purchase', value);
  }, [trackConversion]);

  const trackSignup = useCallback(() => {
    return trackConversion('signup');
  }, [trackConversion]);

  const trackAuditStart = useCallback(() => {
    return trackConversion('audit_start');
  }, [trackConversion]);

  const trackAuditComplete = useCallback((value = null) => {
    return trackConversion('audit_complete', value);
  }, [trackConversion]);

  // Clear all UTM data
  const clear = useCallback(() => {
    clearUTMParams();
    setUtmParams({});
  }, []);

  // Refresh from storage
  const refresh = useCallback(() => {
    const params = getUTMParams();
    setUtmParams(params);
    return params;
  }, []);

  return {
    // State
    utmParams,
    isInitialized,
    
    // Getters
    getParam,
    hasParams,
    getAttribution,
    
    // Actions
    trackConversion,
    trackLead,
    trackPurchase,
    trackSignup,
    trackAuditStart,
    trackAuditComplete,
    clear,
    refresh
  };
}

/**
 * useUTMFormInjector - Hook to automatically inject UTM params into forms
 * 
 * @param {React.RefObject} formRef - Ref to the form element
 */
export function useUTMFormInjector(formRef) {
  const { utmParams, isInitialized } = useUTMTracker();

  useEffect(() => {
    if (!isInitialized || !formRef.current) return;

    const form = formRef.current;

    // Inject hidden fields
    const injectFields = () => {
      // Remove existing UTM fields
      form.querySelectorAll('input[data-utm-ghost]').forEach(el => el.remove());

      // Add current UTM params
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && typeof value === 'string' && !key.includes('timestamp')) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = `utm_${key}`;
          input.value = value;
          input.setAttribute('data-utm-ghost', 'true');
          form.appendChild(input);
        }
      });
    };

    // Inject immediately and on submit
    injectFields();
    form.addEventListener('submit', injectFields);

    return () => {
      form.removeEventListener('submit', injectFields);
    };
  }, [formRef, utmParams, isInitialized]);
}

/**
 * useUTMPageView - Track page views with UTM context
 */
export function useUTMPageView(pageName) {
  const { trackConversion, getAttribution } = useUTMTracker();

  useEffect(() => {
    trackConversion('page_view', null, { page: pageName });
  }, [pageName, trackConversion]);

  return getAttribution();
}

export default useUTMTracker;
