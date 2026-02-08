/**
 * Base44 Entity Index Definitions
 * 200X Performance Optimization
 * 
 * These indexes should be created in Base44 dashboard for optimal query performance
 * Critical for: Tenant lookups, User queries, Analytics, and Multi-tenancy
 */

// ============================================================================
// TENANT ENTITY INDEXES
// ============================================================================

/**
 * INDEX: tenant_slug_idx
 * Fields: slug (ascending)
 * Type: Unique
 * Purpose: Fast tenant lookup by URL slug
 * Query: Tenant.filter({ slug: 'acme-corp' })
 */

/**
 * INDEX: tenant_subdomain_idx  
 * Fields: subdomain (ascending)
 * Type: Unique
 * Purpose: Fast tenant lookup by subdomain
 * Query: Tenant.filter({ subdomain: 'acme' })
 */

/**
 * INDEX: tenant_custom_domain_idx
 * Fields: custom_domain (ascending)
 * Type: Unique, Sparse
 * Purpose: Fast tenant lookup by custom domain
 * Query: Tenant.filter({ custom_domain: 'app.acme.com' })
 */

/**
 * INDEX: tenant_status_idx
 * Fields: status (ascending), created_at (descending)
 * Type: Compound
 * Purpose: List tenants by status (for admin dashboard)
 * Query: Tenant.filter({ status: 'active' }, '-created_at')
 */

/**
 * INDEX: tenant_plan_idx
 * Fields: plan_id (ascending), status (ascending)
 * Type: Compound
 * Purpose: Analytics by plan type
 * Query: Tenant.filter({ plan_id: 'pro', status: 'active' })
 */

// ============================================================================
// FEATURE OVERRIDE INDEXES
// ============================================================================

/**
 * INDEX: feature_override_lookup_idx
 * Fields: tenant_id (ascending), feature_key (ascending)
 * Type: Compound, Unique
 * Purpose: Fast feature check for tenant
 * Query: FeatureOverride.filter({ tenant_id: 'xxx', feature_key: 'analytics' })
 * Impact: Critical for every feature check
 */

/**
 * INDEX: feature_override_category_idx
 * Fields: tenant_id (ascending), feature_category (ascending)
 * Type: Compound
 * Purpose: List features by category
 * Query: FeatureOverride.filter({ tenant_id: 'xxx', feature_category: 'analytics' })
 */

// ============================================================================
// TENANT USER INDEXES
// ============================================================================

/**
 * INDEX: tenant_user_membership_idx
 * Fields: tenant_id (ascending), user_id (ascending)
 * Type: Compound, Unique
 * Purpose: Check if user belongs to tenant
 * Query: TenantUser.filter({ tenant_id: 'xxx', user_id: 'yyy' })
 * Impact: Critical for auth checks
 */

/**
 * INDEX: user_tenants_idx
 * Fields: user_id (ascending), is_active (ascending)
 * Type: Compound
 * Purpose: List all tenants for a user
 * Query: TenantUser.filter({ user_id: 'xxx', is_active: true })
 */

/**
 * INDEX: tenant_members_idx
 * Fields: tenant_id (ascending), role (ascending), joined_at (descending)
 * Type: Compound
 * Purpose: List tenant members with roles
 * Query: TenantUser.filter({ tenant_id: 'xxx' }, '-joined_at')
 */

// ============================================================================
// UTM SESSION INDEXES
// ============================================================================

/**
 * INDEX: utm_session_lookup_idx
 * Fields: session_id (ascending)
 * Type: Unique
 * Purpose: Fast session lookup
 * Query: UTMSession.filter({ session_id: 'xxx' })
 */

/**
 * INDEX: utm_tenant_tracking_idx
 * Fields: tenant_id (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Analytics by tenant
 * Query: UTMSession.filter({ tenant_id: 'xxx' }, '-created_at')
 */

/**
 * INDEX: utm_conversion_idx
 * Fields: tenant_id (ascending), converted (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Conversion tracking
 * Query: UTMSession.filter({ tenant_id: 'xxx', converted: true })
 */

/**
 * INDEX: utm_campaign_idx
 * Fields: utm_campaign (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Campaign performance
 * Query: UTMSession.filter({ utm_campaign: 'spring-sale' }, '-created_at')
 */

