import type { GPUBurnMetrics, GPUInfo, ThemeColors } from '../types'
import {
  getFanSpeedColor,
  getMetricColor,
  getTemperatureColor,
  getTempTrend,
} from '../colors'
import { GPUBurnStatus } from './GPUBurnStatus'
import { ProgressBar } from './ProgressBar'

interface Props {
  gpu: GPUInfo
  gpuBurnMetrics: GPUBurnMetrics
  theme: ThemeColors
}

export function GPUCard({ gpu, gpuBurnMetrics, theme }: Props) {
  const memoryPct = (gpu.memory_used / gpu.memory_total) * 100
  const tempPct = Math.min((gpu.temperature / 100) * 100, 100)
  const powerPct = Math.min((gpu.power_draw / gpu.power_limit) * 100, 100)
  const tempTrend = getTempTrend(gpu.temp_change_rate, theme)

  const badge = (text: string) => (
    <span
      style={{
        fontSize: '0.9rem',
        padding: '3px 8px',
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.border}`,
        borderRadius: '4px',
        color: theme.subtext,
      }}
    >
      {text}
    </span>
  )

  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        padding: '20px',
        margin: '20px 0',
        borderRadius: '8px',
        backgroundColor: theme.cardBackground,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: theme.text }}>{gpu.name}</h2>
        {badge(`GPU #${gpu.index}`)}
        {badge(`${(gpu.memory_total / 1024).toFixed(1)} GB`)}
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

        {/* Utilization */}
        <MetricBlock label="GPU Utilization" theme={theme}>
          <ProgressBar
            value={gpu.gpu_utilization}
            color={getMetricColor(gpu.gpu_utilization, theme)}
            theme={theme}
            ariaLabel={`GPU ${gpu.index} utilization: ${gpu.gpu_utilization}%`}
          />
          <div style={{ marginTop: '4px', textAlign: 'right', color: getMetricColor(gpu.gpu_utilization, theme) }}>
            {gpu.gpu_utilization}%
          </div>
        </MetricBlock>

        {/* Memory */}
        <MetricBlock label="Memory Usage" theme={theme}>
          <ProgressBar
            value={memoryPct}
            color={getMetricColor(memoryPct, theme)}
            theme={theme}
            ariaLabel={`GPU ${gpu.index} memory: ${memoryPct.toFixed(1)}%`}
          />
          <div style={{ marginTop: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
            <span style={{ color: getMetricColor(memoryPct, theme) }}>
              {(gpu.memory_used / 1024).toFixed(1)} GB
            </span>
            <span style={{ color: theme.subtext }}>
              / {(gpu.memory_total / 1024).toFixed(1)} GB
            </span>
          </div>
        </MetricBlock>

        {/* Temperature */}
        <MetricBlock label="Temperature" theme={theme}>
          <ProgressBar
            value={tempPct}
            color={getTemperatureColor(gpu.temperature, theme)}
            theme={theme}
            ariaLabel={`GPU ${gpu.index} temperature: ${gpu.temperature}°C`}
          />
          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: getTemperatureColor(gpu.temperature, theme), fontSize: '1.1em', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {tempTrend.icon && (
                <span style={{ color: tempTrend.color, fontSize: '1.5em', fontWeight: 'bold' }}>
                  {tempTrend.icon}
                </span>
              )}
              {Math.round(gpu.temperature)}°C
            </span>
            <span style={{ color: theme.subtext }}>
              / {Math.round(gpu.temperature * 9 / 5 + 32)}°F
            </span>
            <span style={{ color: theme.subtext }}>Peak: {gpu.peak_temperature}°C</span>
          </div>
        </MetricBlock>

        {/* Fan Speed */}
        <MetricBlock label="Fan Speed" theme={theme}>
          <ProgressBar
            value={gpu.fan_speed}
            color={getFanSpeedColor(gpu.fan_speed, theme)}
            theme={theme}
            ariaLabel={`GPU ${gpu.index} fan speed: ${gpu.fan_speed}%`}
          />
          <div style={{ marginTop: '4px', textAlign: 'right', color: getFanSpeedColor(gpu.fan_speed, theme) }}>
            {gpu.fan_speed}%
          </div>
        </MetricBlock>

        {/* Power */}
        <MetricBlock label="Power Draw" theme={theme}>
          <ProgressBar
            value={powerPct}
            color={getMetricColor(powerPct, theme)}
            theme={theme}
            ariaLabel={`GPU ${gpu.index} power: ${gpu.power_draw}W of ${gpu.power_limit}W`}
          />
          <div style={{ marginTop: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
            <span style={{ color: getMetricColor(powerPct, theme) }}>
              {gpu.power_draw} W
            </span>
            <span style={{ color: theme.subtext }}>
              / {gpu.power_limit} W
            </span>
          </div>
        </MetricBlock>

      </div>

      <GPUBurnStatus metrics={gpuBurnMetrics} theme={theme} />
    </div>
  )
}

function MetricBlock({ label, theme, children }: { label: string; theme: ThemeColors; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '8px', color: theme.subtext }}>{label}</div>
      {children}
    </div>
  )
}
