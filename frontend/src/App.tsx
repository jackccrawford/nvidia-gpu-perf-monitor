import { useCallback, useEffect, useRef, useState } from 'react'
import { DARK_THEME, LIGHT_THEME, type GPUData } from './types'
import { Header } from './components/Header'
import { GPUCard } from './components/GPUCard'
import { ProcessList } from './components/ProcessList'

function App() {
  const [data, setData] = useState<GPUData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [pollingInterval, setPollingInterval] = useState(() => {
    const saved = localStorage.getItem('pollingInterval')
    return saved ? parseInt(saved) : 1000
  })

  const theme = darkMode ? DARK_THEME : LIGHT_THEME

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('pollingInterval', pollingInterval.toString())
  }, [pollingInterval])

  // Polling: use setTimeout to avoid overlapping requests
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/gpu-stats')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json: GPUData = await response.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      timerRef.current = setTimeout(fetchData, pollingInterval)
    }
  }, [pollingInterval])

  useEffect(() => {
    fetchData()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchData])

  if (!data && !error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: theme.background, color: theme.text }}>
        Connecting to GPU service…
      </div>
    )
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: theme.background, color: '#FF6B6B', flexDirection: 'column', gap: '8px' }}>
        <strong>Could not reach GPU service</strong>
        <span style={{ fontSize: '0.9em', opacity: 0.8 }}>{error}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: theme.background,
        color: theme.text,
        minHeight: '100vh',
      }}
    >
      <Header
        driverVersion={data!.nvidia_info.driver_version}
        cudaVersion={data!.nvidia_info.cuda_version}
        darkMode={darkMode}
        pollingInterval={pollingInterval}
        onToggleDark={() => setDarkMode((d: boolean) => !d)}
        onPollingChange={setPollingInterval}
        theme={theme}
      />

      {data!.gpus.map(gpu => (
        <GPUCard
          key={gpu.index}
          gpu={gpu}
          gpuBurnMetrics={data!.gpu_burn_metrics}
          theme={theme}
        />
      ))}

      <ProcessList processes={data!.processes} theme={theme} />
    </div>
  )
}

export default App
