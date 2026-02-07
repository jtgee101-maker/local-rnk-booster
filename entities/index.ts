// Tenant Entity - Core white-label customer
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  custom_domain?: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  branding_config: object;
  domain_verified: boolean;
  ssl_status: 'pending' | 'active' | 'error' | 'renewing';
  max_audits: number;
  max_users: number;
  max_projects: number;
  storage_limit_mb: number;
  plan_id: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

// Feature Override - Per-tenant feature toggles
export interface FeatureOverride {
  id: string;
  tenant_id: string;
  feature_key: string;
  feature_category: string;
  is_enabled: boolean;
  limit_value?: number;
  created_at: string;
  updated_at: string;
}

// Tenant User - User membership in tenant
export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  is_active: boolean;
  joined_at: string;
}

// UTM Session - Attribution tracking
export interface UTMSession {
  id: string;
  session_id: string;
  tenant_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page: string;
  converted: boolean;
  created_at: string;
  expires_at: string;
}

// Resource Usage - Consumption tracking
export interface ResourceUsage {
  id: string;
  tenant_id: string;
  resource_type: string;
  usage_count: number;
  usage_date: string;
}

// Tenant Health Check - Monitoring
export interface TenantHealthCheck {
  id: string;
  tenant_id: string;
  audits_count: number;
  users_count: number;
  projects_count: number;
  storage_used_mb: number;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  checked_at: string;
}

// God Mode Audit Log - Admin actions
export interface GodModeAuditLog {
  id: string;
  admin_user_id: string;
  tenant_id?: string;
  action: string;
  action_details: object;
  created_at: string;
}
