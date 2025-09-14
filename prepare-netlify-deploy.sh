#!/bin/bash

echo "🚀 Preparing Ositos Bendecidos for Netlify deployment..."

# Create temp directory
TEMP_DIR="netlify-deploy-ready"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy dist folder (frontend build)
echo "📦 Copying frontend build..."
cp -r dist/* $TEMP_DIR/

# Copy netlify.toml to root
echo "📋 Copying netlify.toml..."
cp netlify.toml $TEMP_DIR/

# Copy functions
echo "🔧 Copying functions..."
mkdir -p $TEMP_DIR/netlify/functions
cp -r netlify/functions/* $TEMP_DIR/netlify/functions/

# Create a minimal package.json in root for Netlify
echo "📝 Creating root package.json for Netlify..."
cat > $TEMP_DIR/package.json << 'EOF'
{
  "name": "ositos-bendecidos",
  "version": "1.0.0",
  "description": "Ositos Bendecidos E-commerce Platform",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Install dependencies in functions folder
echo "📦 Installing function dependencies..."
cd $TEMP_DIR/netlify/functions
npm install --production
cd ../../..

# Create the deployment archive
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_NAME="netlify-deploy-$TIMESTAMP.zip"

echo "🗜️ Creating deployment archive: $ZIP_NAME"
cd $TEMP_DIR
zip -r ../$ZIP_NAME .
cd ..

# Cleanup
rm -rf $TEMP_DIR

echo "✅ Deployment archive created: $ZIP_NAME"
echo ""
echo "📌 Next steps:"
echo "1. Upload $ZIP_NAME to Netlify (drag & drop)"
echo "2. Make sure all environment variables are set in Netlify"
echo "3. Check the deploy logs for any errors"
echo ""
echo "🔍 Archive contains:"
echo "   - Frontend build (dist/)"
echo "   - Netlify configuration (netlify.toml)"
echo "   - Serverless functions with dependencies"