/**
 * Multi-Tenant Middleware
 * 
 * Detects tenant from subdomain or custom domain and injects
 * tenant context into all requests. Also handles feature flag
 * checks for the detected tenant.
 */

import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler } from '../utils/errorHandler';

// Cache for tenant lookups (TTL: 5 minutes)
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Feature cache per tenant
const featureCache = new Map();

// Interface for tenant context
export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  brandingConfig: Record<string, unknown>;
  planId: string;
  features: Record<string, FeatureAccess>;
  limits: ResourceLimits;
  isWhiteLabeled: boolean;
}

interface FeatureAccess {
  enabled: boolean;
  limit?: number;
  currentUsage?: number;
}

interface ResourceLimits {
  maxAudits: number;
  maxUsers: number;
  maxProjects: number;
  storageLimitMB: number;
}

// Extract tenant identifier from request
export function extractTenantIdentifier(req: Request): {
  type: 'subdomain' | 'custom_domain' | 'none';
  value: string | null;
} {
  const url = new URL(req.url);
  const host = url.hostname;
  
  // Check for localhost/development
  if (host === 'localhost' || host === '127.0.0.1') {
    // Check query param for tenant override (development only)
    const tenantOverride = url.searchParams.get('__tenant');
    if (tenantOverride) {
      return { type: 'subdomain', value: tenantOverride };
    }
    return { type: 'none', value: null };
  }
  
  // Extract subdomain from host
  const hostParts = host.split('.');
  
  // Handle different domain patterns
  // app.localrnk.io -> subdomain: app
  // tenant.customdomain.com -> custom_domain: tenant.customdomain.com
  
  if (hostParts.length >= 3) {
    // Potential subdomain pattern
    const subdomain = hostParts[0];
    const domain = hostParts.slice(1).join('.');
    
    // Check if it's the main domain
    if (domain === 'localrnk.io' || domain === 'localrnk.com') {
      if (subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
        return { type: 'subdomain', value: subdomain };
      }
    }
  }
  
  // Check if it's a custom domain
  // This would be matched against the custom_domain field in the database
  if (hostParts.length >= 2) {
    return { type: 'custom_domain', value: host };
  }
  
  return { type: 'none', value: null };
}

// Look up tenant by identifier
export async function lookupTenant(
  req: Request,
  identifier: { type: string; value: string }
): Promise<TenantContext | null> {
  const cacheKey = `${identifier.type}:${identifier.value}`;
  
  // Check cache
  const cached = tenantCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant;
  }
  
  try {
    const base44 = createClientFromRequest(req);
    
    let tenant;
    
    if (identifier.type === 'subdomain') {
      const results = await base44.asServiceRole.entities.Tenant.filter(
        { subdomain: identifier.value },
        { limit: 1 }
      );
      tenant = results[0];
    } else if (identifier.type === 'custom_domain') {
      const results = await base44.asServiceRole.entities.Tenant.filter(
        { custom_domain: identifier.value },
        { limit: 1 }
      );
      tenant = results[0];
    }
    
    if (!tenant) {
      return null;
    }
    
    // Check if tenant is active
    if (tenant.status === 'suspended') {
      throw new TenantError('Tenant is suspended', 'TENANT_SUSPENDED', 403);
    }
    
    if (tenant.status === 'cancelled') {
      throw new TenantError('Tenant is cancelled', 'TENANT_CANCELLED', 403);
    }
    
    // Fetch features for this tenant
    const features = await fetchTenantFeatures(req, tenant.id);
    
    // Build tenant context
    const context: TenantContext = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      customDomain: tenant.custom_domain,
      status: tenant.status,
      brandingConfig: tenant.branding_config || {},
      planId: tenant.plan_id,
      features,
      limits: {
        maxAudits: tenant.max_audits,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        storageLimitMB: tenant.storage_limit_mb
      },
      isWhiteLabeled: features.white_label?.enabled || false
    };
    
    // Cache the result
    tenantCache.set(cacheKey, { tenant: context, timestamp: Date.now() });
    
    return context;
  } catch (error) {
    if (error instanceof TenantError) {
      throw error;
    }
    console.error('Error looking up tenant:', error);
    return null;
  }
}

// Fetch tenant features
async function fetchTenantFeatures(
  req: Request,
  tenantId: string
): Promise<Record<string, FeatureAccess>> {
  const cacheKey = `features:${tenantId}`;
  
  // Check cache
  const cached = featureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.features;
  }
  
  try {
    const base44 = createClientFromRequest(req);
    
    const overrides = await base44.asServiceRole.entities.FeatureOverride.filter(
      { tenant_id: tenantId },
      { limit: 100 }
    );
    
    const features: Record<string, FeatureAccess> = {};
    
    overrides.forEach((override: any) => {
      features[override.feature_key] = {
        enabled: override.is_enabled,
        limit: override.limit_value,
        currentUsage: 0 // Would be populated from usage tracking
      };
    });
    
    // Cache the result
    featureCache.set(cacheKey, { features, timestamp: Date.now() });
    
    return features;
  } catch (error) {
    console.error('Error fetching tenant features:', error);
    return {};
  }
}

// Check if a feature is enabled for tenant
export function isFeatureEnabled(
  tenantContext: TenantContext,
  featureKey: string
): boolean {
  const feature = tenantContext.features[featureKey];
  return feature?.enabled ?? false;
}

