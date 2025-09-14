#!/bin/bash

echo "🚀 Deploying Ositos Bendecidos with Netlify CLI..."

# Build the project first
echo "📦 Building project..."
npm run build

# Deploy to existing site
echo "🔧 Deploying with functions..."
netlify deploy --prod --dir=dist --functions=functions

echo "✅ Deployment complete!"
echo ""
echo "📌 If this is first time:"
echo "   1. Choose existing site when prompted"
echo "   2. Select 'ositos-bendecidos'"
echo "   3. Functions will be deployed correctly!"