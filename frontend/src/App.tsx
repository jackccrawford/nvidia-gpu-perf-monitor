import { useState, useEffect } from 'react'

interface GPUInfo {
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

interface GPUBurnMetrics {
  running: boolean
  duration: number
  errors: number
}

interface GPUData {
  gpus: GPUInfo[]
  nvidia_info: {
    driver_version: string
    cuda_version: string
  }
  processes: any[]
  gpu_burn_metrics: GPUBurnMetrics
  success: boolean
}

interface ThemeColors {
  background: string
  cardBackground: string
  text: string
  subtext: string
  border: string
  progressBackground: string
  isDark: boolean
}

const POLLING_INTERVALS = [
  { label: '250ms', value: 250 },
  { label: '500ms', value: 500 },
  { label: '1 second', value: 1000 },
  { label: '2 seconds', value: 2000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 }
]

function App() {
  const [data, setData] = useState<GPUData | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [pollingInterval, setPollingInterval] = useState(() => {
    const saved = localStorage.getItem('pollingInterval')
    return saved ? parseInt(saved) : 1000
  })

  const theme: ThemeColors = darkMode ? {
    background: '#1a1a1a',
    cardBackground: '#2d2d2d',
    text: '#e1e1e1',
    subtext: '#a0a0a0',
    border: '#404040',
    progressBackground: '#404040',
    isDark: true
  } : {
    background: '#f8f9fa',
    cardBackground: '#ffffff',
    text: '#2c3e50',
    subtext: '#666666',
    border: '#e1e4e8',
    progressBackground: '#e9ecef',
    isDark: false
  }

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('pollingInterval', pollingInterval.toString())
  }, [pollingInterval])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/gpu-stats')
        const jsonData = await response.json()
        setData(jsonData)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, pollingInterval)
    return () => clearInterval(interval)
  }, [pollingInterval])

  if (!data) {
    return <div>Loading...</div>
  }

  const getUtilizationColor = (utilization: number, theme: ThemeColors): string => {
    // ADA-compliant colors with good contrast ratios
    if (utilization >= 80) return theme.isDark ? '#FF6B6B' : '#D32F2F' // Red
    if (utilization >= 60) return theme.isDark ? '#FFA94D' : '#F57C00' // Orange
    if (utilization >= 40) return theme.isDark ? '#51CF66' : '#2E7D32' // Green
    return theme.isDark ? '#339AF0' : '#1976D2' // Blue
  }

  const getTemperatureColor = (temp: number, theme: ThemeColors): string => {
    // Traffic light system based on real GPU operating ranges
    if (temp >= 85) return theme.isDark ? '#FF6B6B' : '#D32F2F'      // Red: Danger zone (>85°C)
    if (temp >= 80) return theme.isDark ? '#FFA94D' : '#F57C00'      // Orange: Warning (80-84°C)
    if (temp >= 70) return theme.isDark ? '#FFD43B' : '#FFC107'      // Yellow: Normal gaming temp (70-79°C)
    if (temp >= 65) return theme.isDark ? '#51CF66' : '#2E7D32'      // Green: Ideal temp (65-69°C)
    if (temp >= 50) return theme.isDark ? '#339AF0' : '#1976D2'      // Blue: Cool (50-64°C)
    return theme.isDark ? '#748FFC' : '#3F51B5'                      // Indigo: Very cool (<50°C)
  }

  const getFanSpeedColor = (speed: number, theme: ThemeColors): string => {
    // ADA-compliant colors with good contrast ratios
    if (speed >= 80) return theme.isDark ? '#FF6B6B' : '#D32F2F'
    if (speed >= 60) return theme.isDark ? '#FFA94D' : '#F57C00'
    if (speed >= 40) return theme.isDark ? '#51CF66' : '#2E7D32'
    return theme.isDark ? '#339AF0' : '#1976D2'
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: theme.background,
      color: theme.text,
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, color: theme.text }}>
            NVIDIA-SMI {data.nvidia_info.driver_version}
          </h1>
          <div style={{ 
            display: 'flex', 
            gap: '20px',
            color: theme.subtext,
            fontSize: '1rem',
            fontFamily: 'monospace',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{
              padding: '2px 6px',
              backgroundColor: theme.cardBackground,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              fontSize: '0.9em',
              display: 'flex',
              gap: '6px'
            }}>
              <span style={{ color: theme.subtext }}>Driver:</span>
              {data.nvidia_info.driver_version}
            </span>
            <span style={{
              padding: '2px 6px',
              backgroundColor: theme.cardBackground,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              fontSize: '0.9em',
              display: 'flex',
              gap: '6px'
            }}>
              <span style={{ color: theme.subtext }}>CUDA:</span>
              12.2
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={pollingInterval}
            onChange={(e) => setPollingInterval(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBackground,
              color: theme.text,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {POLLING_INTERVALS.map(interval => (
              <option key={interval.value} value={interval.value}>
                Update every {interval.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBackground,
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            )}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
      
      {/* GPU Cards */}
      {data.gpus.map(gpu => {
        const memoryPercentage = (gpu.memory_used / gpu.memory_total) * 100
        const powerPercentage = Math.min((gpu.power_draw / 250) * 100, 100) // Assuming max power is 250W

        return (
          <div key={gpu.index} style={{ 
            border: `1px solid ${theme.border}`,
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px',
            backgroundColor: theme.cardBackground,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: theme.text }}>{gpu.name}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.9rem', 
                  padding: '3px 8px', 
                  backgroundColor: theme.progressBackground,
                  borderRadius: '4px',
                  color: theme.subtext
                }}>
                  GPU #{gpu.index}
                </span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  padding: '3px 8px', 
                  backgroundColor: theme.progressBackground,
                  borderRadius: '4px',
                  color: theme.subtext
                }}>
                  {(gpu.memory_total / 1024).toFixed(1)} GB
                </span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {/* GPU Stats */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '150px' }}>
                  <div style={{ marginBottom: '8px', color: theme.subtext }}>GPU Utilization</div>
                  <div 
                    role="progressbar" 
                    aria-valuenow={gpu.gpu_utilization}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`GPU ${gpu.index} utilization: ${gpu.gpu_utilization}%`}
                    style={{ 
                      height: '24px', 
                      backgroundColor: theme.progressBackground,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: `${gpu.gpu_utilization}%`,
                      height: '100%',
                      backgroundColor: getUtilizationColor(gpu.gpu_utilization, theme),
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
                        opacity: theme.isDark ? 0.1 : 0.2
                      }} />
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '4px', 
                    textAlign: 'right',
                    color: getUtilizationColor(gpu.gpu_utilization, theme)
                  }}>{gpu.gpu_utilization}%</div>
                </div>

                <div style={{ flex: '1', minWidth: '150px' }}>
                  <div style={{ marginBottom: '8px', color: theme.subtext }}>Memory Usage</div>
                  <div 
                    role="progressbar"
                    aria-valuenow={(gpu.memory_used / gpu.memory_total) * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`GPU ${gpu.index} memory usage: ${(gpu.memory_used / gpu.memory_total * 100).toFixed(1)}%`}
                    style={{ 
                      height: '24px', 
                      backgroundColor: theme.progressBackground,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: `${(gpu.memory_used / gpu.memory_total) * 100}%`,
                      height: '100%',
                      backgroundColor: getUtilizationColor((gpu.memory_used / gpu.memory_total) * 100, theme),
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
                        opacity: theme.isDark ? 0.1 : 0.2
                      }} />
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '4px', 
                    textAlign: 'right',
                    color: getUtilizationColor((gpu.memory_used / gpu.memory_total) * 100, theme)
                  }}>{gpu.memory_used}MB / {gpu.memory_total}MB</div>
                </div>

                <div style={{ flex: '1', minWidth: '150px' }}>
                  <div style={{ marginBottom: '8px', color: theme.subtext }}>Temperature</div>
                  <div 
                    role="progressbar"
                    aria-valuenow={gpu.temperature}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`GPU ${gpu.index} temperature: ${gpu.temperature}°C, ${Math.round(gpu.temperature * 9/5 + 32)}°F`}
                    style={{ 
                      height: '24px', 
                      backgroundColor: theme.progressBackground,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: `${Math.min((gpu.temperature / 100) * 100, 100)}%`,
                      height: '100%',
                      backgroundColor: getTemperatureColor(gpu.temperature, theme),
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
                        opacity: theme.isDark ? 0.1 : 0.2
                      }} />
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '4px', 
                    textAlign: 'right',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      color: getTemperatureColor(gpu.temperature, theme),
                      fontSize: '1.1em',
                      fontWeight: 500
                    }}>
                      {gpu.temperature}°C
                    </span>
                    <span style={{ 
                      color: theme.subtext,
                      fontSize: '0.9em'
                    }}>
                      / {Math.round(gpu.temperature * 9/5 + 32)}°F
                    </span>
                    {gpu.temp_change_rate !== 0 && (
                      <span style={{
                        color: gpu.temp_change_rate > 0 ? '#ff4444' : '#44ff44',
                        fontSize: '0.9em'
                      }}>
                        ({gpu.temp_change_rate > 0 ? '+' : ''}{gpu.temp_change_rate}°C/min)
                      </span>
                    )}
                    {gpu.peak_temperature > gpu.temperature && (
                      <span style={{
                        color: getTemperatureColor(gpu.peak_temperature, theme),
                        fontSize: '0.8em'
                      }}>
                        Peak: {gpu.peak_temperature}°C
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flex: '1', minWidth: '150px' }}>
                  <div style={{ marginBottom: '8px', color: theme.subtext }}>Fan Speed</div>
                  <div 
                    role="progressbar"
                    aria-valuenow={gpu.fan_speed}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`GPU ${gpu.index} fan speed: ${gpu.fan_speed}%`}
                    style={{ 
                      height: '24px', 
                      backgroundColor: theme.progressBackground,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: `${gpu.fan_speed}%`,
                      height: '100%',
                      backgroundColor: getFanSpeedColor(gpu.fan_speed, theme),
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
                        opacity: theme.isDark ? 0.1 : 0.2
                      }} />
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '4px', 
                    textAlign: 'right',
                    color: getFanSpeedColor(gpu.fan_speed, theme)
                  }}>{gpu.fan_speed}%</div>
                </div>
              </div>
            </div>
            
            {/* GPU Burn Status */}
            {data.gpu_burn_metrics.running && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: theme.cardBackground,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#ff4444',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontWeight: 500 }}>GPU Burn Test Running</span>
                  </div>
                  <div style={{ color: theme.subtext }}>
                    Duration: {Math.floor(data.gpu_burn_metrics.duration / 60)}m {Math.round(data.gpu_burn_metrics.duration % 60)}s
                  </div>
                </div>
                {data.gpu_burn_metrics.errors > 0 && (
                  <div style={{ color: '#ff4444', marginTop: '10px' }}>
                    ⚠️ {data.gpu_burn_metrics.errors} computation errors detected
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Running Processes */}
      {data.processes.length > 0 && (
        <div style={{ 
          border: `1px solid ${theme.border}`,
          padding: '20px',
          marginTop: '20px',
          borderRadius: '8px',
          backgroundColor: theme.cardBackground,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: theme.text }}>Running Processes</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '10px' 
          }}>
            {data.processes
              .filter(proc => proc.name.toLowerCase() !== 'unknown')
              .map((proc, idx) => (
                <div key={`${proc.pid}-${idx}`} style={{ 
                  padding: '10px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  backgroundColor: theme.cardBackground
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: theme.text }}>{proc.name}</div>
                      <div style={{ fontSize: '12px', color: theme.subtext }}>PID: {proc.pid}</div>
                    </div>
                    <div style={{ color: theme.text }}>{proc.used_memory} MB</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App

<style>
  {`
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `}
</style>
