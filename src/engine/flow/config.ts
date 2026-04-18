export interface FlowSettings {
  particleCount: number
  particleSize: number
  spread: number
  speed: number
  turbulence: number
  autoRotateSpeed: number
  zoom: number
  sharpness: number
  color1: string
  color2: string
  bgColor: string
}

export interface FlowQualityLevel {
  label: string
  resolution: [number, number]
  count: number
  diameter: number
  alpha: number
}

export const FLOW_QUALITY_LEVELS: FlowQualityLevel[] = [
  { label: '16K', resolution: [128, 128], count: 128 * 128, diameter: 0.017, alpha: 0.50 },
  { label: '32K', resolution: [256, 128], count: 256 * 128, diameter: 0.015, alpha: 0.44 },
  { label: '65K', resolution: [256, 256], count: 256 * 256, diameter: 0.013, alpha: 0.38 },
  { label: '131K', resolution: [512, 256], count: 512 * 256, diameter: 0.0115, alpha: 0.33 },
  { label: '262K', resolution: [512, 512], count: 512 * 512, diameter: 0.01, alpha: 0.28 },
]

export const FLOW_PARTICLE_COUNT_MIN = 20000
export const FLOW_PARTICLE_COUNT_MAX = FLOW_QUALITY_LEVELS[FLOW_QUALITY_LEVELS.length - 1]!.count

export const DEFAULT_FLOW_SETTINGS: FlowSettings = {
  particleCount: 72640,
  particleSize: 2.02,
  spread: 1.73,
  speed: 1.17,
  turbulence: 0.193,
  autoRotateSpeed: 0,
  zoom: 1,
  sharpness: 2.7,
  color1: '#72ea50',
  color2: '#1a1025',
  bgColor: '#280e3a',
}

function normalizeHexColor(color: string | undefined, fallback: string): string {
  const raw = (color ?? fallback).trim()
  const candidate = raw.startsWith('#') ? raw : `#${raw}`
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) return candidate.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) {
    const full = candidate
      .slice(1)
      .split('')
      .map((char) => char + char)
      .join('')
    return `#${full.toLowerCase()}`
  }
  return fallback
}

export function normalizeFlowSettings(settings: Partial<FlowSettings>): FlowSettings {
  return {
    particleCount: Math.max(
      FLOW_PARTICLE_COUNT_MIN,
      Math.min(FLOW_PARTICLE_COUNT_MAX, Math.round(settings.particleCount ?? DEFAULT_FLOW_SETTINGS.particleCount)),
    ),
    particleSize: Math.max(0.4, Math.min(3, settings.particleSize ?? DEFAULT_FLOW_SETTINGS.particleSize)),
    spread: Math.max(0.5, Math.min(3, settings.spread ?? DEFAULT_FLOW_SETTINGS.spread)),
    speed: Math.max(0, Math.min(5, settings.speed ?? DEFAULT_FLOW_SETTINGS.speed)),
    turbulence: Math.max(0, Math.min(0.5, settings.turbulence ?? DEFAULT_FLOW_SETTINGS.turbulence)),
    autoRotateSpeed: Math.max(-5, Math.min(5, settings.autoRotateSpeed ?? DEFAULT_FLOW_SETTINGS.autoRotateSpeed)),
    zoom: Math.max(0.3, Math.min(3, settings.zoom ?? DEFAULT_FLOW_SETTINGS.zoom)),
    sharpness: Math.max(0.5, Math.min(5, settings.sharpness ?? DEFAULT_FLOW_SETTINGS.sharpness)),
    color1: normalizeHexColor(settings.color1, DEFAULT_FLOW_SETTINGS.color1),
    color2: normalizeHexColor(settings.color2, DEFAULT_FLOW_SETTINGS.color2),
    bgColor: normalizeHexColor(settings.bgColor, DEFAULT_FLOW_SETTINGS.bgColor),
  }
}

export function getFlowCapacityForCount(count: number): { qualityLevel: number; capacity: number } {
  const normalized = normalizeFlowSettings({ particleCount: count }).particleCount
  for (let i = 0; i < FLOW_QUALITY_LEVELS.length; i++) {
    const level = FLOW_QUALITY_LEVELS[i]!
    if (normalized <= level.count) {
      return { qualityLevel: i, capacity: level.count }
    }
  }
  const lastIndex = FLOW_QUALITY_LEVELS.length - 1
  return { qualityLevel: lastIndex, capacity: FLOW_QUALITY_LEVELS[lastIndex]!.count }
}

export function getFlowActiveRatio(count: number): number {
  const { capacity } = getFlowCapacityForCount(count)
  return Math.max(0, Math.min(1, normalizeFlowSettings({ particleCount: count }).particleCount / capacity))
}

export function hexToRgbArray(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, '#000000').slice(1)
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  return [r, g, b]
}
