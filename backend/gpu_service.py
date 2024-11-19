#!/usr/bin/env python3

"""
NVIDIA GPU Monitoring Service

This Flask-based service provides real-time GPU metrics through a RESTful API.
It monitors NVIDIA GPUs using the nvidia-smi tool and exposes the following endpoints:

Endpoints:
    GET /api/gpu-stats - Returns current GPU statistics including:
        - Temperature, fan speed, and utilization metrics
        - Memory usage and power consumption
        - Process information for each GPU
        - Temperature history and trends
        - Peak temperature records
        - GPU burn test metrics (if applicable)

    POST /api/reset-peaks - Resets the recorded peak temperatures

Security:
    - CORS is enabled to allow cross-origin requests from the frontend
    - No authentication required (intended for local network use only)

Dependencies:
    - nvidia-smi command-line tool
    - NVIDIA drivers properly installed
    - Flask and flask-cors packages

Data Structures:
    temperature_history : dict
        Keys: GPU index (int)
        Values: deque of (timestamp, temperature) tuples
        Purpose: Tracks temperature changes over time for trend analysis
        Max Length: 40 entries (10 seconds at 250ms intervals)

    peak_temperatures : dict
        Keys: GPU index (int)
        Values: highest recorded temperature (float)
        Purpose: Maintains high-water marks for each GPU
        Reset: Via /api/reset-peaks endpoint

    gpu_burn_metrics : dict
        Keys: 'start_time', 'errors_detected', 'total_time'
        Purpose: Tracks GPU stress test metrics
        Reset: Errors reset via /api/reset-peaks endpoint
"""

from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import json
import re
from collections import deque
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# Temperature history for each GPU
# Format: {gpu_index: deque([(timestamp, temp), ...], maxlen=40)}
temperature_history = {}

# Peak temperature tracking
# Format: {gpu_index: highest_recorded_temperature}
peak_temperatures = {}

# GPU burn test metrics
# Format: {start_time: float, errors_detected: int, total_time: float}
gpu_burn_metrics = {
    'start_time': None,
    'errors_detected': 0,
    'total_time': 0
}

def get_nvidia_info():
    """
    Retrieves NVIDIA driver and CUDA version information.

    Uses nvidia-smi to query the system for driver and CUDA versions.
    Handles potential errors gracefully by returning "Unknown" for missing information.

    Returns:
        dict: A dictionary containing:
            - driver_version (str): NVIDIA driver version (e.g., "535.183.01")
            - cuda_version (str): CUDA version (e.g., "12.2")
                                Returns "Unknown" if information cannot be retrieved
    """
    try:
        # Get NVIDIA driver version
        driver_cmd = subprocess.run(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader,nounits'], 
                                  capture_output=True, text=True)
        driver_version = driver_cmd.stdout.strip() if driver_cmd.stdout else "Unknown"

        # Get CUDA version from the main nvidia-smi output
        cuda_cmd = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
        cuda_version = "Unknown"
        if cuda_cmd.stdout:
            match = re.search(r'CUDA Version: ([\d\.]+)', cuda_cmd.stdout)
            if match:
                cuda_version = match.group(1)

        return {
            'driver_version': driver_version.split('\n')[0] if '\n' in driver_version else driver_version,
            'cuda_version': cuda_version
        }
    except Exception as e:
        print(f"Error getting NVIDIA info: {str(e)}")
        return {
            'driver_version': "Unknown",
            'cuda_version': "Unknown"
        }

