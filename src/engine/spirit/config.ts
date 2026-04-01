export interface SpiritSettings {
  dieSpeed: number
  radius: number
  attraction: number
  motionSpeed: number
  followMouse: boolean
  shadowDarkness: number
  objectShadow: number
  bottomLift: number
  useTriangleParticles: boolean
  color1: string
  color2: string
  bgColor: string
  floorShadow?: number
  bottomOpacity?: number
}

export const DEFAULT_SPIRIT_SETTINGS: SpiritSettings = {
  dieSpeed: 0.01,
  radius: 0.82,
  attraction: -0.86,
  motionSpeed: 0.55,
  followMouse: true,
  shadowDarkness: 2.93,
  objectShadow: 0.49,
  bottomLift: 0.36,
  useTriangleParticles: false,
  color1: '#4ee404',
  color2: '#0e922c',
  bgColor: '#c31594',
}

export function normalizeSpiritSettings(settings?: Partial<SpiritSettings>): SpiritSettings {
  const legacyShadow = settings?.shadowDarkness ?? settings?.objectShadow ?? settings?.floorShadow
  const legacyBottomLift = settings?.bottomLift ?? (
    settings?.bottomOpacity != null
      ? 1 - settings.bottomOpacity
      : undefined
  )
  return {
    ...DEFAULT_SPIRIT_SETTINGS,
    ...settings,
    shadowDarkness: legacyShadow ?? DEFAULT_SPIRIT_SETTINGS.shadowDarkness,
    objectShadow: settings?.objectShadow ?? legacyShadow ?? DEFAULT_SPIRIT_SETTINGS.objectShadow,
    bottomLift: legacyBottomLift ?? DEFAULT_SPIRIT_SETTINGS.bottomLift,
  }
}

export const SPIRIT_CAMERA_POSITION: [number, number, number] = [419.26, 94.925, -157.172]
export const SPIRIT_CAMERA_TARGET: [number, number, number] = [0, 50, 0]
