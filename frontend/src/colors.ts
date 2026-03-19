import type { ThemeColors } from './types'

interface ColorPair {
  light: string
  dark: string
}

interface ColorScheme {
  critical: ColorPair
  warning: ColorPair
  caution: ColorPair
  good: ColorPair
  ideal: ColorPair
}

const COLORS: ColorScheme = {
  critical: { light: '#DC2626', dark: '#FF6B6B' },
  warning:  { light: '#EA580C', dark: '#FFA94D' },
  caution:  { light: '#CA8A04', dark: '#FFD43B' },
  good:     { light: '#16A34A', dark: '#51CF66' },
  ideal:    { light: '#2563EB', dark: '#339AF0' },
}

function pick(pair: ColorPair, isDark: boolean): string {
  return isDark ? pair.dark : pair.light
}

export function getMetricColor(value: number, theme: ThemeColors): string {
  const d = theme.isDark
  if (value >= 90) return pick(COLORS.critical, d)
  if (value >= 75) return pick(COLORS.warning, d)
  if (value >= 50) return pick(COLORS.caution, d)
  if (value >= 25) return pick(COLORS.good, d)
  return pick(COLORS.ideal, d)
}

export function getTemperatureColor(temp: number, theme: ThemeColors): string {
  const d = theme.isDark
  if (temp >= 80) return pick(COLORS.critical, d)
  if (temp >= 70) return pick(COLORS.warning, d)
  if (temp >= 60) return pick(COLORS.caution, d)
  if (temp >= 50) return pick(COLORS.good, d)
  return pick(COLORS.ideal, d)
}

export function getFanSpeedColor(speed: number, theme: ThemeColors): string {
  const d = theme.isDark
  if (speed > 80) return pick(COLORS.critical, d)
  if (speed > 65) return pick(COLORS.warning, d)
  if (speed > 50) return pick(COLORS.caution, d)
  if (speed > 35) return pick(COLORS.good, d)
  return pick(COLORS.ideal, d)
}

export function getTempTrend(rate: number, theme: ThemeColors): { icon: string; color: string } {
  if (Math.abs(rate) < 1.0) return { icon: '', color: theme.text }
  return rate > 0
    ? { icon: '⌃', color: pick(COLORS.critical, theme.isDark) }
    : { icon: '⌄', color: pick(COLORS.good, theme.isDark) }
}
