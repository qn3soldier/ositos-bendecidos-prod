#!/bin/bash

echo "🚀 Deploying Ositos Bendecidos to Production..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build backend
echo "🔧 Building backend..."
cd backend-api
npm run build

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload dist/ folder to your frontend hosting (Vercel/Netlify/etc)"
echo "2. Upload backend-api/dist/ to your backend hosting (Railway/Heroku/AWS/etc)"
echo "3. Set environment variables on hosting platforms"
echo "4. Update domain URLs in .env files"
echo "5. Test real payments!"

echo ""
echo "🔗 Recommended hosting:"
echo "Frontend: Vercel (free) - vercel.com"
echo "Backend:  Railway (free tier) - railway.app"
echo "Database: MongoDB Atlas (free) - mongodb.com/atlas"
