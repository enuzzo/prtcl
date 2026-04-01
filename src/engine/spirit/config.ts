export interface SpiritSettings {
  dieSpeed: number
  radius: number
  attraction: number
  motionSpeed: number
  followMouse: boolean
  shadowDarkness: number
  useTriangleParticles: boolean
  color1: string
  color2: string
  bgColor: string
}

export const DEFAULT_SPIRIT_SETTINGS: SpiritSettings = {
  dieSpeed: 0.01,
  radius: 0.6,
  attraction: -0.86,
  motionSpeed: 0.55,
  followMouse: true,
  shadowDarkness: 0.47,
  useTriangleParticles: false,
  color1: '#4ee404',
  color2: '#0e922c',
  bgColor: '#c31594',
}

export const SPIRIT_CAMERA_POSITION: [number, number, number] = [936.367, 141.421, -351.025]
export const SPIRIT_CAMERA_TARGET: [number, number, number] = [0, 50, 0]