/**
 * INDEX: utm_source_idx
 * Fields: utm_source (ascending), utm_medium (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Traffic source analysis
 * Query: UTMSession.filter({ utm_source: 'google', utm_medium: 'cpc' })
 */

/**
 * INDEX: utm_expiry_idx
 * Fields: expires_at (ascending)
 * Type: Standard
 * Purpose: Cleanup expired sessions
 * Query: UTMSession.filter({ expires_at: { $lt: now } })
 */

// ============================================================================
// RESOURCE USAGE INDEXES
// ============================================================================

/**
 * INDEX: resource_usage_daily_idx
 * Fields: tenant_id (ascending), resource_type (ascending), usage_date (descending)
 * Type: Compound, Unique
 * Purpose: Daily usage tracking
 * Query: ResourceUsage.filter({ tenant_id: 'xxx', resource_type: 'api_calls', usage_date: '2026-02-08' })
 */

/**
 * INDEX: resource_usage_analytics_idx
 * Fields: tenant_id (ascending), resource_type (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Usage analytics over time
 * Query: ResourceUsage.filter({ tenant_id: 'xxx', resource_type: 'storage_mb' }, '-created_at')
 */

// ============================================================================
// TENANT HEALTH CHECK INDEXES
// ============================================================================

/**
 * INDEX: health_check_latest_idx
 * Fields: tenant_id (ascending), checked_at (descending)
 * Type: Compound
 * Purpose: Get latest health check
 * Query: TenantHealthCheck.filter({ tenant_id: 'xxx' }, '-checked_at', 1)
 */

/**
 * INDEX: health_status_idx
 * Fields: overall_status (ascending), checked_at (descending)
 * Type: Compound
 * Purpose: Find unhealthy tenants
 * Query: TenantHealthCheck.filter({ overall_status: 'unhealthy' }, '-checked_at')
 */

// ============================================================================
// GOD MODE AUDIT LOG INDEXES
// ============================================================================

/**
 * INDEX: audit_log_tenant_idx
 * Fields: tenant_id (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Tenant audit history
 * Query: GodModeAuditLog.filter({ tenant_id: 'xxx' }, '-created_at')
 */

/**
 * INDEX: audit_log_admin_idx
 * Fields: admin_user_id (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Admin action history
 * Query: GodModeAuditLog.filter({ admin_user_id: 'xxx' }, '-created_at')
 */

/**
 * INDEX: audit_log_action_idx
 * Fields: action (ascending), created_at (descending)
 * Type: Compound
 * Purpose: Filter by action type
 * Query: GodModeAuditLog.filter({ action: 'tenant_suspended' }, '-created_at')
 */

// ============================================================================
// PRIORITY INDEXES (Create These First)
// ============================================================================

/**
 * CRITICAL - Create immediately:
 * 1. tenant_slug_idx (unique lookups)
 * 2. tenant_subdomain_idx (unique lookups)
 * 3. feature_override_lookup_idx (every feature check)
 * 4. tenant_user_membership_idx (auth checks)
 * 5. utm_session_lookup_idx (session tracking)
 * 6. resource_usage_daily_idx (billing)
 */

/**
 * HIGH PRIORITY - Create next:
 * 7. tenant_custom_domain_idx (custom domains)
 * 8. user_tenants_idx (user dashboard)
 * 9. utm_tenant_tracking_idx (analytics)
 * 10. health_check_latest_idx (monitoring)
 */

/**
 * MEDIUM PRIORITY - Create when needed:
 * 11-20. Remaining indexes for analytics and reporting
 */

// ============================================================================
// EXPECTED PERFORMANCE IMPROVEMENTS
// ============================================================================

/**
 * Without indexes:
 * - Tenant lookup by slug: ~500ms (full collection scan)
 * - Feature check: ~300ms (compound query scan)
 * - User membership: ~400ms (multi-field scan)
 * - Analytics queries: ~1000ms+ (aggregation scans)
 * 
 * With indexes:
 * - Tenant lookup by slug: ~10ms (index hit)
 * - Feature check: ~5ms (compound index hit)
 * - User membership: ~10ms (index hit)
 * - Analytics queries: ~50ms (covered queries)
 * 
 * Overall improvement: 20-50x faster queries
 */
