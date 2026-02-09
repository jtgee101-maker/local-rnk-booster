/**
 * 200X Builder - Feature Flag System
 * Runtime feature toggling with tenant support
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Default feature configuration
const DEFAULT_FEATURES = {
  // Core features
  'dark_mode': { enabled: true, defaultValue: true },
  'offline_mode': { enabled: true, defaultValue: true },
  'pwa_enabled': { enabled: true, defaultValue: true },
  
  // Analytics features
  'advanced_analytics': { enabled: false, defaultValue: false },
  'real_time_dashboard': { enabled: false, defaultValue: false },
  'conversion_tracking': { enabled: true, defaultValue: true },
  
  // Quiz features
  'quiz_progress_save': { enabled: true, defaultValue: true },
  'quiz_auto_advance': { enabled: false, defaultValue: false },
  'quiz_multi_step': { enabled: true, defaultValue: true },
  
  // Admin features
  'god_mode': { enabled: true, defaultValue: true },
  'bulk_operations': { enabled: false, defaultValue: false },
  'advanced_export': { enabled: false, defaultValue: false },
  
  // Integration features
  'stripe_payments': { enabled: true, defaultValue: true },
  'resend_emails': { enabled: true, defaultValue: true },
  'webhook_notifications': { enabled: false, defaultValue: false },
  
  // Experimental
  'ai_assistant': { enabled: false, defaultValue: false },
  'voice_search': { enabled: false, defaultValue: false },
  ' predictive_analytics': { enabled: false, defaultValue: false },
};

// Feature cache
let featureCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch feature flags from server
 */
export const fetchFeatureFlags = async (tenantId = null) => {
  // Check cache
  if (featureCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return featureCache;
  }

  try {
    // Try to fetch from FeatureOverride entity
    const query = tenantId ? { tenant_id: tenantId } : {};
    const overrides = await base44.entities.FeatureOverride.filter(query);
    
    // Build feature map
    const features = { ...DEFAULT_FEATURES };
    
    overrides.forEach(override => {
      if (features[override.feature_key]) {
        features[override.feature_key] = {
          ...features[override.feature_key],
          enabled: override.is_enabled,
          limit: override.limit_value,
          effectiveFrom: override.effective_from,
          effectiveUntil: override.effective_until,
          overridden: true
        };
      }
    });

    // Cache results
    featureCache = features;
    cacheTimestamp = Date.now();

    return features;
  } catch (error) {
    console.warn('Failed to fetch feature flags, using defaults:', error);
    return DEFAULT_FEATURES;
  }
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureKey, tenantId = null) => {
  const features = featureCache || DEFAULT_FEATURES;
  const feature = features[featureKey];
  
  if (!feature) {
    console.warn(`Feature "${featureKey}" not found`);
    return false;
  }

  // Check time-based restrictions
  if (feature.effectiveFrom && new Date(feature.effectiveFrom) > new Date()) {
    return false;
  }
  
  if (feature.effectiveUntil && new Date(feature.effectiveUntil) < new Date()) {
    return false;
  }

  return feature.enabled;
};

/**
 * Get feature configuration
 */
export const getFeatureConfig = (featureKey) => {
  const features = featureCache || DEFAULT_FEATURES;
  return features[featureKey] || null;
};

/**
 * React hook for feature flags
 */
export const useFeatureFlag = (featureKey, tenantId = null) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const checkFeature = async () => {
      setLoading(true);
      await fetchFeatureFlags(tenantId);
      setEnabled(isFeatureEnabled(featureKey, tenantId));
      setConfig(getFeatureConfig(featureKey));
      setLoading(false);
    };

    checkFeature();
  }, [featureKey, tenantId]);

  const refresh = useCallback(async () => {
    featureCache = null;
    cacheTimestamp = null;
    await fetchFeatureFlags(tenantId);
    setEnabled(isFeatureEnabled(featureKey, tenantId));
    setConfig(getFeatureConfig(featureKey));
  }, [featureKey, tenantId]);

  return { enabled, loading, config, refresh };
};

/**
 * React hook for all feature flags
 */
export const useFeatureFlags = (tenantId = null) => {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatures = async () => {
      setLoading(true);
      const flags = await fetchFeatureFlags(tenantId);
      setFeatures(flags);
      setLoading(false);
    };

    loadFeatures();
  }, [tenantId]);

  const refresh = useCallback(async () => {
    featureCache = null;
    cacheTimestamp = null;
    const flags = await fetchFeatureFlags(tenantId);
    setFeatures(flags);
  }, [tenantId]);

  const isEnabled = useCallback((key) => {
    return isFeatureEnabled(key, tenantId);
  }, [tenantId]);

  return { features, loading, refresh, isEnabled };
};

/**
 * Feature flag provider component (for context-based usage)
 */
export const FeatureGate = ({ 
  feature, 
  tenantId = null, 
  children, 
  fallback = null,
  loadingComponent = null
}) => {
  const { enabled, loading } = useFeatureFlag(feature, tenantId);

  if (loading) {
    return loadingComponent;
  }

  return enabled ? children : fallback;
};

/**
 * Clear feature cache (useful for logout/tenant switch)
 */
export const clearFeatureCache = () => {
  featureCache = null;
  cacheTimestamp = null;
};

/**
 * Get feature limit
 */
export const getFeatureLimit = (featureKey) => {
  const config = getFeatureConfig(featureKey);
  return config?.limit || null;
};

/**
 * Check if user is within feature limit
 */
export const checkFeatureLimit = (featureKey, currentUsage) => {
  const limit = getFeatureLimit(featureKey);
  
  if (limit === null) {
    return { allowed: true, remaining: Infinity };
  }

  const remaining = limit - currentUsage;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit,
    currentUsage
  };
};

export default {
  fetchFeatureFlags,
  isFeatureEnabled,
  getFeatureConfig,
  useFeatureFlag,
  useFeatureFlags,
  FeatureGate,
  clearFeatureCache,
  getFeatureLimit,
  checkFeatureLimit,
  DEFAULT_FEATURES
};
