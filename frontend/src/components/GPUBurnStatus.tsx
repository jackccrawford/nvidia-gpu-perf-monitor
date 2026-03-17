import type { GPUBurnMetrics, ThemeColors } from '../types'

interface Props {
  metrics: GPUBurnMetrics
  theme: ThemeColors
}

export function GPUBurnStatus({ metrics, theme }: Props) {
  if (!metrics.running) return null

  const minutes = Math.floor(metrics.duration / 60)
  const seconds = Math.round(metrics.duration % 60)

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: theme.cardBackground,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: metrics.errors > 0 ? '10px' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ff4444',
              animation: 'pulse 2s infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 500 }}>GPU Burn Test Running</span>
        </div>
        <div style={{ color: theme.subtext }}>
          Duration: {minutes}m {seconds}s
        </div>
      </div>
      {metrics.errors > 0 && (
        <div style={{ color: '#ff4444' }}>
          ⚠️ {metrics.errors} computation errors detected
        </div>
      )}
    </div>
  )
}
