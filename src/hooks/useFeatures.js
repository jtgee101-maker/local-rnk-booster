import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Feature Flag Context and Hooks
 * 
 * Provides a React context and hooks for managing feature flags
 * in a multi-tenant environment.
 */

// Feature context type
interface FeatureContextType {
  features: Record<string, FeatureConfig>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Feature configuration
interface FeatureConfig {
  enabled: boolean;
  limit?: number;
  currentUsage?: number;
  category?: string;
}

// Create context
const FeatureContext = createContext<FeatureContextType>({
  features: {},
  loading: true,
  error: null,
  refresh: async () => {}
});

// Provider component
export function FeatureProvider({ 
  children, 
  tenantId,
  fallbackFeatures = {} 
}: { 
  children: React.ReactNode;
  tenantId?: string;
  fallbackFeatures?: Record<string, FeatureConfig>;
}) {
  const [features, setFeatures] = useState<Record<string, FeatureConfig>>(fallbackFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!tenantId) {
      setFeatures(fallbackFeatures);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch from API
      const response = await base44.entities.FeatureOverride.filter(
        { tenant_id: tenantId },
        { limit: 100 }
      );

      const featuresMap: Record<string, FeatureConfig> = {};
      
      response.forEach((feature: any) => {
        featuresMap[feature.feature_key] = {
          enabled: feature.is_enabled,
          limit: feature.limit_value,
          category: feature.feature_category
        };
      });

      setFeatures(featuresMap);
    } catch (err) {
      console.error('Error fetching features:', err);
      setError('Failed to load features');
      setFeatures(fallbackFeatures);
    } finally {
      setLoading(false);
    }
  }, [tenantId, fallbackFeatures]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const refresh = useCallback(async () => {
    await fetchFeatures();
  }, [fetchFeatures]);

  return (
    <FeatureContext.Provider value={{ features, loading, error, refresh }}>
      {children}
    </FeatureContext.Provider>
  );
}

// Hook to use feature context
export function useFeatureContext() {
  return useContext(FeatureContext);
}

/**
 * Check if a feature is enabled
 */
export function useFeatureEnabled(featureKey: string): {
  enabled: boolean;
  loading: boolean;
} {
  const { features, loading } = useContext(FeatureContext);
  
  return {
    enabled: features[featureKey]?.enabled ?? false,
    loading
  };
}

/**
 * Check feature quota
 */
export function useFeatureQuota(featureKey: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
  loading: boolean;
} {
  const { features, loading } = useContext(FeatureContext);
  const feature = features[featureKey];
  
  if (loading || !feature) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      loading
    };
  }
  
  const limit = feature.limit ?? Infinity;
  const current = feature.currentUsage ?? 0;
  const remaining = Math.max(0, limit - current);
  
  return {
    allowed: feature.enabled && remaining > 0,
    remaining,
    limit,
    loading
  };
}

/**
 * Get all features
 */
export function useFeatures(): {
  features: Record<string, FeatureConfig>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const context = useContext(FeatureContext);
  return context;
}

/**
 * Get features by category
 */
export function useFeaturesByCategory(category: string): {
  features: Record<string, FeatureConfig>;
  loading: boolean;
} {
  const { features, loading } = useContext(FeatureContext);
  
  const filteredFeatures = Object.entries(features).reduce((acc, [key, config]) => {
    if (config.category === category) {
      acc[key] = config;
    }
    return acc;
  }, {} as Record<string, FeatureConfig>);
  
  return {
    features: filteredFeatures,
    loading
  };
}

/**
 * Hook to consume a feature with usage tracking
 */
export function useFeatureConsumption(featureKey: string): {
  consume: (amount?: number) => Promise<boolean>;
  canConsume: (amount?: number) => boolean;
  remaining: number;
  loading: boolean;
} {
  const { features, loading, refresh } = useContext(FeatureContext);
  const feature = features[featureKey];
  
  const limit = feature?.limit ?? 0;
  const current = feature?.currentUsage ?? 0;
  const remaining = Math.max(0, limit - current);
  
  const canConsume = useCallback((amount = 1) => {
    if (!feature?.enabled) return false;
    return remaining >= amount;
  }, [feature, remaining]);
  
  const consume = useCallback(async (amount = 1) => {
    if (!canConsume(amount)) {
      return false;
    }
    
    try {
      // Call API to record consumption
      await base44.entities.FeatureUsage.create({
        feature_key: featureKey,
        amount,
        timestamp: new Date().toISOString()
      });
      
      // Refresh features to get updated usage
      await refresh();
      
      return true;
    } catch (error) {
      console.error('Error consuming feature:', error);
      return false;
    }
  }, [canConsume, featureKey, refresh]);
  
  return {
    consume,
    canConsume,
    remaining,
    loading
  };
}