// Check if tenant has available quota for a feature
export function hasFeatureQuota(
  tenantContext: TenantContext,
  featureKey: string,
  requestedAmount: number = 1
): { allowed: boolean; remaining: number; limit: number } {
  const feature = tenantContext.features[featureKey];
  
  if (!feature?.enabled) {
    return { allowed: false, remaining: 0, limit: 0 };
  }
  
  const limit = feature.limit ?? Infinity;
  const current = feature.currentUsage ?? 0;
  const remaining = Math.max(0, limit - current);
  
  return {
    allowed: remaining >= requestedAmount,
    remaining,
    limit
  };
}

// Custom error class for tenant-related errors
export class TenantError extends Error {
  code: string;
  statusCode: number;
  
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'TenantError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Middleware function
export async function tenantMiddleware(
  req: Request,
  options: {
    requireTenant?: boolean;
    requiredFeatures?: string[];
  } = {}
): Promise<{ req: Request; tenantContext: TenantContext | null }> {
  const identifier = extractTenantIdentifier(req);
  
  if (identifier.type === 'none') {
    if (options.requireTenant) {
      throw new TenantError('Tenant not found', 'TENANT_NOT_FOUND', 404);
    }
    return { req, tenantContext: null };
  }
  
  const tenantContext = await lookupTenant(req, identifier);
  
  if (!tenantContext) {
    if (options.requireTenant) {
      throw new TenantError('Tenant not found', 'TENANT_NOT_FOUND', 404);
    }
    return { req, tenantContext: null };
  }
  
  // Check required features
  if (options.requiredFeatures) {
    for (const feature of options.requiredFeatures) {
      if (!isFeatureEnabled(tenantContext, feature)) {
        throw new TenantError(
          `Feature '${feature}' is not enabled for this tenant`,
          'FEATURE_NOT_ENABLED',
          403
        );
      }
    }
  }
  
  // Add tenant context to request headers for downstream use
  const modifiedReq = new Request(req, {
    headers: {
      ...Object.fromEntries(req.headers),
      'X-Tenant-ID': tenantContext.id,
      'X-Tenant-Subdomain': tenantContext.subdomain,
      'X-Tenant-Plan': tenantContext.planId,
    }
  });
  
  return { req: modifiedReq, tenantContext };
}

// Clear tenant cache (useful for admin operations)
export function clearTenantCache(tenantId?: string): void {
  if (tenantId) {
    // Clear specific tenant
    for (const [key, value] of tenantCache.entries()) {
      if (value.tenant.id === tenantId) {
        tenantCache.delete(key);
      }
    }
    featureCache.delete(`features:${tenantId}`);
  } else {
    // Clear all
    tenantCache.clear();
    featureCache.clear();
  }
}

// Main handler for Netlify Functions
Deno.serve(withDenoErrorHandler(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle different endpoints
  
  // GET /api/tenant/context - Get current tenant context
  if (path.endsWith('/tenant/context') && req.method === 'GET') {
    try {
      const { tenantContext } = await tenantMiddleware(req);
      
      if (!tenantContext) {
        return Response.json({
          hasTenant: false,
          message: 'No tenant detected'
        });
      }
      
      return Response.json({
        hasTenant: true,
        tenant: {
          id: tenantContext.id,
          name: tenantContext.name,
          subdomain: tenantContext.subdomain,
          customDomain: tenantContext.customDomain,
          status: tenantContext.status,
          planId: tenantContext.planId,
          isWhiteLabeled: tenantContext.isWhiteLabeled,
          features: tenantContext.features,
          limits: tenantContext.limits
        }
      });
    } catch (error) {
      if (error instanceof TenantError) {
        return Response.json({
          error: error.message,
          code: error.code
        }, { status: error.statusCode });
      }
      return Response.json({
        error: 'Internal server error'
      }, { status: 500 });
    }
  }
  
  // GET /api/tenant/features/:featureKey - Check specific feature
  if (path.match(/\/tenant\/features\/[^/]+$/) && req.method === 'GET') {
    const featureKey = path.split('/').pop();
    
    try {
      const { tenantContext } = await tenantMiddleware(req, { requireTenant: true });
      
      const enabled = isFeatureEnabled(tenantContext!, featureKey!);
      const quota = hasFeatureQuota(tenantContext!, featureKey!);
      
      return Response.json({
        feature: featureKey,
        enabled,
        quota
      });
    } catch (error) {
      if (error instanceof TenantError) {
        return Response.json({
          error: error.message,
          code: error.code
        }, { status: error.statusCode });
      }
      return Response.json({
        error: 'Internal server error'
      }, { status: 500 });
    }
  }
  
  // POST /api/tenant/clear-cache - Clear tenant cache (admin only)
  if (path.endsWith('/tenant/clear-cache') && req.method === 'POST') {
    try {
      const body = await req.json();
      clearTenantCache(body.tenantId);
      
      return Response.json({
        success: true,
        message: body.tenantId 
          ? `Cache cleared for tenant ${body.tenantId}`
          : 'All tenant caches cleared'
      });
    } catch (error) {
      return Response.json({
        error: 'Failed to clear cache'
      }, { status: 500 });
    }
  }
  
  // Default: return middleware info
  return Response.json({
    message: 'Tenant Middleware API',
    endpoints: [
      { path: '/api/tenant/context', method: 'GET', description: 'Get current tenant context' },
      { path: '/api/tenant/features/:featureKey', method: 'GET', description: 'Check feature status' },
      { path: '/api/tenant/clear-cache', method: 'POST', description: 'Clear tenant cache (admin)' }
    ]
  });
}));
