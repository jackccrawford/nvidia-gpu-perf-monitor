#!/bin/bash

# Stop the Flask server running on port 5000
fuser -k 5000/tcp

# Stop any other related services if needed
# Example: pkill -f 'ollama'

# Add more commands here to stop other services as needed
