/**
 * Base44 Entities - White-Label Tenant System
 * Phase V: God Mode Dashboard Backend
 * 
 * These entities power the multi-tenant white-label system.
 * Deploy with: npx base44 entities deploy
 */

// Tenant Entity - Core white-label customer data
export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string; // URL-friendly identifier
  subdomain: string; // *.localrnk.io
  custom_domain?: string; // Custom domain (optional)
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  
  // Branding
  branding_config: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      accent: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
    };
    logo: {
      url?: string;
      darkUrl?: string;
      favicon?: string;
    };
    customCSS?: string;
  };
  
  // Domain verification
  domain_verified: boolean;
  domain_verified_at?: string; // ISO timestamp
  dns_records: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  
  // SSL
  ssl_status: 'pending' | 'active' | 'error' | 'renewing';
  ssl_certificate_id?: string;
  ssl_expires_at?: string;
  
  // Resource limits
  max_audits: number;
  max_users: number;
  max_projects: number;
  storage_limit_mb: number;
  
  // Billing
  plan_id: string;
  billing_email?: string;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  
  // Metadata
  settings: Record<string, any>;
  metadata: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  activated_at?: string;
  suspended_at?: string;
  cancelled_at?: string;
}

// Feature Override Entity - Per-tenant feature toggles
export interface FeatureOverride {
  id: string;
  tenant_id: string; // Reference to Tenant
  
  feature_key: string;
  feature_category: 'general' | 'analytics' | 'content' | 'integrations' | 'white_label';
  
  is_enabled: boolean;
  limit_value?: number; // Optional numeric limit
  
  // Scheduling
  effective_from?: string;
  effective_until?: string;
  
  created_at: string;
  updated_at: string;
}

// Feature Definition Entity - Available features catalog
export interface FeatureDefinition {
  id: string;
  feature_key: string; // Unique identifier
  feature_name: string; // Human readable
  description: string;
  
  category: 'general' | 'analytics' | 'content' | 'integrations' | 'white_label';
  
  default_enabled: boolean;
  requires_limit: boolean;
  default_limit?: number;
  
  created_at: string;
}

// Tenant User Entity - User-tenant relationship with RBAC
export interface TenantUser {
  id: string;
  tenant_id: string; // Reference to Tenant
  user_id: string; // Reference to User (auth system)
  
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  permissions: string[]; // Granular permissions
  
  is_active: boolean;
  invited_by?: string;
  
  joined_at: string;
  last_active_at?: string;
}

// UTM Session Entity - Attribution tracking (Ghost Tracker)
export interface UTMSession {
  id: string;
  session_id: string; // Anonymous session identifier
  tenant_id?: string; // Optional tenant context
  
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Additional tracking
  referrer_url?: string;
  landing_page: string;
  ip_address?: string;
  user_agent?: string;
  
  city?: string;
  niche?: string;
  
  // Conversion tracking
  converted: boolean;
  conversion_value?: number;
  converted_at?: string;
  
  // Timestamps
  created_at: string;
  expires_at: string; // 30 days from creation
}

// Resource Usage Entity - Track consumption per tenant
export interface ResourceUsage {
  id: string;
  tenant_id: string;
  
  resource_type: 'seo_audits' | 'emails_sent' | 'api_calls' | 'storage_mb' | 'ai_generations';
  usage_count: number;
  usage_date: string; // YYYY-MM-DD
  
  created_at: string;
  updated_at: string;
}

// Tenant Health Check Entity - Monitoring
export interface TenantHealthCheck {
  id: string;
  tenant_id: string;
  
  // Metrics
  audits_count: number;
  users_count: number;
  projects_count: number;
  storage_used_mb: number;
  
  // Health status
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  last_error?: string;
  last_error_at?: string;
  
  // Performance
  avg_response_time_ms?: number;
  error_rate?: number;
  
  checked_at: string;
  created_at: string;
}

// God Mode Audit Log - Admin actions
export interface GodModeAuditLog {
  id: string;
  admin_user_id: string;
  tenant_id?: string;
  
  action: 
    | 'tenant_created' 
    | 'tenant_updated' 
    | 'tenant_deleted'
    | 'tenant_suspended'
    | 'tenant_activated'
    | 'feature_toggled'
    | 'limit_changed'
    | 'domain_verified'
    | 'ssl_provisioned';
  
  action_details: Record<string, any>;
  
  ip_address?: string;
  user_agent?: string;
  
  created_at: string;
}

// Default configurations
export const DEFAULT_TENANT_CONFIG = {
  branding_config: {
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
  },
  max_audits: 100,
  max_users: 5,
  max_projects: 10,
  storage_limit_mb: 1024,
  plan_id: 'starter',
  status: 'pending'
};

// Feature definitions for seeding
export const FEATURE_DEFINITIONS = [
  {
    feature_key: 'seo_audit',
    feature_name: 'SEO Audit',
    description: 'Run comprehensive SEO audits on websites',
    category: 'analytics',
    default_enabled: true,
    requires_limit: true,
    default_limit: 100
  },
  {
    feature_key: 'ai_content',
    feature_name: 'AI Content Generation',
    description: 'Generate content using AI',
    category: 'content',
    default_enabled: false,
    requires_limit: true,
    default_limit: 50
  },
  {
    feature_key: 'custom_domain',
    feature_name: 'Custom Domain',
    description: 'Use your own domain name',
    category: 'white_label',
    default_enabled: false,
    requires_limit: false
  },
  {
    feature_key: 'white_label',
    feature_name: 'White Label Mode',
    description: 'Remove LocalRNK branding',
    category: 'white_label',
    default_enabled: false,
    requires_limit: false
  },
  {
    feature_key: 'api_access',
    feature_name: 'API Access',
    description: 'Access to REST API',
    category: 'integrations',
    default_enabled: false,
    requires_limit: true,
    default_limit: 1000
  },
  {
    feature_key: 'priority_support',
    feature_name: 'Priority Support',
    description: 'Priority customer support',
    category: 'general',
    default_enabled: false,
    requires_limit: false
  }
];

// Plan presets
export const PLAN_PRESETS = {
  starter: {
    name: 'Starter',
    max_audits: 100,
    max_users: 3,
    max_projects: 10,
    storage_limit_mb: 1024,
    features: ['seo_audit']
  },
  growth: {
    name: 'Growth',
    max_audits: 500,
    max_users: 10,
    max_projects: 50,
    storage_limit_mb: 5120,
    features: ['seo_audit', 'ai_content', 'api_access']
  },
  pro: {
    name: 'Pro',
    max_audits: 2000,
    max_users: 25,
    max_projects: 200,
    storage_limit_mb: 51200,
    features: ['seo_audit', 'ai_content', 'api_access', 'custom_domain']
  },
  enterprise: {
    name: 'Enterprise',
    max_audits: 10000,
    max_users: 100,
    max_projects: 500,
    storage_limit_mb: 102400,
    features: ['seo_audit', 'ai_content', 'api_access', 'custom_domain', 'white_label', 'priority_support']
  }
};
