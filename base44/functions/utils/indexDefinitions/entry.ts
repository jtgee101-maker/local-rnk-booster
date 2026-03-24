/**
 * MongoDB Index Definitions for LocalRnk
 * 
 * These indexes are optimized for the most common query patterns.
 * Run the migration script to apply these indexes.
 */

export interface IndexDefinition {
  collection: string;
  name: string;
  keys: Record<string, 1 | -1 | 'text'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    expireAfterSeconds?: number;
    partialFilterExpression?: any;
  };
  description: string;
}

/**
 * Core indexes for all collections
 */
export const coreIndexes: IndexDefinition[] = [
  // ==================== USERS COLLECTION ====================
  {
    collection: 'users',
    name: 'idx_users_email_unique',
    keys: { email: 1 },
    options: { unique: true, sparse: true },
    description: 'Unique index on email for authentication lookups'
  },
  {
    collection: 'users',
    name: 'idx_users_role',
    keys: { role: 1 },
    options: {},
    description: 'Index for role-based queries (admin, user, etc.)'
  },
  {
    collection: 'users',
    name: 'idx_users_tenantId',
    keys: { tenantId: 1 },
    options: {},
    description: 'Index for tenant-scoped queries'
  },
  {
    collection: 'users',
    name: 'idx_users_createdAt',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for sorting by creation date'
  },
  {
    collection: 'users',
    name: 'idx_users_lastLoginAt',
    keys: { lastLoginAt: -1 },
    options: { sparse: true },
    description: 'Index for active user queries'
  },
  {
    collection: 'users',
    name: 'idx_users_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for filtering by user status'
  },
  {
    collection: 'users',
    name: 'idx_users_tenant_role',
    keys: { tenantId: 1, role: 1 },
    options: {},
    description: 'Compound index for tenant + role queries'
  },
  {
    collection: 'users',
    name: 'idx_users_email_verified',
    keys: { emailVerified: 1, createdAt: -1 },
    options: {},
    description: 'Compound index for email verification queries'
  },
  
  // ==================== TENANTS COLLECTION ====================
  {
    collection: 'tenants',
    name: 'idx_tenants_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for filtering tenants by status'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_plan',
    keys: { plan: 1 },
    options: {},
    description: 'Index for plan-based queries'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_domain',
    keys: { domain: 1 },
    options: { unique: true, sparse: true },
    description: 'Unique index for domain lookups'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_slug',
    keys: { slug: 1 },
    options: { unique: true },
    description: 'Unique index for slug lookups'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_status_plan',
    keys: { status: 1, plan: 1 },
    options: {},
    description: 'Compound index for status + plan filtering'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_createdAt',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for sorting tenants by creation date'
  },
  
  // ==================== ORDERS COLLECTION ====================
  {
    collection: 'orders',
    name: 'idx_orders_userId',
    keys: { userId: 1 },
    options: {},
    description: 'Index for user order lookups'
  },
  {
    collection: 'orders',
    name: 'idx_orders_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for status-based filtering'
  },
  {
    collection: 'orders',
    name: 'idx_orders_createdAt',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for chronological sorting'
  },
  {
    collection: 'orders',
    name: 'idx_orders_amount',
    keys: { amount: -1 },
    options: {},
    description: 'Index for revenue analytics'
  },
  {
    collection: 'orders',
    name: 'idx_orders_user_status',
    keys: { userId: 1, status: 1 },
    options: {},
    description: 'Compound index for user orders by status'
  },
  {
    collection: 'orders',
    name: 'idx_orders_status_created',
    keys: { status: 1, createdAt: -1 },
    options: {},
    description: 'Compound index for monthly revenue queries'
  },
  {
    collection: 'orders',
    name: 'idx_orders_tenant_status',
    keys: { tenantId: 1, status: 1 },
    options: {},
    description: 'Compound index for tenant revenue queries'
  },
  
  // ==================== LEADS COLLECTION ====================
  {
    collection: 'leads',
    name: 'idx_leads_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for lead status filtering'
  },
  {
    collection: 'leads',
    name: 'idx_leads_score',
    keys: { score: -1 },
    options: {},
    description: 'Index for sorting by lead score'
  },
  {
    collection: 'leads',
    name: 'idx_leads_source',
    keys: { source: 1 },
    options: {},
    description: 'Index for source-based queries'
  },
  {
    collection: 'leads',
    name: 'idx_leads_assignedTo',
    keys: { assignedTo: 1 },
    options: {},
    description: 'Index for assigned lead queries'
  },
  {
    collection: 'leads',
    name: 'idx_leads_status_score',
    keys: { status: 1, score: -1 },
    options: {},
    description: 'Compound index for high-scoring active leads'
  },
  {
    collection: 'leads',
    name: 'idx_leads_createdAt',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for recent leads queries'
  },
  {
    collection: 'leads',
    name: 'idx_leads_tenant',
    keys: { tenantId: 1 },
    options: {},
    description: 'Index for tenant-scoped lead queries'
  },
  
  // ==================== CAMPAIGNS COLLECTION ====================
  {
    collection: 'campaigns',
    name: 'idx_campaigns_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for campaign status filtering'
  },
  {
    collection: 'campaigns',
    name: 'idx_campaigns_startDate',
    keys: { startDate: 1 },
    options: {},
    description: 'Index for start date queries'
  },
  {
    collection: 'campaigns',
    name: 'idx_campaigns_endDate',
    keys: { endDate: 1 },
    options: {},
    description: 'Index for end date queries'
  },
  {
    collection: 'campaigns',
    name: 'idx_campaigns_status_dates',
    keys: { status: 1, startDate: 1, endDate: 1 },
    options: {},
    description: 'Compound index for active campaigns in date range'
  },
  {
    collection: 'campaigns',
    name: 'idx_campaigns_tenant',
    keys: { tenantId: 1 },
    options: {},
    description: 'Index for tenant-scoped campaigns'
  },
  
  // ==================== REVIEWS COLLECTION ====================
  {
    collection: 'reviews',
    name: 'idx_reviews_businessId',
    keys: { businessId: 1 },
    options: {},
    description: 'Index for business review lookups'
  },
  {
    collection: 'reviews',
    name: 'idx_reviews_rating',
    keys: { rating: -1 },
    description: 'Index for rating-based sorting'
  },
  {
    collection: 'reviews',
    name: 'idx_reviews_date',
    keys: { date: -1 },
    options: {},
    description: 'Index for recent reviews'
  },
  {
    collection: 'reviews',
    name: 'idx_reviews_business_rating',
    keys: { businessId: 1, rating: -1 },
    options: {},
    description: 'Compound index for business ratings'
  },
  {
    collection: 'reviews',
    name: 'idx_reviews_platform',
    keys: { platform: 1 },
    options: {},
    description: 'Index for platform filtering (Google, Yelp, etc.)'
  },
  
  // ==================== ERROR LOGS COLLECTION ====================
  {
    collection: 'errorLogs',
    name: 'idx_errorLogs_timestamp',
    keys: { timestamp: -1 },
    options: {},
    description: 'Index for recent error queries'
  },
  {
    collection: 'errorLogs',
    name: 'idx_errorLogs_severity',
    keys: { severity: 1 },
    options: {},
    description: 'Index for severity filtering'
  },
  {
    collection: 'errorLogs',
    name: 'idx_errorLogs_type',
    keys: { type: 1 },
    options: {},
    description: 'Index for error type filtering'
  },
  {
    collection: 'errorLogs',
    name: 'idx_errorLogs_severity_timestamp',
    keys: { severity: 1, timestamp: -1 },
    options: {},
    description: 'Compound index for high severity recent errors'
  },
  {
    collection: 'errorLogs',
    name: 'idx_errorLogs_ttl',
    keys: { timestamp: 1 },
    options: { expireAfterSeconds: 90 * 24 * 60 * 60 }, // 90 days
    description: 'TTL index for automatic error log cleanup'
  }
];

