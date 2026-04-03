import type { FlowSettings } from './config'

export interface FlowColorway {
  id: string
  name: string
  color1: string
  color2: string
  bgColor: string
}

export const FLOW_COLORWAYS: FlowColorway[] = [
  { id: 'bloom', name: 'Bloom', color1: '#16e508', color2: '#c7c7c7', bgColor: '#f9f0f9' },
  { id: 'original', name: 'Original', color1: '#ff4040', color2: '#000000', bgColor: '#ffffff' },
  { id: 'ember', name: 'Ember', color1: '#ff7a45', color2: '#3a1207', bgColor: '#fff2ea' },
  { id: 'cyan-drift', name: 'Cyan Drift', color1: '#40d8ff', color2: '#0f2d3a', bgColor: '#f4fcff' },
  { id: 'ultraviolet', name: 'Ultraviolet', color1: '#c584ff', color2: '#25103b', bgColor: '#faf5ff' },
  { id: 'acid-cloud', name: 'Acid Cloud', color1: '#78ff5b', color2: '#16361a', bgColor: '#f4fff1' },
  { id: 'gold-noir', name: 'Gold Noir', color1: '#ffcf70', color2: '#2a2311', bgColor: '#fffaf0' },
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
