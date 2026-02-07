# Phase V: White-Label Tenant System (God Mode Dashboard)

## Overview

The White-Label Tenant System enables LocalRNK to operate as a true multi-tenant SaaS platform, allowing resellers and enterprise clients to run their own branded instances with custom domains, feature configurations, and resource limits.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GOD MODE DASHBOARD                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ TenantList   │  │FeatureToggles│  │   ResourceLimits     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT MIDDLEWARE                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Subdomain  │  │Custom Domain │  │  Feature Flag Check  │  │
│  │  Detection   │  │  Detection   │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ tenants  │ │feature_over- │ │tenant_    │ │  utm_tracking│  │
│  │          │ │   rides      │ │  users    │ │              │  │
│  └──────────┘ └──────────────┘ └───────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. tenants
Core tenant information and configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Tenant display name |
| slug | VARCHAR(100) | URL-friendly identifier |
| subdomain | VARCHAR(100) | *.localrnk.io subdomain |
| custom_domain | VARCHAR(255) | Custom domain (optional) |
| status | ENUM | pending, active, suspended, cancelled |
| branding_config | JSONB | Colors, logos, typography |
| domain_verified | BOOLEAN | DNS verification status |
| ssl_status | ENUM | pending, active, error, renewing |
| max_audits | INTEGER | Monthly audit limit |
| max_users | INTEGER | Team size limit |
| max_projects | INTEGER | Project limit |
| storage_limit_mb | INTEGER | Storage quota |
| plan_id | VARCHAR(100) | Subscription tier |

### 2. feature_overrides
Per-tenant feature flags and limits.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| feature_key | VARCHAR(100) | Feature identifier |
| feature_category | ENUM | general, analytics, content, integrations, white_label |
| is_enabled | BOOLEAN | Feature toggle |
| limit_value | INTEGER | Usage limit (optional) |
| effective_from | TIMESTAMP | When override starts |
| effective_until | TIMESTAMP | When override expires |

### 3. tenant_users
User-tenant relationship with RBAC.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| tenant_id | UUID | FK to tenants |
| role | ENUM | owner, admin, manager, member, viewer |
| permissions | JSONB | Granular permissions |
| is_active | BOOLEAN | User status |

### 4. utm_tracking
Attribution persistence (Ghost Tracker).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | VARCHAR(255) | Anonymous session |
| utm_source | VARCHAR(255) | Traffic source |
| utm_medium | VARCHAR(255) | Marketing medium |
| utm_campaign | VARCHAR(255) | Campaign name |
| first_seen_at | TIMESTAMP | Initial visit |
| converted_at | TIMESTAMP | Conversion timestamp |
| conversion_value | DECIMAL | Revenue amount |

## API Endpoints

### Tenant Management

```
POST   /api/tenants                    # Create new tenant
GET    /api/tenants/:id                # Get tenant details
PUT    /api/tenants/:id                # Update tenant
DELETE /api/tenants/:id                # Delete tenant
```

### Domain Management

```
GET    /api/tenants/:id/domain/status  # Check domain status
POST   /api/tenants/:id/domain/verify  # Verify DNS records
POST   /api/tenants/:id/domain/ssl     # Provision SSL
POST   /api/tenants/:id/domain         # Add/remove custom domain
```

### Feature Management

```
GET    /api/tenants/:id/features       # List tenant features
PUT    /api/tenants/:id/features/:key  # Update feature toggle
```

### Tenant Context

```
GET    /api/tenant/context             # Get current tenant context
GET    /api/tenant/features/:key       # Check specific feature
POST   /api/tenant/clear-cache         # Clear tenant cache (admin)
```

## Components

### TenantList
- Displays all tenants with status indicators
- Quick actions: suspend, activate, delete
- Health monitoring indicators
- Search and filter capabilities

### FeatureToggles
- Category-based feature organization
- Enable/disable individual features
- Set usage limits per feature
- Bulk enable/disable operations

### ResourceLimits
- Interactive sliders for resource allocation
- Visual usage indicators
- Plan preset quick-apply
- Real-time quota monitoring

## React Hooks

### useFeatureEnabled
```javascript
const { enabled, loading } = useFeatureEnabled('ai_content');
```

### useFeatureQuota
```javascript
const { allowed, remaining, limit } = useFeatureQuota('seo_audit');
```

