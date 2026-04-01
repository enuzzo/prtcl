import { DEFAULT_SPIRIT_SETTINGS, SPIRIT_CAMERA_POSITION, SPIRIT_CAMERA_TARGET, type SpiritSettings } from './config'

export interface SpiritPresetCamera {
  autoRotateSpeed: number
  zoom: number
  position: [number, number, number]
  target: [number, number, number]
}

export interface SpiritPreset {
  id: string
  name: string
  camera: SpiritPresetCamera
  spirit: SpiritSettings
}

export const SPIRIT_PRESETS: SpiritPreset[] = [
  {
    id: 'default',
    name: 'Default',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1,
      position: [...SPIRIT_CAMERA_POSITION],
      target: [...SPIRIT_CAMERA_TARGET],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
    },
  },
  {
    id: 'melito',
    name: 'Melito',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1.8,
      position: [517.605, 105.463, -194.039],
      target: [0, 50, 0],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
      dieSpeed: 0.024,
      radius: 0.53,
      attraction: -0.51,
      motionSpeed: 1.15,
      followMouse: true,
      shadowDarkness: 0.34,
      useTriangleParticles: false,
      color1: '#0a65b8',
      color2: '#10bc54',
      bgColor: '#ff12f1',
    },
  },
]

function near(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) <= epsilon
}

function nearVec3(a: [number, number, number], b: [number, number, number], epsilon = 0.001): boolean {
  return near(a[0], b[0], epsilon) && near(a[1], b[1], epsilon) && near(a[2], b[2], epsilon)
}

export function getSpiritPreset(id: string): SpiritPreset | undefined {
  return SPIRIT_PRESETS.find((preset) => preset.id === id)
}

export function matchSpiritPreset(input: {
  camera: SpiritPresetCamera
  spirit: SpiritSettings
}): string {
  const { camera, spirit } = input
  const color1 = spirit.color1.toLowerCase()
  const color2 = spirit.color2.toLowerCase()
  const bgColor = spirit.bgColor.toLowerCase()

  return SPIRIT_PRESETS.find((preset) =>
    near(preset.camera.autoRotateSpeed, camera.autoRotateSpeed) &&
    near(preset.camera.zoom, camera.zoom) &&
    nearVec3(preset.camera.position, camera.position) &&
    nearVec3(preset.camera.target, camera.target) &&
    near(preset.spirit.dieSpeed, spirit.dieSpeed) &&
    near(preset.spirit.radius, spirit.radius) &&
    near(preset.spirit.attraction, spirit.attraction) &&
    near(preset.spirit.motionSpeed, spirit.motionSpeed) &&
    preset.spirit.followMouse === spirit.followMouse &&
    near(preset.spirit.shadowDarkness, spirit.shadowDarkness) &&
    near(preset.spirit.objectShadow, spirit.objectShadow) &&
    near(preset.spirit.bottomLift, spirit.bottomLift) &&
    preset.spirit.useTriangleParticles === spirit.useTriangleParticles &&
    preset.spirit.color1.toLowerCase() === color1 &&
    preset.spirit.color2.toLowerCase() === color2 &&
    preset.spirit.bgColor.toLowerCase() === bgColor,
  )?.id ?? 'custom'
}
