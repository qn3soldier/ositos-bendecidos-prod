#!/bin/bash

echo "🚀 Preparing Ositos Bendecidos for Netlify deployment (FIXED)..."

# Create temp directory
TEMP_DIR="netlify-deploy-fixed-structure"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy everything from dist to root of archive
echo "📦 Copying frontend build to root..."
cp -r dist/* $TEMP_DIR/

# Copy netlify.toml
echo "📋 Copying netlify.toml..."
cp netlify.toml $TEMP_DIR/

# Copy functions folder as-is
echo "🔧 Copying functions folder..."
cp -r functions $TEMP_DIR/

# Create the deployment archive
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_NAME="netlify-deploy-fixed-$TIMESTAMP.zip"

echo "🗜️ Creating deployment archive: $ZIP_NAME"
cd $TEMP_DIR
zip -r ../$ZIP_NAME .
cd ..

# Cleanup
rm -rf $TEMP_DIR

echo "✅ Deployment archive created: $ZIP_NAME"
echo ""
echo "📌 CRITICAL: This archive contains:"
echo "   - Frontend files in root (from dist/)"
echo "   - Functions in /functions folder"
echo "   - netlify.toml in root"
echo ""
echo "🔍 Functions included:"
ls -la functions/*.js | grep -v node_modules