/**
 * Text search indexes for full-text search capabilities
 */
export const textIndexes: IndexDefinition[] = [
  {
    collection: 'users',
    name: 'idx_users_text_search',
    keys: { name: 'text', email: 'text', company: 'text' },
    options: { background: true },
    description: 'Full-text search index for users'
  },
  {
    collection: 'tenants',
    name: 'idx_tenants_text_search',
    keys: { name: 'text', slug: 'text', domain: 'text' },
    options: { background: true },
    description: 'Full-text search index for tenants'
  },
  {
    collection: 'leads',
    name: 'idx_leads_text_search',
    keys: { name: 'text', email: 'text', company: 'text', notes: 'text' },
    options: { background: true },
    description: 'Full-text search index for leads'
  },
  {
    collection: 'campaigns',
    name: 'idx_campaigns_text_search',
    keys: { name: 'text', description: 'text' },
    options: { background: true },
    description: 'Full-text search index for campaigns'
  }
];

/**
 * Entity indexes for base44 entity collections
 */
export const entityIndexes: IndexDefinition[] = [
  // Lead entity indexes
  {
    collection: 'Lead',
    name: 'idx_lead_entity_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for Lead entity status'
  },
  {
    collection: 'Lead',
    name: 'idx_lead_entity_score',
    keys: { score: -1 },
    options: {},
    description: 'Index for Lead entity score sorting'
  },
  {
    collection: 'Lead',
    name: 'idx_lead_entity_created',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for Lead entity creation date'
  },
  
  // EmailLog entity indexes
  {
    collection: 'EmailLog',
    name: 'idx_emaillog_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for EmailLog status'
  },
  {
    collection: 'EmailLog',
    name: 'idx_emaillog_sentAt',
    keys: { sentAt: -1 },
    options: {},
    description: 'Index for EmailLog sent date'
  },
  {
    collection: 'EmailLog',
    name: 'idx_emaillog_recipient',
    keys: { recipient: 1 },
    options: {},
    description: 'Index for EmailLog recipient lookups'
  },
  
  // ErrorLog entity indexes
  {
    collection: 'ErrorLog',
    name: 'idx_errorlog_entity_timestamp',
    keys: { timestamp: -1 },
    options: {},
    description: 'Index for ErrorLog entity timestamp'
  },
  {
    collection: 'ErrorLog',
    name: 'idx_errorlog_entity_severity',
    keys: { severity: 1 },
    options: {},
    description: 'Index for ErrorLog entity severity'
  },
  
  // Order entity indexes
  {
    collection: 'Order',
    name: 'idx_order_entity_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for Order entity status'
  },
  {
    collection: 'Order',
    name: 'idx_order_entity_created',
    keys: { createdAt: -1 },
    options: {},
    description: 'Index for Order entity creation date'
  },
  
  // Campaign entity indexes
  {
    collection: 'Campaign',
    name: 'idx_campaign_entity_status',
    keys: { status: 1 },
    options: {},
    description: 'Index for Campaign entity status'
  },
  
  // ConversionEvent indexes
  {
    collection: 'ConversionEvent',
    name: 'idx_conversion_event_type',
    keys: { eventType: 1 },
    options: {},
    description: 'Index for ConversionEvent type'
  },
  {
    collection: 'ConversionEvent',
    name: 'idx_conversion_event_timestamp',
    keys: { timestamp: -1 },
    options: {},
    description: 'Index for ConversionEvent timestamp'
  }
];

