-- ============================================================
-- Phase V: White-Label Tenant System Migration
-- Multi-tenant database schema for God Mode Dashboard
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TENANTS TABLE
-- Core tenant information and branding configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    
    -- Branding Configuration (JSONB for flexibility)
    branding_config JSONB NOT NULL DEFAULT '{
        "colors": {
            "primary": "#00F2FF",
            "secondary": "#c8ff00",
            "background": "#000000",
            "surface": "#0a0a0a",
            "text": "#ffffff",
            "accent": "#00F2FF"
        },
        "typography": {
            "headingFont": "Inter",
            "bodyFont": "Inter"
        },
        "logo": {
            "url": null,
            "darkUrl": null,
            "favicon": null
        },
        "customCSS": null
    }'::jsonb,
    
    -- Domain Verification
    domain_verified BOOLEAN NOT NULL DEFAULT false,
    domain_verified_at TIMESTAMP WITH TIME ZONE,
    dns_records JSONB DEFAULT '[]'::jsonb,
    
    -- SSL/TLS Configuration
    ssl_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (ssl_status IN ('pending', 'active', 'error', 'renewing')),
    ssl_certificate_id VARCHAR(255),
    ssl_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Resource Limits
    max_audits INTEGER NOT NULL DEFAULT 100,
    max_users INTEGER NOT NULL DEFAULT 5,
    max_projects INTEGER NOT NULL DEFAULT 10,
    storage_limit_mb INTEGER NOT NULL DEFAULT 1024,
    
    -- Plan & Billing
    plan_id VARCHAR(100) DEFAULT 'starter',
    billing_email VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'trialing'
        CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled')),
    
    -- Metadata
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for tenants table
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- ============================================================
-- 2. FEATURE_OVERRIDES TABLE
-- Per-tenant feature flags and limits
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Feature identification
    feature_key VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (feature_category IN ('general', 'analytics', 'content', 'integrations', 'white_label')),
    
    -- Feature settings
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    limit_value INTEGER,
    limit_unit VARCHAR(50),
    
    -- Override metadata
    override_reason TEXT,
    overridden_by UUID,
    overridden_at TIMESTAMP WITH TIME ZONE,
    
    -- Effective dates
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_tenant_feature UNIQUE (tenant_id, feature_key)
);

-- Indexes for feature_overrides
CREATE INDEX IF NOT EXISTS idx_feature_overrides_tenant ON feature_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_key ON feature_overrides(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_category ON feature_overrides(feature_category);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_enabled ON feature_overrides(is_enabled);

-- ============================================================
-- 3. TENANT_USERS TABLE
-- User-tenant relationship with role-based access
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID,
    joined_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    department VARCHAR(100),
    title VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id)
);

-- Indexes for tenant_users
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_active ON tenant_users(is_active);

