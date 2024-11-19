# NVIDIA GPU Performance Monitor Configuration

## System Architecture

The application consists of three main components:
1. Python Backend (`gpu_monitor.py`)
2. React Frontend (`frontend/src/App.tsx`)
3. Restart Script (`restart.sh`)

## Backend Configuration

The backend service (`gpu_monitor.py`) provides GPU metrics through a REST API:

- **Endpoint**: `http://localhost:5000/api/gpu-stats`
- **Response Format**: JSON containing GPU metrics, driver info, and process data
- **Update Method**: Real-time polling of `nvidia-smi` command

### Monitored Metrics
- GPU Index
- GPU Name
- Fan Speed (%)
- Power Draw/Limit
- Memory Usage (Total/Used)
- GPU Utilization (%)
- Temperature
- Peak Temperature
- Temperature Change Rate
- Compute Mode
- Running Processes

## Frontend Configuration

### Theme Settings
- **Dark Mode**: Default enabled, persisted in localStorage
- **Light Mode**: Optional, with adapted color scheme
- **Color Schemes**: ADA-compliant for both modes

### Metric Color Ranges

#### Fan Speed Thresholds
- Critical: > 80% (Red)
- Warning: > 65% (Orange)
- Caution: > 50% (Yellow)
- Good: > 35% (Green)
- Ideal: ≤ 35% (Blue)

#### Temperature Thresholds
- Critical: ≥ 80°C (Red)
- Warning: ≥ 70°C (Orange)
- Caution: ≥ 60°C (Yellow)
- Good: ≥ 50°C (Green)
- Ideal: < 50°C (Blue)

#### Utilization Thresholds
- Critical: ≥ 90% (Red)
- Warning: ≥ 75% (Orange)
- Caution: ≥ 50% (Yellow)
- Good: ≥ 25% (Green)
- Ideal: < 25% (Blue)

### Polling Intervals
Available refresh rates:
- 250ms
- 500ms
- 1 second (default)
- 2 seconds
- 5 seconds
- 10 seconds

### UI Components
- Dark/Light mode toggle
- Polling interval selector
- GPU cards displaying:
  - Name and index
  - Temperature with trend indicators
  - Utilization gauge
  - Memory usage bar
  - Fan speed indicator
  - Power consumption metrics

## Updated Configuration

### Frontend Enhancements
- **Polling Mechanism**: Improved logging and error handling for consistent data fetching.
- **Theme Settings**: ADA-compliant color schemes for both light and dark modes.

### Backend Updates
- **Service Management**: Enhanced scripts for starting and stopping services with graceful shutdown.

These updates ensure the application runs efficiently and provides accurate GPU monitoring.

## Data Persistence
- Theme preference stored in `localStorage.darkMode`
- Polling interval stored in `localStorage.pollingInterval`

## Error Handling
- Backend connection failures logged to console
- Loading state displayed during initial data fetch
- Graceful error display for GPU monitoring errors

## Animation
- Pulse animation for dynamic updates
- Smooth transitions between theme changes
- Real-time metric updates based on polling interval