def parse_gpu_info():
    """
    Collects and processes comprehensive GPU information.

    This function:
    1. Retrieves driver/CUDA versions
    2. Collects detailed GPU metrics (temperature, memory, utilization, etc.)
    3. Updates temperature history and peak records
    4. Calculates temperature change rates
    5. Formats data for frontend consumption

    GPU Metrics Collected:
        - Index and Name
        - Fan Speed (%)
        - Power Usage (W)
        - Memory Usage (MiB)
        - GPU Utilization (%)
        - Temperature (°C)
        - Compute Mode
        - Temperature History
        - Peak Temperature

    Returns:
        dict: A dictionary containing:
            - gpus: List of GPU information dictionaries
            - nvidia_info: Driver and CUDA versions
            - processes: List of running compute processes (intentionally empty)
            - gpu_burn_metrics: Stress test metrics
            - success: Boolean indicating successful data collection
    """
    try:
        nvidia_info = get_nvidia_info()
        
        # Get GPU info in CSV format for easier parsing
        gpu_info = subprocess.run([
            'nvidia-smi', 
            '--query-gpu=index,name,fan.speed,power.draw,memory.total,memory.used,utilization.gpu,temperature.gpu,compute_mode,power.limit',
            '--format=csv,noheader,nounits'
        ], capture_output=True, text=True)
        
        # Print debug information
        print("GPU info command output:", gpu_info.stdout)
        print("GPU info command error:", gpu_info.stderr)
        
        # Get process info with more details
        process_info = subprocess.run([
            'nvidia-smi', 
            '--query-compute-apps=gpu_uuid,pid,used_memory,name,gpu_name,gpu_bus_id',
            '--format=csv,noheader,nounits'
        ], capture_output=True, text=True)
        
        print("Process info command output:", process_info.stdout)
        print("Process info command error:", process_info.stderr)

        gpus = []
        current_time = datetime.now().timestamp()
        
        # Only try to parse if we have output
        if gpu_info.stdout.strip():
            for line in gpu_info.stdout.strip().split('\n'):
                values = [v.strip() for v in line.split(',')]
                print(f"Parsing GPU line: {line}")
                print(f"Split values: {values}")
                if len(values) >= 10:
                    gpu_index = int(values[0])
                    temperature = float(values[7])
                    
                    # Initialize history for new GPUs
                    if gpu_index not in temperature_history:
                        temperature_history[gpu_index] = deque(maxlen=40)  # Store 10 seconds of data at 250ms intervals
                    
                    # Update temperature history
                    temperature_history[gpu_index].append((current_time, temperature))
                    
                    # Update peak temperature
                    if gpu_index not in peak_temperatures or temperature > peak_temperatures[gpu_index]:
                        peak_temperatures[gpu_index] = temperature
                    
                    # Calculate temperature change rate using last 10 seconds
                    temp_history = temperature_history[gpu_index]
                    temp_change_rate = 0
                    if len(temp_history) >= 2:
                        # Use the most recent measurements for rate calculation
                        recent_time = temp_history[-1][0] - 10  # Look back 10 seconds
                        start_temp = None
                        
                        # Find the oldest temperature within our 10-second window
                        for t, temp in temp_history:
                            if t >= recent_time:
                                start_temp = temp
                                break
                        
                        if start_temp is not None:
                            temp_diff = round(temp_history[-1][1]) - round(start_temp)  # Round both temperatures
                            time_diff = temp_history[-1][0] - recent_time
                            if time_diff > 0:  # Avoid division by zero
                                temp_change_rate = (temp_diff / time_diff) * 60  # Convert to per minute
                                # Only show rate if we have at least a 1 degree change
                                if abs(temp_diff) < 1:
                                    temp_change_rate = 0
                    
                    gpu_data = {
                        'index': gpu_index,
                        'name': values[1].strip(),
                        'fan_speed': float(values[2]),
                        'power_draw': float(values[3]),
                        'power_limit': float(values[9]),
                        'memory_total': float(values[4]),
                        'memory_used': float(values[5]),
                        'gpu_utilization': float(values[6]),
                        'temperature': temperature,
                        'peak_temperature': peak_temperatures[gpu_index],
                        'temp_change_rate': round(temp_change_rate, 2),
                        'compute_mode': values[8]
                    }
                    gpus.append(gpu_data)

        # Parse processes with enhanced gpu-burn detection
        processes = []
        gpu_burn_detected = False
        for line in process_info.stdout.strip().split('\n'):
            if line:  # Skip empty lines
                values = [v.strip() for v in line.split(',')]
                if len(values) >= 6:
                    process_name = values[3].lower()
                    if 'gpu-burn' in process_name:
                        gpu_burn_detected = True
                        if gpu_burn_metrics['start_time'] is None:
                            gpu_burn_metrics['start_time'] = current_time
                    
                    if not any(x in process_name for x in ['xorg', 'shell']):
                        process = {
                            'gpu_uuid': values[0],
                            'pid': int(values[1]),
                            'used_memory': float(values[2]),
                            'name': values[3],
                            'gpu_name': values[4],
                            'gpu_bus_id': values[5]
                        }
                        processes.append(process)

        # Update gpu-burn metrics
        if gpu_burn_detected and gpu_burn_metrics['start_time'] is not None:
            gpu_burn_metrics['total_time'] = current_time - gpu_burn_metrics['start_time']
        elif not gpu_burn_detected:
            gpu_burn_metrics['start_time'] = None
            gpu_burn_metrics['total_time'] = 0

        return {
            'nvidia_info': nvidia_info,
            'gpus': gpus,
            'processes': processes,
            'gpu_burn_metrics': {
                'running': gpu_burn_detected,
                'duration': round(gpu_burn_metrics['total_time'], 1),
                'errors': gpu_burn_metrics['errors_detected']
            },
            'success': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/api/gpu-stats')
def get_gpu_stats():
    """
    Flask endpoint that returns current GPU statistics.

    This endpoint:
    1. Collects current GPU metrics via parse_gpu_info()
    2. Returns the data in JSON format
    3. Handles CORS automatically via flask-cors

    Returns:
        Response: JSON-formatted GPU statistics including:
            - List of GPU information
            - NVIDIA driver/CUDA versions
            - Temperature histories
            - Peak temperatures
            - GPU burn metrics
    """
    return jsonify(parse_gpu_info())

@app.route('/api/reset-peaks', methods=['POST'])
def reset_peaks():
    """
    Flask endpoint that resets peak temperature records and error counts.

    This endpoint:
    1. Clears the peak_temperatures dictionary
    2. Resets GPU burn error counter
    3. Returns success confirmation

    Returns:
        Response: JSON confirmation of reset
            - success: True if reset completed
    """
    peak_temperatures.clear()
    gpu_burn_metrics['errors_detected'] = 0
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(port=5000)
