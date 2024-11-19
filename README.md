# NVIDIA GPU Performance Monitor

> "Information should not be displayed all at once; let people gradually become familiar with it." - Edward Tufte

Tired of playing "Find the Important Number" in your terminal while your ML model trains? Watching your GPU temperature shouldn't feel like decoding the Matrix. 

Do you find yourself:
- Constantly switching between terminal windows?
- Squinting at rapidly changing numbers?
- Missing critical spikes in GPU usage?
- Wondering if that temperature is actually concerning?
- Spending mental energy parsing dense data when you should be focusing on your work?

We've reimagined GPU monitoring with human-centered design principles. Instead of parsing dense terminal output, our dashboard leverages intuitive visual affordances - color gradients that immediately signal temperature states, progress bars that show memory usage at a glance, and trend indicators that make pattern recognition effortless.

This beautiful, real-time GPU monitoring dashboard transforms complex metrics into an intuitive interface. Built with React and Flask, it reduces cognitive load through thoughtful information hierarchy and visual signifiers, letting you focus on your work while maintaining awareness of your GPU's health.

![Dark Mode Under Stress Test](images/DarkMode-Stressed.png)
*Transform complex GPU metrics into intuitive visual patterns*

Key Design Principles:
- Reduced Cognitive Load: Visual patterns over dense numbers
- Intuitive Signifiers: Color-coding that maps to severity levels
- Information Hierarchy: Critical metrics prominently displayed
- Pattern Recognition: Trend visualization for quick analysis
- Attention Management: Alerts that demand attention only when needed

![Version](https://img.shields.io/badge/version-1.0.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React Version](https://img.shields.io/badge/react-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-4.9.5-blue)
![Python](https://img.shields.io/badge/python-3.8+-yellow)
![Flask](https://img.shields.io/badge/flask-2.0.0-black)

## From Terminal to Visual Intelligence

### The Old Way: Dense Terminal Output
![Traditional nvidia-smi](images/nvidia-smi.png)
*Traditional nvidia-smi command line output - dense numbers requiring constant cognitive processing*

### Real-world Usage Examples

#### Machine Learning Workload Monitoring
![Ollama Running](images/Ollama-Mistral-Small.png)
*Dashboard showing Ollama running the Mistral-Small model - clear resource utilization*

#### Stress Test Monitoring
![GPU Burn Test](images/gpu-burn-danger-zone.png)
*Intensive GPU stress testing with gpu-burn - immediate visual alerts*

#### Mobile-Optimized View
![Mobile Dark Mode](images/DarkMode-Mobile.png)

*Responsive design automatically adapts to any screen size*

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Backend: Python, Flask
- System Tools:
  - nvidia-smi
  - gpu-burn
  - CUDA Toolkit

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jackccrawford/nvidia-gpu-perf-monitor.git
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Start the application:
   ```bash
   ./restart.sh
   ```
   
   The `restart.sh` script handles:
   - Stopping any existing instances of the frontend and backend services
   - Starting the Flask backend server
   - Starting the React frontend development server
   - Ensuring proper startup sequence and port availability

   > Pro Tip: Always use `restart.sh` to start/restart the application. It ensures clean startup and proper service coordination.

   If you need to start services manually (not recommended):
   ```bash
   # Backend
   cd backend
   python gpu_service.py

   # Frontend (in a new terminal)
   cd frontend
   npm run dev
   ```

## Usage Examples

### Monitoring Machine Learning Workloads
```python
# Run your ML training
python train.py --model large --epochs 100
```
Monitor in real-time:
- GPU utilization during training
- Memory consumption patterns
- Temperature trends
- Process-specific metrics

### Stress Testing
```bash
# Run gpu-burn
./gpu-burn 60  # 1 minute stress test - watch closely!
```
Monitor in dashboard:
- Temperature peaks
- Error detection
- Duration tracking
- Performance metrics

 CAUTION: Never run stress tests for extended periods. This can damage your GPU!

## Temperature Monitoring

Color-coded temperature ranges for intuitive monitoring:
- Red (≥85°C): Danger zone
- Orange (80-84°C): Warning
- Yellow (70-79°C): Normal gaming temp
- Green (65-69°C): Ideal temperature
- Blue (50-64°C): Cool
- Indigo (<50°C): Very cool

## Security Notes

- No sensitive data collection
- Local-only operation
- Process information filtered
- Safe subprocess execution
- Error handling for all operations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NVIDIA for nvidia-smi toolkit
- gpu-burn for stress testing
- React for frontend framework
- Flask for backend framework
- Icons by Heroicons and Phosphor

---

<p align="center">Made with for the GPU community</p>
<p align="center">Developed with assistance by Codeium Windsurf</p>
