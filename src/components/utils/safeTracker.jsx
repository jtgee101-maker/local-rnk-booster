/**
 * Safe tracking wrapper that prevents "Cannot read properties of undefined" errors
 * Wraps all analytics and event tracking calls with proper error handling
 */

export const safeTrack = async (trackingFn, trackingData) => {
  try {
    if (!trackingFn || typeof trackingFn !== 'function') {
      console.warn('Invalid tracking function');
      return null;
    }

    const result = trackingFn(trackingData);
    
    // Only call .catch() if result is actually a promise
    if (result && typeof result.catch === 'function') {
      return await result.catch((e) => {
        console.warn('Tracking error:', e);
        return null;
      });
    }
    
    return result;
  } catch (error) {
    console.warn('Safe tracking error:', error);
    return null;
  }
};

export const safeAnalyticsTrack = (base44, eventName, properties = {}) => {
  return safeTrack(() => {
    if (!base44?.analytics?.track) return null;
    return base44.analytics.track({ eventName, properties });
  }, { eventName, properties });
};

export const safeEntityCreate = (base44, entityName, data) => {
  return safeTrack(() => {
    if (!base44?.entities || !base44.entities[entityName]?.create) return null;
    return base44.entities[entityName].create(data);
  }, data);
};

export const safeEntityUpdate = (base44, entityName, id, data) => {
  return safeTrack(() => {
    if (!base44?.entities || !base44.entities[entityName]?.update) return null;
    return base44.entities[entityName].update(id, data);
  }, data);
};

export const safeFunctionInvoke = (base44, functionName, payload) => {
  return safeTrack(() => {
    if (!base44?.functions?.invoke) return null;
    return base44.functions.invoke(functionName, payload);
  }, payload);
};

/**
 * Wrap async function calls with timeout and error handling
 */
export const withTimeout = async (promise, timeoutMs = 5000, context = '') => {
  if (!promise || typeof promise.catch !== 'function') {
    console.warn(`Invalid promise in timeout wrapper: ${context}`);
    return null;
  }

  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${context}`)), timeoutMs)
    )
  ]).catch((error) => {
    console.warn(`Timeout or error in ${context}:`, error);
    return null;
  });
};