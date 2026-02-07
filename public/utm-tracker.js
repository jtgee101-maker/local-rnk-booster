/**
 * UTM Ghost Tracker
 * 
 * Persists UTM parameters across sessions and injects them into form submissions.
 * Stores data in both localStorage and cookies for maximum persistence.
 * 
 * Features:
 * - Capture UTM params on landing
 * - Store in localStorage + cookie (30 days)
 * - Inject into all form submissions
 * - Track attribution to revenue
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    cookieName: '_lrnk_utm',
    localStorageKey: 'lrnk_utm_data',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    attributionWindow: 30, // days
    params: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  };

  // Generate session ID
  function generateSessionId() {
    return 'lrnk_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('lrnk_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('lrnk_session_id', sessionId);
    }
    return sessionId;
  }

  // Parse URL parameters
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    CONFIG.params.forEach(param => {
      const value = params.get(param);
      if (value) {
        result[param] = decodeURIComponent(value);
      }
    });
    
    return result;
  }

  // Get referrer info
  function getReferrerInfo() {
    const referrer = document.referrer;
    if (!referrer) return null;
    
    try {
      const url = new URL(referrer);
      return {
        url: referrer,
        host: url.hostname,
        path: url.pathname,
        isExternal: url.hostname !== window.location.hostname
      };
    } catch {
      return { url: referrer, host: null, path: null, isExternal: true };
    }
  }

  // Get device info
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    
    return {
      userAgent: ua,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceType: /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop',
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Set cookie
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires};path=/;SameSite=Lax`;
  }

  // Get cookie
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[2]));
      } catch {
        return null;
      }
    }
    return null;
  }

  // Save UTM data
  function saveUtmData(data) {
    const payload = {
      ...data,
      sessionId: getSessionId(),
      timestamp: Date.now(),
      landingPage: window.location.href,
      landingPath: window.location.pathname + window.location.search
    };
    
    // Save to localStorage
    try {
      localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save UTM data to localStorage:', e);
    }
    
    // Save to cookie (for cross-domain if needed)
    setCookie(CONFIG.cookieName, payload, CONFIG.attributionWindow);
    
    return payload;
  }

  // Load UTM data
  function loadUtmData() {
    // Try localStorage first
    try {
      const localData = localStorage.getItem(CONFIG.localStorageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Check if data is still valid (within TTL)
        if (Date.now() - parsed.timestamp < CONFIG.ttl) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load UTM data from localStorage:', e);
    }
    
    // Fall back to cookie
    const cookieData = getCookie(CONFIG.cookieName);
    if (cookieData) {
      return cookieData;
    }
    
    return null;
  }

  // Clear UTM data
  function clearUtmData() {
    localStorage.removeItem(CONFIG.localStorageKey);
    document.cookie = `${CONFIG.cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  // Capture current UTM params
  function captureUtm() {
    const urlParams = getUrlParams();
    const existingData = loadUtmData();
    
    // Only update if we have new UTM params or no existing data
    if (Object.keys(urlParams).length > 0 || !existingData) {
      const newData = {
        ...existingData,
        ...urlParams,
        // Keep original first touch attribution
        firstTouch: existingData?.firstTouch || {
          ...urlParams,
          timestamp: Date.now(),
          landingPage: window.location.href
        },
        // Update last touch attribution
        lastTouch: {
          ...urlParams,
          timestamp: Date.now(),
          landingPage: window.location.href
        },
        referrer: getReferrerInfo(),
        device: getDeviceInfo()
      };
      
      return saveUtmData(newData);
    }
    
    return existingData;
  }

  // Inject UTM data into form
  function injectIntoForm(form) {
    const utmData = loadUtmData();
    if (!utmData) return;
    
    // Remove existing hidden fields to avoid duplicates
    form.querySelectorAll('[data-utm-field]').forEach(el => el.remove());
    
    // Add hidden fields for each UTM param
    CONFIG.params.forEach(param => {
      const value = utmData[param] || utmData.lastTouch?.[param];
      if (value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = param;
        input.value = value;
        input.setAttribute('data-utm-field', 'true');
        form.appendChild(input);
      }
    });
    
    // Add session ID
    const sessionInput = document.createElement('input');
    sessionInput.type = 'hidden';
    sessionInput.name = 'utm_session_id';
    sessionInput.value = utmData.sessionId || getSessionId();
    sessionInput.setAttribute('data-utm-field', 'true');
    form.appendChild(sessionInput);
    
    // Add attribution data
    if (utmData.firstTouch) {
      const attributionInput = document.createElement('input');
      attributionInput.type = 'hidden';
      attributionInput.name = 'utm_attribution';
      attributionInput.value = JSON.stringify({
        firstTouch: utmData.firstTouch,
        lastTouch: utmData.lastTouch,
        referrer: utmData.referrer?.host
      });
      attributionInput.setAttribute('data-utm-field', 'true');
      form.appendChild(attributionInput);
    }
  }

  // Track form submissions
  function trackFormSubmission(form, data) {
    const utmData = loadUtmData();
    if (!utmData) return;
    
    // Send tracking event
    const trackingData = {
      event: 'form_submission',
      sessionId: utmData.sessionId,
      formId: form.id || form.name || 'unknown',
      formAction: form.action,
      pageUrl: window.location.href,
      utm: {
        source: utmData.utm_source || utmData.lastTouch?.utm_source,
        medium: utmData.utm_medium || utmData.lastTouch?.utm_medium,
        campaign: utmData.utm_campaign || utmData.lastTouch?.utm_campaign,
        term: utmData.utm_term || utmData.lastTouch?.utm_term,
        content: utmData.utm_content || utmData.lastTouch?.utm_content
      },
      timestamp: Date.now()
    };
    
    // Send to analytics endpoint
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
      keepalive: true
    }).catch(() => {}); // Silent fail
  }

  // Track conversion
  function trackConversion(value, type = 'generic') {
    const utmData = loadUtmData();
    if (!utmData) return;
    
    const conversionData = {
      event: 'conversion',
      sessionId: utmData.sessionId,
      conversionValue: value,
      conversionType: type,
      attribution: {
        firstTouch: utmData.firstTouch,
        lastTouch: utmData.lastTouch,
        referrer: utmData.referrer
      },
      timestamp: Date.now()
    };
    
    // Send to analytics endpoint
    fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversionData),
      keepalive: true
    }).catch(() => {});
    
    // Clear UTM data after conversion (optional - can be configured)
    // clearUtmData();
  }

  // Initialize form tracking
  function initFormTracking() {
    // Inject into existing forms
    document.querySelectorAll('form').forEach(form => {
      injectIntoForm(form);
    });
    
    // Watch for new forms
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'FORM') {
            injectIntoForm(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('form').forEach(form => injectIntoForm(form));
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Track form submissions
    document.addEventListener('submit', function(e) {
      if (e.target.tagName === 'FORM') {
        injectIntoForm(e.target);
        trackFormSubmission(e.target);
      }
    }, true);
  }

  // Public API
  window.LRNK = window.LRNK || {};
  window.LRNK.utm = {
    capture: captureUtm,
    getData: loadUtmData,
    clear: clearUtmData,
    injectIntoForm: injectIntoForm,
    trackConversion: trackConversion,
    getSessionId: getSessionId
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      captureUtm();
      initFormTracking();
    });
  } else {
    captureUtm();
    initFormTracking();
  }

  // Re-capture on URL changes (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(captureUtm, 0);
    }
  }).observe(document, { subtree: true, childList: true });

})();
