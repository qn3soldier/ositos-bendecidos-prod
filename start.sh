#!/bin/bash

echo "🚀 Starting Ositos Bendecidos..."

# Kill any existing processes on ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend API..."
cd backend-api
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend  
echo "🎨 Starting frontend..."
cd ..
npm run dev -- --port 5173 &
FRONTEND_PID=$!

echo "✅ Servers starting..."
echo "📱 Frontend: http://localhost:5173/"
echo "🔧 Backend:  http://localhost:3001/"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $FRONTEND_PID
wait $BACKEND_PID
