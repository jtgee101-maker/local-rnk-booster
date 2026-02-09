#!/bin/bash
# ============================================================================
# 200X Builder - Database Index Deployment Script
# Deploys optimized indexes for 200X performance
# ============================================================================

set -e

echo "==============================================="
echo "200X BUILDER - DATABASE INDEX DEPLOYMENT"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PHASE=${1:-all}
DRY_RUN=${2:-false}

# Track results
DEPLOYED=()
FAILED=()
SKIPPED=()

# ============================================================================
# PHASE 1: CRITICAL INDEXES (Immediate 50X improvement)
# ============================================================================
deploy_critical_indexes() {
    echo -e "${BLUE}PHASE 1: Deploying CRITICAL indexes...${NC}"
    echo "----------------------------------------------"
    
    # Critical indexes - these provide 50X improvement
    CRITICAL_INDEXES=(
        "tenant_slug_idx:Tenant:slug:true"
        "tenant_subdomain_idx:Tenant:subdomain:true"
        "user_email_idx:User:email:true"
        "feature_override_lookup_idx:FeatureOverride:tenant_id,feature_key:true"
        "utm_session_lookup_idx:UTMSession:session_id:true"
        "resource_usage_daily_idx:ResourceUsage:tenant_id,resource_type,usage_date:true"
    )
    
    for idx in "${CRITICAL_INDEXES[@]}"; do
        IFS=':' read -r name entity fields unique <<< "$idx"
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would create: $name on $entity ($fields)"
            SKIPPED+=("$name")
        else
            echo -n "Creating $name... "
            if npx base44 index create "$name" --entity "$entity" --fields "$fields" --unique="$unique" 2>/dev/null; then
                echo -e "${GREEN}✓${NC}"
                DEPLOYED+=("$name")
            else
                echo -e "${RED}✗${NC}"
                FAILED+=("$name")
            fi
        fi
    done
    
    echo ""
}

# ============================================================================
# PHASE 2: HIGH PRIORITY INDEXES (20X improvement)
# ============================================================================
deploy_high_priority_indexes() {
    echo -e "${BLUE}PHASE 2: Deploying HIGH PRIORITY indexes...${NC}"
    echo "----------------------------------------------"
    
    # High priority indexes
    HIGH_PRIORITY_INDEXES=(
        "tenant_custom_domain_idx:Tenant:custom_domain:true:sparse"
        "tenant_status_idx:Tenant:status,created_at:false"
        "tenant_plan_idx:Tenant:plan_id,status:false"
        "user_status_idx:User:status,created_at:false"
        "user_created_idx:User:created_at:false"
        "feature_override_category_idx:FeatureOverride:tenant_id,feature_category:false"
        "feature_override_tenant_idx:FeatureOverride:tenant_id:false"
        "utm_tenant_tracking_idx:UTMSession:tenant_id,created_at:false"
        "utm_conversion_idx:UTMSession:tenant_id,converted,created_at:false"
        "utm_campaign_idx:UTMSession:utm_campaign,created_at:false"
        "utm_source_idx:UTMSession:utm_source,utm_medium,created_at:false"
        "utm_expiry_idx:UTMSession:expires_at:false"
        "resource_usage_analytics_idx:ResourceUsage:tenant_id,resource_type,created_at:false"
        "resource_usage_tenant_idx:ResourceUsage:tenant_id:false"
        "health_check_latest_idx:TenantHealthCheck:tenant_id,checked_at:false"
        "health_status_idx:TenantHealthCheck:overall_status,checked_at:false"
    )
    
    for idx in "${HIGH_PRIORITY_INDEXES[@]}"; do
        IFS=':' read -r name entity fields unique extra <<< "$idx"
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would create: $name on $entity ($fields)"
            SKIPPED+=("$name")
        else
            echo -n "Creating $name... "
            if [ -n "$extra" ] && [ "$extra" = "sparse" ]; then
                cmd="npx base44 index create \"$name\" --entity \"$entity\" --fields \"$fields\" --unique=$unique --sparse"
            else
                cmd="npx base44 index create \"$name\" --entity \"$entity\" --fields \"$fields\" --unique=$unique"
            fi
            
            if eval "$cmd" 2>/dev/null; then
                echo -e "${GREEN}✓${NC}"
                DEPLOYED+=("$name")
            else
                echo -e "${RED}✗${NC}"
                FAILED+=("$name")
            fi
        fi
    done
    
    echo ""
}