/**
 * Analytics indexes for reporting queries
 */
export const analyticsIndexes: IndexDefinition[] = [
  {
    collection: 'orders',
    name: 'idx_orders_analytics_revenue',
    keys: { status: 1, createdAt: -1, amount: 1 },
    options: {},
    description: 'Index for revenue analytics aggregation'
  },
  {
    collection: 'ConversionEvent',
    name: 'idx_conversion_analytics_funnel',
    keys: { sessionId: 1, timestamp: 1, eventName: 1 },
    options: {},
    description: 'Index for funnel analysis queries'
  },
  {
    collection: 'UserBehavior',
    name: 'idx_userbehavior_analytics',
    keys: { userId: 1, timestamp: -1, action: 1 },
    options: {},
    description: 'Index for user behavior analytics'
  }
];

/**
 * All indexes combined
 */
export const allIndexes = [
  ...coreIndexes,
  ...textIndexes,
  ...entityIndexes,
  ...analyticsIndexes
];

/**
 * Get indexes for a specific collection
 */
export function getCollectionIndexes(collectionName: string): IndexDefinition[] {
  return allIndexes.filter(idx => idx.collection === collectionName);
}

/**
 * Get index creation order (respects dependencies)
 */
export function getIndexCreationOrder(): string[] {
  const order = [
    'users',
    'tenants',
    'orders',
    'leads',
    'campaigns',
    'reviews',
    'errorLogs',
    'Lead',
    'EmailLog',
    'ErrorLog',
    'Order',
    'Campaign',
    'ConversionEvent',
    'UserBehavior'
  ];
  return order;
}

export default allIndexes;
