#!/bin/bash
# Lighthouse CI Configuration for LocalRnk Project
# Run this script to audit staging and production

echo "🚀 Starting Lighthouse CI Baseline Audit"
echo "========================================="

# Staging URL
STAGING_URL="https://harmonious-frangipane-ef2a99.netlify.app/"
PROD_URL="https://localrnk.com"

echo ""
echo "📊 Auditing Staging: $STAGING_URL"
echo "---"

# Run Lighthouse on staging
npx lighthouse $STAGING_URL \
  --chrome-flags="--headless --no-sandbox" \
  --output=json \
  --output-path=./reports/lighthouse-staging-$(date +%Y%m%d-%H%M%S).json \
  --only-categories=performance,accessibility,best-practices,seo 2>&1 | tail -20

echo ""
echo "✅ Staging audit complete!"
echo "📁 Report saved to: ./reports/lighthouse-staging-*.json"