/**
 * Hook to toggle a feature (admin only)
 */
export function useFeatureToggle(tenantId: string): {
  toggle: (featureKey: string, enabled: boolean) => Promise<void>;
  updateLimit: (featureKey: string, limit: number) => Promise<void>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const { refresh } = useContext(FeatureContext);
  
  const toggle = useCallback(async (featureKey: string, enabled: boolean) => {
    setLoading(true);
    try {
      // Find existing override
      const existing = await base44.entities.FeatureOverride.filter({
        tenant_id: tenantId,
        feature_key: featureKey
      }, { limit: 1 });
      
      if (existing.length > 0) {
        await base44.entities.FeatureOverride.update(existing[0].id, {
          is_enabled: enabled
        });
      } else {
        await base44.entities.FeatureOverride.create({
          tenant_id: tenantId,
          feature_key: featureKey,
          is_enabled: enabled
        });
      }
      
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [tenantId, refresh]);
  
  const updateLimit = useCallback(async (featureKey: string, limit: number) => {
    setLoading(true);
    try {
      const existing = await base44.entities.FeatureOverride.filter({
        tenant_id: tenantId,
        feature_key: featureKey
      }, { limit: 1 });
      
      if (existing.length > 0) {
        await base44.entities.FeatureOverride.update(existing[0].id, {
          limit_value: limit
        });
      } else {
        await base44.entities.FeatureOverride.create({
          tenant_id: tenantId,
          feature_key: featureKey,
          limit_value: limit
        });
      }
      
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [tenantId, refresh]);
  
  return { toggle, updateLimit, loading };
}

/**
 * Hook for gated feature access
 * Returns component only if feature is enabled
 */
export function useGatedFeature<P extends object>(
  featureKey: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
): React.FC<P> {
  return function GatedComponent(props: P) {
    const { enabled, loading } = useFeatureEnabled(featureKey);
    
    if (loading) {
      return null; // Or a loading spinner
    }
    
    if (enabled) {
      return React.createElement(Component, props);
    }
    
    if (FallbackComponent) {
      return React.createElement(FallbackComponent, props);
    }
    
    return null;
  };
}

/**
 * HOC for feature gating
 */
export function withFeature<P extends object>(
  featureKey: string,
  options: {
    fallback?: React.ComponentType<P>;
    requireQuota?: number;
  } = {}
): (Component: React.ComponentType<P>) => React.FC<P> {
  return function (Component: React.ComponentType<P>): React.FC<P> {
    return function FeatureGatedComponent(props: P) {
      const { features, loading } = useContext(FeatureContext);
      const feature = features[featureKey];
      
      if (loading) {
        return React.createElement('div', { className: 'animate-pulse bg-gray-800 h-20 rounded' });
      }
      
      const hasFeature = feature?.enabled ?? false;
      const hasQuota = !options.requireQuota || 
        ((feature?.limit ?? 0) - (feature?.currentUsage ?? 0)) >= options.requireQuota;
      
      if (hasFeature && hasQuota) {
        return React.createElement(Component, props);
      }
      
      if (options.fallback) {
        return React.createElement(options.fallback, props);
      }
      
      return null;
    };
  };
}

/**
 * Hook to fetch tenant context with features
 */
export function useTenantContext() {
  const [context, setContext] = useState<{
    tenant: any | null;
    loading: boolean;
    error: string | null;
  }>({
    tenant: null,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchContext = async () => {
      try {
        // This would typically call the tenantContext function
        const response = await fetch('/api/tenant/context');
        const data = await response.json();
        
        if (data.hasTenant) {
          setContext({
            tenant: data.tenant,
            loading: false,
            error: null
          });
        } else {
          setContext({
            tenant: null,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        setContext({
          tenant: null,
          loading: false,
          error: 'Failed to load tenant context'
        });
      }
    };
    
    fetchContext();
  }, []);
  
  return context;
}

export default {
  FeatureProvider,
  useFeatureContext,
  useFeatureEnabled,
  useFeatureQuota,
  useFeatures,
  useFeaturesByCategory,
  useFeatureConsumption,
  useFeatureToggle,
  useGatedFeature,
  withFeature,
  useTenantContext
};
