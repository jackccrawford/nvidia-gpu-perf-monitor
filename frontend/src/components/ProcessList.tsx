import type { GPUProcess, ThemeColors } from '../types'

interface Props {
  processes: GPUProcess[]
  theme: ThemeColors
}

export function ProcessList({ processes, theme }: Props) {
  const visible = processes.filter(p => p.name.toLowerCase() !== 'unknown')
  if (visible.length === 0) return null

  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        padding: '20px',
        marginTop: '20px',
        borderRadius: '8px',
        backgroundColor: theme.cardBackground,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ marginTop: 0, color: theme.text }}>Running Processes</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
        {visible.map((proc, idx) => (
          <div
            key={`${proc.pid}-${idx}`}
            style={{
              padding: '10px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              backgroundColor: theme.cardBackground,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>{proc.name}</div>
              <div style={{ fontSize: '12px', color: theme.subtext }}>
                PID: {proc.pid} &nbsp;·&nbsp; GPU #{proc.gpu_index}
              </div>
            </div>
            <div style={{ color: theme.text }}>{proc.used_memory.toFixed(0)} MB</div>
          </div>
        ))}
      </div>
    </div>
  )
}