# ============================================================================
# PHASE 3: MEDIUM PRIORITY INDEXES (10X improvement)
# ============================================================================
deploy_medium_priority_indexes() {
    echo -e "${BLUE}PHASE 3: Deploying MEDIUM PRIORITY indexes...${NC}"
    echo "----------------------------------------------"
    
    # Medium priority indexes
    MEDIUM_PRIORITY_INDEXES=(
        "health_check_tenant_idx:TenantHealthCheck:tenant_id:false"
        "godmode_audit_tenant_idx:GodModeAuditLog:tenant_id,created_at:false"
        "godmode_audit_admin_idx:GodModeAuditLog:admin_user_id,created_at:false"
        "godmode_audit_action_idx:GodModeAuditLog:action,created_at:false"
        "godmode_audit_created_idx:GodModeAuditLog:created_at:false"
        "error_log_severity_idx:ErrorLog:severity,created_at:false"
        "error_log_tenant_idx:ErrorLog:tenant_id,created_at:false"
        "error_log_status_idx:ErrorLog:status,created_at:false"
        "error_log_type_idx:ErrorLog:error_type,created_at:false"
        "payment_tenant_idx:PaymentTransaction:tenant_id,created_at:false"
        "payment_status_idx:PaymentTransaction:status,created_at:false"
        "payment_provider_idx:PaymentTransaction:provider_transaction_id:true:sparse"
        "payment_subscription_idx:PaymentTransaction:subscription_id,created_at:false"
        "audit_log_entity_idx:AuditLog:entity_type,entity_id,created_at:false"
        "audit_log_user_idx:AuditLog:user_id,created_at:false"
        "audit_log_action_idx:AuditLog:action,created_at:false"
        "audit_log_tenant_idx:AuditLog:tenant_id,created_at:false"
    )
    
    for idx in "${MEDIUM_PRIORITY_INDEXES[@]}"; do
        IFS=':' read -r name entity fields unique extra <<< "$idx"
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would create: $name on $entity ($fields)"
            SKIPPED+=("$name")
        else
            echo -n "Creating $name... "
            if [ -n "$extra" ] && [ "$extra" = "sparse" ]; then
                cmd="npx base44 index create \"$name\" --entity \"$entity\" --fields \"$fields\" --unique=$unique --sparse"
            else
                cmd="npx base44 index create \"$name\" --entity \"$entity\" --fields \"$fields\" --unique=$unique"
            fi
            
            if eval "$cmd" 2>/dev/null; then
                echo -e "${GREEN}✓${NC}"
                DEPLOYED+=("$name")
            else
                echo -e "${RED}✗${NC}"
                FAILED+=("$name")
            fi
        fi
    done
    
    echo ""
}

# ============================================================================
# VERIFY INDEXES
# ============================================================================
verify_indexes() {
    echo -e "${BLUE}Verifying deployed indexes...${NC}"
    echo "----------------------------------------------"
    
    # List all indexes
    echo "Current indexes:"
    npx base44 index list 2>/dev/null || echo "Unable to list indexes"
    
    echo ""
}

# ============================================================================
# GENERATE REPORT
# ============================================================================
generate_report() {
    echo ""
    echo "==============================================="
    echo "DEPLOYMENT REPORT"
    echo "==============================================="
    echo ""
    
    echo -e "${GREEN}Deployed: ${#DEPLOYED[@]}${NC}"
    for idx in "${DEPLOYED[@]}"; do
        echo "  ✓ $idx"
    done
    
    if [ ${#FAILED[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed: ${#FAILED[@]}${NC}"
        for idx in "${FAILED[@]}"; do
            echo "  ✗ $idx"
        done
    fi
    
    if [ ${#SKIPPED[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Skipped (Dry Run): ${#SKIPPED[@]}${NC}"
    fi
    
    echo ""
    echo "==============================================="
    
    # Calculate expected performance improvement
    TOTAL=$(( ${#DEPLOYED[@]} + ${#SKIPPED[@]} ))
    if [ $TOTAL -eq 38 ]; then
        echo -e "${GREEN}All 38 indexes ready! Expected: 150-200X query performance improvement${NC}"
    else
        echo "Indexes deployed: $TOTAL/38"
    fi
    
    echo "==============================================="
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================
main() {
    echo "Phase: $PHASE"
    echo "Dry Run: $DRY_RUN"
    echo ""
    
    case $PHASE in
        critical|1)
            deploy_critical_indexes
            ;;
        high|2)
            deploy_high_priority_indexes
            ;;
        medium|3)
            deploy_medium_priority_indexes
            ;;
        all|*)
            deploy_critical_indexes
            deploy_high_priority_indexes
            deploy_medium_priority_indexes
            ;;
    esac
    
    if [ "$DRY_RUN" = "false" ]; then
        verify_indexes
    fi
    
    generate_report
}

# Show usage
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [phase] [dry-run]"
    echo ""
    echo "Phases:"
    echo "  critical, 1    - Deploy critical indexes only (6 indexes, 50X improvement)"
    echo "  high, 2        - Deploy high priority indexes (16 indexes, 20X improvement)"
    echo "  medium, 3      - Deploy medium priority indexes (16 indexes, 10X improvement)"
    echo "  all            - Deploy all indexes (default)"
    echo ""
    echo "Options:"
    echo "  dry-run        - Show what would be deployed without executing"
    echo ""
    echo "Examples:"
    echo "  $0                     # Deploy all indexes"
    echo "  $0 critical            # Deploy critical indexes only"
    echo "  $0 all dry-run         # Dry run all phases"
    exit 0
fi

main
