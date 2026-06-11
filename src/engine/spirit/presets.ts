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
  {
    id: 'ink-ritual',
    name: 'Ink Ritual',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1,
      position: [...SPIRIT_CAMERA_POSITION],
      target: [...SPIRIT_CAMERA_TARGET],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
      dieSpeed: 0.012,
      radius: 0.65,
      attraction: -0.7,
      motionSpeed: 0.8,
      shadowDarkness: 1.8,
      color1: '#1a1a1a',
      color2: '#3a3a4a',
      bgColor: '#efe9e2',
    },
  },
  {
    id: 'sodium-ghost',
    name: 'Sodium Ghost',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1,
      position: [...SPIRIT_CAMERA_POSITION],
      target: [...SPIRIT_CAMERA_TARGET],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
      dieSpeed: 0.008,
      radius: 0.95,
      attraction: -0.95,
      motionSpeed: 0.4,
      color1: '#ffb12b',
      color2: '#cc4400',
      bgColor: '#120a2a',
    },
  },
  {
    id: 'cherenkov',
    name: 'Cherenkov',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1,
      position: [...SPIRIT_CAMERA_POSITION],
      target: [...SPIRIT_CAMERA_TARGET],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
      dieSpeed: 0.015,
      radius: 0.7,
      attraction: -0.6,
      motionSpeed: 1.3,
      useTriangleParticles: true,
      color1: '#2cf4ff',
      color2: '#0a3acc',
      bgColor: '#02040f',
    },
  },
  {
    id: 'acid-pop',
    name: 'Acid Pop',
    camera: {
      autoRotateSpeed: 0,
      zoom: 1,
      position: [...SPIRIT_CAMERA_POSITION],
      target: [...SPIRIT_CAMERA_TARGET],
    },
    spirit: {
      ...DEFAULT_SPIRIT_SETTINGS,
      motionSpeed: 0.7,
      radius: 0.85,
      color1: '#7cff00',
      color2: '#ff2bd6',
      bgColor: '#08040e',
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
