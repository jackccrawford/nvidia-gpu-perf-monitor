#!/usr/bin/env python3

"""
NVIDIA GPU Monitoring Service

FastAPI-based service providing real-time GPU metrics via a RESTful API.
Uses pynvml for direct NVIDIA driver access (no subprocess spawning).

Endpoints:
    GET /api/gpu-stats    - Current GPU statistics
    POST /api/reset-peaks - Reset peak temperature records
"""

import logging
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import pynvml
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Temperature history: {gpu_index: deque([(timestamp, temp), ...], maxlen=40)}
temperature_history: dict[int, deque] = {}

# Peak temperature tracking: {gpu_index: highest_temp}
peak_temperatures: dict[int, float] = {}

# GPU burn test state
gpu_burn_state: dict[str, Any] = {
    "start_time": None,
    "errors_detected": 0,
    "total_time": 0.0,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    pynvml.nvmlInit()
    logger.info("pynvml initialized")
    yield
    pynvml.nvmlShutdown()
    logger.info("pynvml shutdown")


app = FastAPI(title="NVIDIA GPU Monitor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ResetResponse(BaseModel):
    success: bool


def _get_system_info() -> dict[str, str]:
    try:
        driver_version = pynvml.nvmlSystemGetDriverVersion()
        cuda_version_raw = pynvml.nvmlSystemGetCudaDriverVersion()
        major = cuda_version_raw // 1000
        minor = (cuda_version_raw % 1000) // 10
        cuda_version = f"{major}.{minor}"
        return {"driver_version": driver_version, "cuda_version": cuda_version}
    except pynvml.NVMLError as e:
        logger.warning("Could not retrieve system info: %s", e)
        return {"driver_version": "Unknown", "cuda_version": "Unknown"}


def _get_processes() -> list[dict]:
    """Collect running compute processes across all GPUs."""
    processes = []
    device_count = pynvml.nvmlDeviceGetCount()
    for i in range(device_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
        try:
            procs = pynvml.nvmlDeviceGetComputeRunningProcesses(handle)
        except pynvml.NVMLError:
            continue
        for proc in procs:
            try:
                name = pynvml.nvmlSystemGetProcessName(proc.pid)
            except pynvml.NVMLError:
                name = "Unknown"
            if name.lower() == "unknown":
                continue
            processes.append(
                {
                    "gpu_index": i,
                    "pid": proc.pid,
                    "used_memory": proc.usedGpuMemory / (1024 * 1024),  # bytes -> MiB
                    "name": name,
                }
            )
    return processes


def _collect_gpu_stats() -> dict:
    nvidia_info = _get_system_info()
    device_count = pynvml.nvmlDeviceGetCount()
    current_time = datetime.now().timestamp()
    gpus = []

    for i in range(device_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(i)

        name = pynvml.nvmlDeviceGetName(handle)
        temperature = float(pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU))
        fan_speed = float(pynvml.nvmlDeviceGetFanSpeed(handle))
        power_draw = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0  # mW -> W
        power_limit = pynvml.nvmlDeviceGetEnforcedPowerLimit(handle) / 1000.0  # mW -> W
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        memory_total = mem_info.total / (1024 * 1024)  # bytes -> MiB
        memory_used = mem_info.used / (1024 * 1024)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        gpu_utilization = float(util.gpu)

        compute_mode_id = pynvml.nvmlDeviceGetComputeMode(handle)
        compute_mode_map = {
            pynvml.NVML_COMPUTEMODE_DEFAULT: "Default",
            pynvml.NVML_COMPUTEMODE_EXCLUSIVE_THREAD: "Exclusive Thread",
            pynvml.NVML_COMPUTEMODE_PROHIBITED: "Prohibited",
            pynvml.NVML_COMPUTEMODE_EXCLUSIVE_PROCESS: "Exclusive Process",
        }
        compute_mode = compute_mode_map.get(compute_mode_id, "Unknown")

        # Temperature history + peak tracking
        if i not in temperature_history:
            temperature_history[i] = deque(maxlen=40)
        temperature_history[i].append((current_time, temperature))
        if i not in peak_temperatures or temperature > peak_temperatures[i]:
            peak_temperatures[i] = temperature

        # Temperature change rate (°C/min) over last 10 seconds
        temp_change_rate = 0.0
        history = temperature_history[i]
        if len(history) >= 2:
            window_start = current_time - 10.0
            baseline_temp = next(
                (temp for t, temp in history if t >= window_start), None
            )
            if baseline_temp is not None:
                temp_diff = round(history[-1][1]) - round(baseline_temp)
                time_diff = history[-1][0] - window_start
                if time_diff > 0 and abs(temp_diff) >= 1:
                    temp_change_rate = round((temp_diff / time_diff) * 60, 2)

        gpus.append(
            {
                "index": i,
                "name": name,
                "fan_speed": fan_speed,
                "power_draw": round(power_draw, 1),
                "power_limit": round(power_limit, 1),
                "memory_total": memory_total,
                "memory_used": memory_used,
                "gpu_utilization": gpu_utilization,
                "temperature": temperature,
                "peak_temperature": peak_temperatures[i],
                "temp_change_rate": temp_change_rate,
                "compute_mode": compute_mode,
            }
        )

    processes = _get_processes()

    # GPU burn detection
    gpu_burn_detected = any("gpu-burn" in p["name"].lower() for p in processes)
    if gpu_burn_detected:
        if gpu_burn_state["start_time"] is None:
            gpu_burn_state["start_time"] = current_time
        gpu_burn_state["total_time"] = current_time - gpu_burn_state["start_time"]
    else:
        gpu_burn_state["start_time"] = None
        gpu_burn_state["total_time"] = 0.0

    return {
        "nvidia_info": nvidia_info,
        "gpus": gpus,
        "processes": processes,
        "gpu_burn_metrics": {
            "running": gpu_burn_detected,
            "duration": round(gpu_burn_state["total_time"], 1),
            "errors": gpu_burn_state["errors_detected"],
        },
        "success": True,
    }


@app.get("/api/gpu-stats")
async def get_gpu_stats():
    try:
        return _collect_gpu_stats()
    except pynvml.NVMLError as e:
        logger.error("NVML error: %s", e)
        raise HTTPException(status_code=503, detail=f"GPU unavailable: {e}")
    except Exception as e:
        logger.exception("Unexpected error collecting GPU stats")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reset-peaks", response_model=ResetResponse)
async def reset_peaks():
    peak_temperatures.clear()
    gpu_burn_state["errors_detected"] = 0
    return ResetResponse(success=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
