import type { FlowSettings } from './config'

export interface FlowColorway {
  id: string
  name: string
  color1: string
  color2: string
  bgColor: string
}

export const FLOW_COLORWAYS: FlowColorway[] = [
  { id: 'default', name: 'Default', color1: '#72ea50', color2: '#1a1025', bgColor: '#280e3a' },
  { id: 'obsidian', name: 'Obsidian', color1: '#e8e0f0', color2: '#1a1025', bgColor: '#0a0610' },
  { id: 'solar', name: 'Solar', color1: '#ff6a1a', color2: '#3d0a00', bgColor: '#0d0400' },
  { id: 'abyss', name: 'Abyss', color1: '#30d5f7', color2: '#081a2a', bgColor: '#020a12' },
  { id: 'toxic', name: 'Toxic', color1: '#7aff2b', color2: '#0d2600', bgColor: '#040800' },
  { id: 'phantom', name: 'Phantom', color1: '#c8b0ff', color2: '#1a0f30', bgColor: '#08041a' },
  { id: 'gold', name: 'Gold', color1: '#ffc845', color2: '#2a1a00', bgColor: '#0a0600' },
  { id: 'neon', name: 'Neon', color1: '#ff2bd6', color2: '#20002a', bgColor: '#0a0010' },
  { id: 'arctic', name: 'Arctic', color1: '#d0eeff', color2: '#a0b8c8', bgColor: '#e8f4fa' },
  { id: 'blood', name: 'Blood', color1: '#cc1a1a', color2: '#1a0505', bgColor: '#080202' },
  { id: 'ember', name: 'Ember', color1: '#ff7a45', color2: '#3a1207', bgColor: '#fff2ea' },
  { id: 'original', name: 'Original', color1: '#ff4040', color2: '#000000', bgColor: '#ffffff' },
]

export function getFlowColorway(id: string): FlowColorway | undefined {
  return FLOW_COLORWAYS.find((colorway) => colorway.id === id)
}

export function matchFlowColorway(settings: Pick<FlowSettings, 'color1' | 'color2' | 'bgColor'>): string {
  const color1 = settings.color1.toLowerCase()
  const color2 = settings.color2.toLowerCase()
  const bgColor = settings.bgColor.toLowerCase()

  return FLOW_COLORWAYS.find((colorway) =>
    colorway.color1.toLowerCase() === color1 &&
    colorway.color2.toLowerCase() === color2 &&
    colorway.bgColor.toLowerCase() === bgColor,
  )?.id ?? 'custom'
}
