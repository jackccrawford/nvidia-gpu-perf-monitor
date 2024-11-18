#!/bin/bash

echo "🔄 Restarting GPU Monitor services..."

# Kill existing processes
echo "📋 Checking for existing processes..."

# Kill frontend (Node.js on port 5173)
FRONTEND_PID=$(lsof -t -i:5173)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "🛑 Stopping frontend server (PID: $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID
fi

# Kill backend (Python on port 5000)
BACKEND_PID=$(lsof -t -i:5000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "🛑 Stopping backend server (PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID
fi

# Small delay to ensure ports are freed
sleep 1

# Start backend
echo "🚀 Starting backend server..."
cd backend
python gpu_service.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo "🚀 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo "🎉 All services restarted!"
echo "📊 GPU Monitor available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000/api/gpu-stats"
echo ""
echo "💡 Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo '⏹️ Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