### useGatedFeature
```javascript
const GatedComponent = useGatedFeature(
  'white_label',
  PremiumFeature,
  UpgradePrompt
);
```

### withFeature (HOC)
```javascript
const GatedAnalytics = withFeature('advanced_reporting', {
  fallback: BasicAnalytics
})(AnalyticsDashboard);
```

## Multi-Tenant Middleware

### Subdomain Detection
```
app.localrnk.io      → Tenant: app
tenant.example.com   → Custom domain lookup
```

### Feature Flag Checking
```typescript
const context = await tenantMiddleware(req, {
  requireTenant: true,
  requiredFeatures: ['white_label', 'custom_domain']
});
```

### Caching Strategy
- Tenant cache: 5 minutes TTL
- Feature cache: 5 minutes TTL
- Cache invalidation on admin updates

## Custom Domain Automation

### DNS Verification
1. User adds CNAME/A record
2. System queries Google DNS API
3. Validates record matches expected
4. Updates tenant.domain_verified

### SSL Provisioning
1. Domain verified → Trigger SSL
2. Attempt Netlify SSL first
3. Fallback to Cloudflare if needed
4. Poll until active or error

### Expected DNS Records

**Subdomain (CNAME)**:
```
app.example.com CNAME localrnk.netlify.app
```

**Apex Domain (A Record)**:
```
@ A 75.2.60.5
www A 75.2.60.5
```

## UTM Ghost Tracker

### Data Persistence
- localStorage: Primary storage
- Cookie: Cross-domain fallback
- TTL: 30 days

### Attribution Model
- First touch: Original UTM params
- Last touch: Most recent UTM params
- Referrer: Document.referrer tracking

### Form Injection
```javascript
// Automatically injects hidden fields:
<input type="hidden" name="utm_source" value="google">
<input type="hidden" name="utm_medium" value="cpc">
<input type="hidden" name="utm_campaign" value="spring_sale">
<input type="hidden" name="utm_session_id" value="lrnk_abc123">
```

## Branding Injection

### CSS Variables
```css
:root {
  --tenant-primary: #00F2FF;
  --tenant-secondary: #c8ff00;
  --tenant-background: #000000;
  --tenant-surface: #0a0a0a;
  --tenant-text: #ffffff;
}
```

### Runtime Injection
```javascript
// Injects tenant branding on page load
const applyTenantBranding = (config) => {
  const root = document.documentElement;
  root.style.setProperty('--tenant-primary', config.colors.primary);
  // ... apply all branding properties
};
```

## Security Considerations

### Tenant Isolation
- Row-level security in database
- Subdomain validation regex
- Domain ownership verification

### Feature Enforcement
- Server-side feature checks
- Rate limiting per tenant
- Resource quota enforcement

### Audit Logging
All tenant changes logged to `tenant_audit_log`:
- Who made the change
- What was changed
- When it occurred
- IP and user agent

## Deployment Checklist

### Database
- [ ] Run migration: `001_tenants_schema.sql`
- [ ] Verify indexes created
- [ ] Check trigger functions

### Environment Variables
```
NETLIFY_API_TOKEN=xxx
NETLIFY_SITE_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx
```

### Functions
- [ ] Deploy `tenantContext.ts`
- [ ] Deploy `createTenant.ts`
- [ ] Deploy `verifyDomain.ts`

### Frontend
- [ ] Include `utm-tracker.js` in HTML head
- [ ] Add FeatureProvider to app root
- [ ] Implement tenant branding injection

## Testing

### Unit Tests
```bash
npm test -- --grep "tenant"
```

### Integration Tests
```bash
npm run test:integration:tenants
```

### Manual Testing
1. Create test tenant
2. Verify subdomain works
3. Add custom domain
4. Verify DNS
5. Test SSL provisioning
6. Toggle features
7. Check resource limits

## Troubleshooting

### Domain not verifying
- Check DNS propagation: `dig CNAME custom.domain.com`
- Verify correct record type (CNAME vs A)
- Wait 24 hours for full propagation

### Features not loading
- Check tenant context API response
- Verify feature overrides exist
- Clear tenant cache

### SSL errors
- Check Netlify/Cloudflare API keys
- Verify domain ownership
- Review SSL logs in database

## Future Enhancements

- [ ] Custom SSL certificates
- [ ] Advanced attribution models
- [ ] Tenant-level API keys
- [ ] White-label email sending
- [ ] Multi-region deployment
- [ ] Automated tenant backups