-- ============================================================
-- 4. UTM_TRACKING TABLE
-- Ghost Tracker for attribution persistence
-- ============================================================
CREATE TABLE IF NOT EXISTS utm_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Session identification
    session_id VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(255),
    
    -- UTM Parameters
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    
    -- Additional attribution
    referrer_url TEXT,
    landing_page TEXT,
    landing_page_path TEXT,
    
    -- Device/Client info
    user_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Tenant context
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    
    -- Conversion tracking
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2),
    conversion_type VARCHAR(100),
    
    -- Attribution window
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for utm_tracking
CREATE INDEX IF NOT EXISTS idx_utm_tracking_session ON utm_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_tenant ON utm_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_source ON utm_tracking(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_campaign ON utm_tracking(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_created ON utm_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_converted ON utm_tracking(converted_at) WHERE converted_at IS NOT NULL;

-- ============================================================
-- 5. TENANT_AUDIT_LOG TABLE
-- Track all tenant-related changes for compliance
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    
    -- Change tracking
    previous_values JSONB,
    new_values JSONB,
    
    -- Actor information
    performed_by UUID,
    performed_by_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant ON tenant_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_action ON tenant_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_created ON tenant_audit_log(created_at);

-- ============================================================
-- 6. TENANT_HEALTH_CHECKS TABLE
-- Real-time health monitoring per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Health metrics
    status VARCHAR(50) NOT NULL 
        CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    
    -- Resource usage
    storage_used_mb INTEGER DEFAULT 0,
    audits_count INTEGER DEFAULT 0,
    users_count INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    uptime_percentage DECIMAL(5,2),
    
    -- Last check details
    last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_details JSONB DEFAULT '{}'::jsonb,
    alerts JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for health checks
CREATE INDEX IF NOT EXISTS idx_tenant_health_tenant ON tenant_health_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_health_status ON tenant_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_tenant_health_check_at ON tenant_health_checks(last_check_at);

-- ============================================================
-- VIEWS FOR CONVENIENCE
-- ============================================================

-- View: Active tenants with feature summary
CREATE OR REPLACE VIEW v_tenants_with_features AS
SELECT 
    t.*,
    COUNT(DISTINCT tu.user_id) FILTER (WHERE tu.is_active = true) as active_users,
    COUNT(DISTINCT fo.feature_key) FILTER (WHERE fo.is_enabled = true) as enabled_features,
    jsonb_object_agg(
        fo.feature_key,
        jsonb_build_object(
            'enabled', fo.is_enabled,
            'limit', fo.limit_value
        )
    ) FILTER (WHERE fo.feature_key IS NOT NULL) as feature_summary
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
LEFT JOIN feature_overrides fo ON t.id = fo.tenant_id
GROUP BY t.id;

-- View: Tenant resource usage
CREATE OR REPLACE VIEW v_tenant_resource_usage AS
SELECT 
    t.id,
    t.name,
    t.slug,
    t.status,
    t.max_audits,
    t.max_users,
    t.max_projects,
    t.storage_limit_mb,
    COALESCE(th.audits_count, 0) as current_audits,
    COALESCE(th.users_count, 0) as current_users,
    COALESCE(th.projects_count, 0) as current_projects,
    COALESCE(th.storage_used_mb, 0) as current_storage,
    CASE 
        WHEN t.max_audits > 0 THEN ROUND((COALESCE(th.audits_count, 0)::numeric / t.max_audits) * 100, 2)
        ELSE 0 
    END as audits_usage_pct,
    CASE 
        WHEN t.max_users > 0 THEN ROUND((COALESCE(th.users_count, 0)::numeric / t.max_users) * 100, 2)
        ELSE 0 
    END as users_usage_pct,
    CASE 
        WHEN t.storage_limit_mb > 0 THEN ROUND((COALESCE(th.storage_used_mb, 0)::numeric / t.storage_limit_mb) * 100, 2)
        ELSE 0 
    END as storage_usage_pct
FROM tenants t
LEFT JOIN tenant_health_checks th ON t.id = th.tenant_id
WHERE th.id IS NULL OR th.last_check_at = (
    SELECT MAX(last_check_at) 
    FROM tenant_health_checks 
    WHERE tenant_id = t.id
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_overrides_updated_at 
    BEFORE UPDATE ON feature_overrides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at 
    BEFORE UPDATE ON tenant_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_utm_tracking_updated_at 
    BEFORE UPDATE ON utm_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Create default feature overrides for new tenant
CREATE OR REPLACE FUNCTION create_default_feature_overrides()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO feature_overrides (tenant_id, feature_key, feature_category, is_enabled, limit_value)
    VALUES 
        (NEW.id, 'seo_audit', 'analytics', true, NEW.max_audits),
        (NEW.id, 'ai_content', 'content', true, 100),
        (NEW.id, 'custom_domain', 'white_label', false, 1),
        (NEW.id, 'white_label', 'white_label', false, 1),
        (NEW.id, 'api_access', 'integrations', false, 1000),
        (NEW.id, 'team_collaboration', 'general', true, NEW.max_users),
        (NEW.id, 'advanced_reporting', 'analytics', false, 1),
        (NEW.id, 'competitor_tracking', 'analytics', false, 5),
        (NEW.id, 'priority_support', 'general', false, 1),
        (NEW.id, 'bulk_operations', 'general', false, 1);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_default_features
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_default_feature_overrides();

-- Function: Log tenant status changes
CREATE OR REPLACE FUNCTION log_tenant_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO tenant_audit_log (
            tenant_id, action, entity_type, entity_id,
            previous_values, new_values, metadata
        ) VALUES (
            NEW.id, 
            'status_change', 
            'tenant', 
            NEW.id,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status),
            jsonb_build_object('changed_at', NOW())
        );
        
        -- Update timestamp fields based on status
        IF NEW.status = 'active' AND OLD.status != 'active' THEN
            NEW.activated_at = NOW();
        ELSIF NEW.status = 'suspended' AND OLD.status != 'suspended' THEN
            NEW.suspended_at = NOW();
        ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            NEW.cancelled_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_log_tenant_status_change
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION log_tenant_status_change();

-- ============================================================
-- INITIAL DATA (Optional)
-- ============================================================

-- Create default tenant for platform owner
INSERT INTO tenants (
    name, 
    slug, 
    subdomain, 
    status,
    plan_id,
    max_audits,
    max_users,
    max_projects,
    subscription_status
) VALUES (
    'LocalRNK Platform',
    'localrnk',
    'platform',
    'active',
    'enterprise',
    999999,
    999,
    9999,
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE tenants IS 'Core tenant information for multi-tenant white-label system';
COMMENT ON TABLE feature_overrides IS 'Per-tenant feature flags and usage limits';
COMMENT ON TABLE tenant_users IS 'Many-to-many relationship between users and tenants with roles';
COMMENT ON TABLE utm_tracking IS 'Ghost tracker for UTM attribution persistence';
COMMENT ON TABLE tenant_audit_log IS 'Audit trail for all tenant-related changes';
COMMENT ON TABLE tenant_health_checks IS 'Real-time health monitoring per tenant';
