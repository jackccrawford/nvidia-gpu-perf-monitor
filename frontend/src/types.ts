export interface GPUProcess {
  gpu_index: number
  pid: number
  used_memory: number
  name: string
}

export interface GPUInfo {
  index: number
  name: string
  fan_speed: number
  power_draw: number
  power_limit: number
  memory_total: number
  memory_used: number
  gpu_utilization: number
  temperature: number
  peak_temperature: number
  temp_change_rate: number
  compute_mode: string
}

export interface GPUBurnMetrics {
  running: boolean
  duration: number
  errors: number
}

export interface GPUData {
  gpus: GPUInfo[]
  nvidia_info: {
    driver_version: string
    cuda_version: string
  }
  processes: GPUProcess[]
  gpu_burn_metrics: GPUBurnMetrics
  success: boolean
}

export interface ThemeColors {
  background: string
  cardBackground: string
  text: string
  subtext: string
  border: string
  progressBackground: string
  isDark: boolean
}

export const DARK_THEME: ThemeColors = {
  background: '#1a1a1a',
  cardBackground: '#2d2d2d',
  text: '#e1e1e1',
  subtext: '#a0a0a0',
  border: '#404040',
  progressBackground: '#404040',
  isDark: true,
}

export const LIGHT_THEME: ThemeColors = {
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  text: '#2c3e50',
  subtext: '#666666',
  border: '#e1e4e8',
  progressBackground: '#e9ecef',
  isDark: false,
}

export const POLLING_INTERVALS = [
  { label: '250ms', value: 250 },
  { label: '500ms', value: 500 },
  { label: '1 second', value: 1000 },
  { label: '2 seconds', value: 2000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
]
