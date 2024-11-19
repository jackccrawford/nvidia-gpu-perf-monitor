#!/bin/bash

# Stop the Flask server running on port 5000
fuser -k 5000/tcp

# Verify if the Flask server is stopped
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000)
if [ "$BACKEND_STATUS" -eq "000" ]; then
  echo "Backend service is stopped."
else
  echo "Backend service is still running."
fi

# Stop the Frontend server if running
pkill -f 'vite'  # Assuming the frontend is started with 'npm run dev' or 'vite'

# Verify if the Frontend server is stopped
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" -eq "000" ]; then
  echo "Frontend service is stopped."
else
  echo "Frontend service is still running."
fi

# Stop any other related services if needed
# Example: pkill -f 'ollama'

# Add more commands here to stop other services as needed
