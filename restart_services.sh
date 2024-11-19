#!/bin/bash

# Function to check if a service is running
check_service() {
  local port=$1
  local status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port)
  if [ "$status" -ne "000" ]; then
    echo "Service on port $port is running."
    return 0
  else
    echo "Service on port $port is not running."
    return 1
  fi
}

# Function to stop a service
stop_service() {
  local port=$1
  local process_name=$2
  if check_service $port; then
    echo "Stopping service on port $port..."
    fuser -k $port/tcp
    pkill -f "$process_name"
    sleep 2 # Wait for services to stop
    if check_service $port; then
      echo "Failed to stop service on port $port."
    else
      echo "Service on port $port stopped successfully."
    fi
  else
    echo "Service on port $port is already stopped."
  fi
}

# Function to start services
start_services() {
  echo "Starting backend service..."
  cd backend
  python gpu_service.py &
  BACKEND_PID=$!
  echo "Backend started (PID: $BACKEND_PID)"

  # Check if the backend is running
  backend_url="http://localhost:5000/api/gpu-stats"
  max_attempts=5
  attempt=0

  while [ $attempt -lt $max_attempts ]
  do
    if curl --output /dev/null --silent --head --fail "$backend_url"; then
      echo "Backend is running."
      break
    else
      echo "Waiting for backend to start..."
      sleep 5
    fi
    attempt=$((attempt+1))
  done

  if [ $attempt -eq $max_attempts ]; then
    echo "Backend failed to start after $max_attempts attempts."
    exit 1
  fi

  # Start frontend service
  cd ../frontend
  npm run dev &
  FRONTEND_PID=$!
  echo "Frontend started (PID: $FRONTEND_PID)"
}

# Main script to restart services
restart_services() {
  stop_service 5000 'flask'
  stop_service 3000 'vite'
  start_services
}

# Execute restart
restart_services
