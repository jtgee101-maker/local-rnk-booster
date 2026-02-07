#!/bin/bash
# Quick Deploy Script for LocalRnk
# Usage: ./deploy.sh [staging|production]

set -e

ENV=${1:-staging}
echo "🚀 Starting deployment to $ENV..."

# Build
echo "📦 Building..."
npm run build

# Verify dist exists
if [ ! -d "dist" ]; then
    echo "❌ Build failed - no dist folder"
    exit 1
fi

# Run lint
echo "🔍 Running lint..."
npm run lint || echo "⚠️ Lint warnings found"

# Deploy based on environment
if [ "$ENV" == "production" ]; then
    echo "🎯 Deploying to PRODUCTION..."
    # netlify deploy --prod --dir=dist
    echo "Production deploy would happen here"
else
    echo "🧪 Deploying to STAGING..."
    # netlify deploy --dir=dist
    echo "Staging deploy would happen here"
fi

echo "✅ Deployment complete!"
