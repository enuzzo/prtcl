import { DEFAULT_FLOW_SETTINGS, type FlowSettings } from './config'

export interface FlowPreset {
  id: string
  name: string
  flow: FlowSettings
}

const ORIGINAL_FLOW_SETTINGS: FlowSettings = {
  particleCount: 20000,
  particleSize: 1,
  spread: 1,
  speed: 2,
  turbulence: 0.2,
  color1: '#ff4040',
  color2: '#000000',
  bgColor: '#ffffff',
}

export const FLOW_PRESETS: FlowPreset[] = [
  {
    id: 'bloom',
    name: 'Bloom',
    flow: {
      ...DEFAULT_FLOW_SETTINGS,
    },
  },
  {
    id: 'original',
    name: 'Original',
    flow: {
      ...ORIGINAL_FLOW_SETTINGS,
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
    preset.flow.color1.toLowerCase() === color1 &&
    preset.flow.color2.toLowerCase() === color2 &&
    preset.flow.bgColor.toLowerCase() === bgColor,
  )?.id ?? 'custom'
}
