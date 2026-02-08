/**
 * Base44 Entities Index - 200X Optimized
 * All 10 entities exported for production use
 * 
 * @version 2.0.0
 * @status PRODUCTION READY
 */

// ============================================================================
// ENTITY EXPORTS
// ============================================================================

export type { Tenant } from './entity-definitions-200x';
export type { User } from './entity-definitions-200x';
export type { FeatureOverride } from './entity-definitions-200x';
export type { UTMSession } from './entity-definitions-200x';
export type { ResourceUsage } from './entity-definitions-200x';
export type { TenantHealthCheck } from './entity-definitions-200x';
export type { GodModeAuditLog } from './entity-definitions-200x';
export type { ErrorLog } from './entity-definitions-200x';
export type { PaymentTransaction } from './entity-definitions-200x';
export type { AuditLog } from './entity-definitions-200x';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  // Error handling
  EntityError,
  handleEntityError,
  
  // Query optimization
  buildOptimizedQuery,
  
  // Index definitions
  CRITICAL_INDEXES,
  HIGH_PRIORITY_INDEXES,
  MEDIUM_PRIORITY_INDEXES,
  
  // Default configs
  DEFAULT_TENANT_CONFIG,
  DEFAULT_USER_PREFERENCES,
} from './entity-definitions-200x';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { QueryOptions } from './entity-definitions-200x';

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Re-export from tenant-entities.ts for compatibility
export type {
  TenantUser,
  FeatureDefinition,
} from './tenant-entities';

export {
  DEFAULT_TENANT_CONFIG as LEGACY_DEFAULT_TENANT_CONFIG,
  FEATURE_DEFINITIONS,
  PLAN_PRESETS,
} from './tenant-entities';
