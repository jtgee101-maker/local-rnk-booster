/**
 * UTM Ghost Tracker
 * 
 * Captures UTM parameters on landing and persists them across the entire
 * user journey using localStorage + cookies (30-day expiry).
 */

import React, { useState, useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GhostTracker');

// Configuration
const UTM_CONFIG = {
  COOKIE_NAME: '_lr_utm_ghost',
  LOCAL_STORAGE_KEY: 'lr_utm_session',
  COOKIE_DAYS: 30,
  PARAMS: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'city', 'niche', 'referrer']
};

/**
 * Parse URL parameters
 */
function getUrlParams() {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  UTM_CONFIG.PARAMS.forEach(param => {
    const value = params.get(param);
    if (value) {
      result[param] = decodeURIComponent(value);
    }
  });
  
  // Also capture referrer if not already set
  if (!result.referrer && document.referrer) {
    result.referrer = document.referrer;
  }
  
  // Capture landing page
  result.landing_page = window.location.pathname;
  result.landing_timestamp = new Date().toISOString();
  
  return result;
}

/**
 * Set cookie with expiration
 */
function setCookie(name, value, days) {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  const cookieValue = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${name}=${cookieValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get cookie value
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      } catch (e) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Set localStorage value
 */
function setLocalStorage(key, value) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage not available');
  }
}

/**
 * Get localStorage value
 */
function getLocalStorage(key) {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Merge UTM params (URL takes precedence over stored)
 */
function mergeUTMParams(urlParams, storedParams) {
  // URL params always take precedence
  const merged = { ...storedParams, ...urlParams };
  
  // Update timestamp if new params detected
  if (Object.keys(urlParams).length > 2) { // >2 because landing_page and timestamp are always present
    merged.last_updated = new Date().toISOString();
  }
  
  return merged;
}

/**
 * Initialize the Ghost Tracker
 * Call this once when your app loads
 */
export function initGhostTracker() {
  if (typeof window === 'undefined') return;
  
  // Get current URL params
  const urlParams = getUrlParams();
  
  // Get stored params
  const cookieParams = getCookie(UTM_CONFIG.COOKIE_NAME);
  const localParams = getLocalStorage(UTM_CONFIG.LOCAL_STORAGE_KEY);
  
  // Merge params (URL > localStorage > cookie)
  const mergedParams = mergeUTMParams(
    urlParams,
    localParams || cookieParams || {}
  );
  
  // Store in both locations
  setLocalStorage(UTM_CONFIG.LOCAL_STORAGE_KEY, mergedParams);
  setCookie(UTM_CONFIG.COOKIE_NAME, mergedParams, UTM_CONFIG.COOKIE_DAYS);
  
  // Log for debugging
  logger.debug('Ghost Tracker initialized:', mergedParams);
  
  // Track the session start if new UTM params detected
  if (Object.keys(urlParams).length > 2) {
    trackSessionStart(mergedParams);
  }
  
  return mergedParams;
}

/**
 * Get current UTM parameters
 */
export function getUTMParams() {
  // Try localStorage first, then cookie
  return getLocalStorage(UTM_CONFIG.LOCAL_STORAGE_KEY) || 
         getCookie(UTM_CONFIG.COOKIE_NAME) || 
         {};
}

/**
 * Get specific UTM parameter
 */
export function getUTMParam(key) {
  const params = getUTMParams();
  return params[key] || null;
}

/**
 * Check if user has UTM params
 */
export function hasUTMParams() {
  const params = getUTMParams();
  return Object.keys(params).some(key => 
    key.startsWith('utm_') && params[key]
  );
}

/**
 * Clear UTM params
 */
export function clearUTMParams() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(UTM_CONFIG.LOCAL_STORAGE_KEY);
  
  // Clear cookie by setting expired date
  document.cookie = `${UTM_CONFIG.COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Inject UTM params as hidden form fields
 */
export function injectUTMToForm(formElement) {
  if (!formElement) return;
  
  const params = getUTMParams();
  
  // Remove existing hidden UTM fields
  formElement.querySelectorAll('input[data-utm-ghost]').forEach(el => el.remove());
  
  // Add current UTM params as hidden fields
  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      input.setAttribute('data-utm-ghost', 'true');
      formElement.appendChild(input);
    }
  });
}

/**
 * Create UTM-aware fetch wrapper
 */
export function fetchWithUTM(url, options = {}) {
  const params = getUTMParams();
  
  // Add UTM params to URL
  const urlObj = new URL(url, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === 'string' && !urlObj.searchParams.has(key)) {
      urlObj.searchParams.append(key, value);
    }
  });
  
  return fetch(urlObj.toString(), options);
}

/**
 * Track session start (send to analytics)
 */
async function trackSessionStart(params) {
  try {
    // Send to your analytics endpoint
    const response = await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        session_id: generateSessionId(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to track session start');
    }
  } catch (error) {
    // Silent fail - don't break user experience
    console.warn('Session tracking error:', error);
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Track conversion event
 */
export async function trackConversion(eventType, value = null) {
  const params = getUTMParams();
  
  try {
    await fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        value: value,
        utm_params: params,
        timestamp: new Date().toISOString(),
        session_id: generateSessionId()
      })
    });
  } catch (error) {
    console.warn('Conversion tracking error:', error);
  }
}

/**
 * React Hook for UTM tracking
 */
export function useUTMTracker() {
  const [utmParams, setUtmParams] = useState({});
  
  useEffect(() => {
    // Initialize on mount
    const params = initGhostTracker();
    setUtmParams(params);
    
    // Re-check on URL change (for SPAs)
    const handleRouteChange = () => {
      const newParams = initGhostTracker();
      setUtmParams(newParams);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return {
    utmParams,
    getParam: (key) => utmParams[key] || null,
    hasParams: () => Object.keys(utmParams).some(key => key.startsWith('utm_') && utmParams[key]),
    clear: clearUTMParams,
    trackConversion: (type, value) => trackConversion(type, value)
  };
}

/**
 * Higher-order component to wrap forms with UTM injection
 */
export function withUTMTracking(WrappedComponent) {
  return function UTMTrackedComponent(props) {
    const formRef = useRef(null);
    
    useEffect(() => {
      if (formRef.current) {
        injectUTMToForm(formRef.current);
        
        // Re-inject on form submit (in case form was modified)
        const handleSubmit = () => injectUTMToForm(formRef.current);
        formRef.current.addEventListener('submit', handleSubmit);
        
        return () => {
          if (formRef.current) {
            formRef.current.removeEventListener('submit', handleSubmit);
          }
        };
      }
    }, []);
    
    return <WrappedComponent {...props} ref={formRef} />;
  };
}

// Default export
export default {
  init: initGhostTracker,
  getParams: getUTMParams,
  getParam: getUTMParam,
  hasParams: hasUTMParams,
  clear: clearUTMParams,
  injectToForm: injectUTMToForm,
  fetchWithUTM,
  trackConversion,
  useUTMTracker,
  withUTMTracking
};
