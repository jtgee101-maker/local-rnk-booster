/**
 * Create Tenant Function
 * 
 * Creates a new white-label tenant with default configuration,
 * feature overrides, and initializes health tracking.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler } from '../utils/errorHandler';

// Generate a unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Validate subdomain format
function isValidSubdomain(subdomain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain);
}

// Validate custom domain format
function isValidCustomDomain(domain: string): boolean {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
}

// Default branding configuration
const DEFAULT_BRANDING = {
  colors: {
    primary: '#00F2FF',
    secondary: '#c8ff00',
    background: '#000000',
    surface: '#0a0a0a',
    text: '#ffffff',
    accent: '#00F2FF'
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter'
  },
  logo: {
    url: null,
    darkUrl: null,
    favicon: null
  },
  customCSS: null
};

// Default feature overrides by plan
const PLAN_FEATURES = {
  starter: {
    seo_audit: { enabled: true, limit: 100 },
    ai_content: { enabled: true, limit: 50 },
    custom_domain: { enabled: false, limit: 0 },
    white_label: { enabled: false, limit: 0 },
    api_access: { enabled: false, limit: 100 },
    team_collaboration: { enabled: true, limit: 3 },
    advanced_reporting: { enabled: false, limit: 0 },
    competitor_tracking: { enabled: false, limit: 0 },
    priority_support: { enabled: false, limit: 0 },
    bulk_operations: { enabled: false, limit: 0 }
  },
  growth: {
    seo_audit: { enabled: true, limit: 500 },
    ai_content: { enabled: true, limit: 200 },
    custom_domain: { enabled: true, limit: 1 },
    white_label: { enabled: true, limit: 1 },
    api_access: { enabled: true, limit: 1000 },
    team_collaboration: { enabled: true, limit: 10 },
    advanced_reporting: { enabled: true, limit: 1 },
    competitor_tracking: { enabled: true, limit: 5 },
    priority_support: { enabled: false, limit: 0 },
    bulk_operations: { enabled: true, limit: 1 }
  },
  pro: {
    seo_audit: { enabled: true, limit: 2000 },
    ai_content: { enabled: true, limit: 500 },
    custom_domain: { enabled: true, limit: 3 },
    white_label: { enabled: true, limit: 1 },
    api_access: { enabled: true, limit: 10000 },
    team_collaboration: { enabled: true, limit: 25 },
    advanced_reporting: { enabled: true, limit: 1 },
    competitor_tracking: { enabled: true, limit: 20 },
    priority_support: { enabled: true, limit: 1 },
    bulk_operations: { enabled: true, limit: 1 }
  },
  enterprise: {
    seo_audit: { enabled: true, limit: 10000 },
    ai_content: { enabled: true, limit: 2000 },
    custom_domain: { enabled: true, limit: 10 },
    white_label: { enabled: true, limit: 1 },
    api_access: { enabled: true, limit: 100000 },
    team_collaboration: { enabled: true, limit: 100 },
    advanced_reporting: { enabled: true, limit: 1 },
    competitor_tracking: { enabled: true, limit: 100 },
    priority_support: { enabled: true, limit: 1 },
    bulk_operations: { enabled: true, limit: 1 }
  }
};

// Resource limits by plan
const PLAN_LIMITS = {
  starter: { max_audits: 100, max_users: 3, max_projects: 10, storage_limit_mb: 1024 },
  growth: { max_audits: 500, max_users: 10, max_projects: 50, storage_limit_mb: 5120 },
  pro: { max_audits: 2000, max_users: 25, max_projects: 200, storage_limit_mb: 51200 },
  enterprise: { max_audits: 10000, max_users: 100, max_projects: 500, storage_limit_mb: 102400 }
};

// Main handler
Deno.serve(withDenoErrorHandler(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return Response.json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }, { status: 405 });
  }
  
  try {
    const body = await req.json();
    const {
      name,
      subdomain,
      custom_domain,
      plan_id = 'starter',
      billing_email,
      branding_config,
      created_by
    } = body;
    
    // Validation
    if (!name || typeof name !== 'string' || name.length < 2) {
      return Response.json({
        error: 'Tenant name is required and must be at least 2 characters',
        code: 'INVALID_NAME'
      }, { status: 400 });
    }
    
    if (!subdomain || !isValidSubdomain(subdomain)) {
      return Response.json({
        error: 'Valid subdomain is required (lowercase letters, numbers, hyphens only)',
        code: 'INVALID_SUBDOMAIN'
      }, { status: 400 });
    }
    
    if (custom_domain && !isValidCustomDomain(custom_domain)) {
      return Response.json({
        error: 'Invalid custom domain format',
        code: 'INVALID_DOMAIN'
      }, { status: 400 });
    }
    
    if (!PLAN_FEATURES[plan_id]) {
      return Response.json({
        error: `Invalid plan_id. Must be one of: ${Object.keys(PLAN_FEATURES).join(', ')}`,
        code: 'INVALID_PLAN'
      }, { status: 400 });
    }
    
    const base44 = createClientFromRequest(req);
    
    // Check if subdomain already exists
    const existingSubdomain = await base44.asServiceRole.entities.Tenant.filter(
      { subdomain: subdomain.toLowerCase() },
      { limit: 1 }
    );
    
    if (existingSubdomain.length > 0) {
      return Response.json({
        error: 'Subdomain already exists',
        code: 'SUBDOMAIN_EXISTS'
      }, { status: 409 });
    }
    
    // Check if custom domain already exists (if provided)
    if (custom_domain) {
      const existingDomain = await base44.asServiceRole.entities.Tenant.filter(
        { custom_domain: custom_domain.toLowerCase() },
        { limit: 1 }
      );
      
      if (existingDomain.length > 0) {
        return Response.json({
          error: 'Custom domain already exists',
          code: 'DOMAIN_EXISTS'
        }, { status: 409 });
      }
    }
    
    // Generate slug
    const slug = generateSlug(name);
    
    // Check if slug exists and append number if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
      const existingSlug = await base44.asServiceRole.entities.Tenant.filter(
        { slug: uniqueSlug },
        { limit: 1 }
      );
      
      if (existingSlug.length === 0) break;
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    // Get plan limits
    const planLimits = PLAN_LIMITS[plan_id];
    
    // Merge branding config with defaults
    const mergedBranding = {
      ...DEFAULT_BRANDING,
      ...branding_config,
      colors: { ...DEFAULT_BRANDING.colors, ...(branding_config?.colors || {}) },
      typography: { ...DEFAULT_BRANDING.typography, ...(branding_config?.typography || {}) },
      logo: { ...DEFAULT_BRANDING.logo, ...(branding_config?.logo || {}) }
    };
    
    // Create tenant
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: name.trim(),
      slug: uniqueSlug,
      subdomain: subdomain.toLowerCase(),
      custom_domain: custom_domain?.toLowerCase() || null,
      status: 'active',
      branding_config: mergedBranding,
      domain_verified: false,
      ssl_status: custom_domain ? 'pending' : 'active',
      ...planLimits,
      plan_id,
      billing_email: billing_email || null,
      subscription_status: 'trialing',
      activated_at: new Date().toISOString()
    });
    
    // Create feature overrides for this tenant
    const planFeatures = PLAN_FEATURES[plan_id];
    const featurePromises = Object.entries(planFeatures).map(([featureKey, config]) => {
      return base44.asServiceRole.entities.FeatureOverride.create({
        tenant_id: tenant.id,
        feature_key: featureKey,
        feature_category: getFeatureCategory(featureKey),
        is_enabled: config.enabled,
        limit_value: config.limit,
        effective_from: new Date().toISOString()
      });
    });
    
    await Promise.all(featurePromises);
    
    // Create initial health check record
    await base44.asServiceRole.entities.TenantHealthCheck.create({
      tenant_id: tenant.id,
      status: 'healthy',
      audits_count: 0,
      users_count: 0,
      projects_count: 0,
      storage_used_mb: 0,
      last_check_at: new Date().toISOString()
    });
    
    // Log audit event
    await base44.asServiceRole.entities.TenantAuditLog.create({
      tenant_id: tenant.id,
      action: 'tenant_created',
      entity_type: 'tenant',
      entity_id: tenant.id,
      new_values: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan_id: tenant.plan_id
      },
      performed_by: created_by || null,
      metadata: {
        created_via: 'api',
        plan_id
      }
    });
    
    // Return success response
    return Response.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subdomain: tenant.subdomain,
        custom_domain: tenant.custom_domain,
        status: tenant.status,
        plan_id: tenant.plan_id,
        urls: {
          subdomain: `https://${tenant.subdomain}.localrnk.io`,
          custom: tenant.custom_domain ? `https://${tenant.custom_domain}` : null
        }
      },
      setup: {
        next_steps: custom_domain ? [
          'Configure DNS records for custom domain',
          'Verify domain ownership',
          'SSL certificate will be provisioned automatically'
        ] : [
          'Tenant is ready to use',
          'Share the subdomain URL with your client'
        ]
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating tenant:', error);
    
    return Response.json({
      error: 'Failed to create tenant',
      code: 'CREATE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}));

// Helper function to determine feature category
function getFeatureCategory(featureKey: string): string {
  const categoryMap: Record<string, string> = {
    seo_audit: 'analytics',
    advanced_reporting: 'analytics',
    competitor_tracking: 'analytics',
    custom_dashboards: 'analytics',
    data_export: 'analytics',
    ai_content: 'content',
    ai_optimization: 'content',
    content_calendar: 'content',
    plagiarism_check: 'content',
    custom_domain: 'white_label',
    white_label: 'white_label',
    custom_branding: 'white_label',
    custom_email_templates: 'white_label',
    api_access: 'integrations',
    webhooks: 'integrations',
    zapier_integration: 'integrations',
    slack_integration: 'integrations',
    team_collaboration: 'general',
    bulk_operations: 'general',
    priority_support: 'general',
    sso: 'security',
    audit_logs: 'security',
    ip_whitelist: 'security'
  };
  
  return categoryMap[featureKey] || 'general';
}
