import type { ThemeColors } from '../types'

interface Props {
  value: number        // 0-100
  color: string
  theme: ThemeColors
  ariaLabel: string
}

export function ProgressBar({ value, color, theme, ariaLabel }: Props) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      style={{
        height: '24px',
        backgroundColor: theme.progressBackground,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(value, 100)}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'all 0.3s ease-in-out',
          background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
        }}
      />
    </div>
  )
}
