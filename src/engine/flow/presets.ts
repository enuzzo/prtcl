import { DEFAULT_FLOW_SETTINGS, type FlowSettings } from './config'

export interface FlowPreset {
  id: string
  name: string
  flow: FlowSettings
}

export const FLOW_PRESETS: FlowPreset[] = [
  {
    id: 'default',
    name: 'Default',
    flow: { ...DEFAULT_FLOW_SETTINGS },
  },
  {
    id: 'obsidian-plume',
    name: 'Obsidian Plume',
    flow: {
      particleCount: 65536,
      particleSize: 1.1,
      spread: 1.2,
      speed: 1.6,
      turbulence: 0.28,
      autoRotateSpeed: 0.6,
      zoom: 1,
      sharpness: 2,
      color1: '#e8e0f0',
      color2: '#1a1025',
      bgColor: '#0a0610',
    },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    flow: {
      particleCount: 131072,
      particleSize: 1.5,
      spread: 1.6,
      speed: 3.2,
      turbulence: 0.38,
      autoRotateSpeed: 0.8,
      zoom: 1,
      sharpness: 2,
      color1: '#ff6a1a',
      color2: '#3d0a00',
      bgColor: '#0d0400',
    },
  },
  {
    id: 'deep-abyss',
    name: 'Deep Abyss',
    flow: {
      particleCount: 65536,
      particleSize: 1.4,
      spread: 1.8,
      speed: 0.9,
      turbulence: 0.18,
      autoRotateSpeed: 0.3,
      zoom: 1.2,
      sharpness: 2,
      color1: '#30d5f7',
      color2: '#081a2a',
      bgColor: '#020a12',
    },
  },
  {
    id: 'toxic-column',
    name: 'Toxic Column',
    flow: {
      particleCount: 98960,
      particleSize: 1.0,
      spread: 0.7,
      speed: 3.8,
      turbulence: 0.35,
      autoRotateSpeed: 1.2,
      zoom: 0.9,
      sharpness: 2,
      color1: '#7aff2b',
      color2: '#0d2600',
      bgColor: '#040800',
    },
  },
  {
    id: 'phantom',
    name: 'Phantom',
    flow: {
      particleCount: 65536,
      particleSize: 1.6,
      spread: 2.0,
      speed: 1.0,
      turbulence: 0.12,
      autoRotateSpeed: 0.4,
      zoom: 1.1,
      sharpness: 2,
      color1: '#c8b0ff',
      color2: '#1a0f30',
      bgColor: '#08041a',
    },
  },
  {
    id: 'molten-gold',
    name: 'Molten Gold',
    flow: {
      particleCount: 131072,
      particleSize: 1.2,
      spread: 1.0,
      speed: 2.4,
      turbulence: 0.3,
      autoRotateSpeed: 0.5,
      zoom: 1,
      sharpness: 2,
      color1: '#ffc845',
      color2: '#2a1a00',
      bgColor: '#0a0600',
    },
  },
  {
    id: 'neon-geyser',
    name: 'Neon Geyser',
    flow: {
      particleCount: 131072,
      particleSize: 1.1,
      spread: 0.8,
      speed: 4.0,
      turbulence: 0.4,
      autoRotateSpeed: 1.5,
      zoom: 0.8,
      sharpness: 2,
      color1: '#ff2bd6',
      color2: '#20002a',
      bgColor: '#0a0010',
    },
  },
  {
    id: 'arctic-mist',
    name: 'Arctic Mist',
    flow: {
      particleCount: 65536,
      particleSize: 1.8,
      spread: 2.2,
      speed: 0.6,
      turbulence: 0.1,
      autoRotateSpeed: 0.2,
      zoom: 1.3,
      sharpness: 2,
      color1: '#d0eeff',
      color2: '#a0b8c8',
      bgColor: '#e8f4fa',
    },
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    flow: {
      particleCount: 98960,
      particleSize: 1.3,
      spread: 1.3,
      speed: 2.0,
      turbulence: 0.25,
      autoRotateSpeed: 0.7,
      zoom: 1,
      sharpness: 2,
      color1: '#cc1a1a',
      color2: '#1a0505',
      bgColor: '#080202',
    },
  },
  {
    id: 'original',
    name: 'Original',
    flow: {
      particleCount: 20000,
      particleSize: 1,
      spread: 1,
      speed: 2,
      turbulence: 0.2,
      autoRotateSpeed: 0,
      zoom: 1,
      sharpness: 2,
      color1: '#ff4040',
      color2: '#000000',
      bgColor: '#ffffff',
    },
  },
]

function near(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) <= epsilon
}

export function getFlowPreset(id: string): FlowPreset | undefined {
  return FLOW_PRESETS.find((preset) => preset.id === id)
}

export function matchFlowPreset(flow: FlowSettings): string {
  const color1 = flow.color1.toLowerCase()
  const color2 = flow.color2.toLowerCase()
  const bgColor = flow.bgColor.toLowerCase()

  return FLOW_PRESETS.find((preset) =>
    preset.flow.particleCount === flow.particleCount &&
    near(preset.flow.particleSize, flow.particleSize) &&
    near(preset.flow.spread, flow.spread) &&
    near(preset.flow.speed, flow.speed) &&
    near(preset.flow.turbulence, flow.turbulence) &&
    near(preset.flow.autoRotateSpeed, flow.autoRotateSpeed) &&
    near(preset.flow.zoom, flow.zoom) &&
    near(preset.flow.sharpness, flow.sharpness) &&
    preset.flow.color1.toLowerCase() === color1 &&
    preset.flow.color2.toLowerCase() === color2 &&
    preset.flow.bgColor.toLowerCase() === bgColor,
  )?.id ?? 'custom'
}
