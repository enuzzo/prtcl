import type { SpiritSettings } from './config'

export interface SpiritColorway {
  id: string
  name: string
  color1: string
  color2: string
  bgColor: string
}

export const SPIRIT_COLORWAYS: SpiritColorway[] = [
  { id: 'spring-blossom', name: 'Spring Blossom', color1: '#ffd166', color2: '#ff6fb5', bgColor: '#5c1d4f' },
  { id: 'acid-pop', name: 'Acid Pop', color1: '#c8ff00', color2: '#37ff8b', bgColor: '#17082a' },
  { id: 'techno-lime', name: 'Techno Lime', color1: '#4ee404', color2: '#0e922c', bgColor: '#c31594' },
  { id: 'deep-ocean', name: 'Deep Ocean', color1: '#6cf7ff', color2: '#1479ff', bgColor: '#061d3a' },
  { id: 'nature-pulse', name: 'Nature Pulse', color1: '#c2ff6d', color2: '#2d9b4d', bgColor: '#13261a' },
  { id: 'cyberpunk', name: 'Cyberpunk', color1: '#00f6ff', color2: '#ff3dbb', bgColor: '#190028' },
  { id: 'ultraviolet', name: 'Ultraviolet', color1: '#f5a3ff', color2: '#7d5cff', bgColor: '#140028' },
  { id: 'volcanic', name: 'Volcanic', color1: '#ffb347', color2: '#ff4d2d', bgColor: '#2a0e08' },
  { id: 'desert-ember', name: 'Desert Ember', color1: '#ffd49a', color2: '#d96b2b', bgColor: '#4a2514' },
  { id: 'noir-mint', name: 'Noir Mint', color1: '#d8fff0', color2: '#44d9a6', bgColor: '#071412' },
]

export function getSpiritColorway(id: string): SpiritColorway | undefined {
  return SPIRIT_COLORWAYS.find((colorway) => colorway.id === id)
}

export function matchSpiritColorway(settings: Pick<SpiritSettings, 'color1' | 'color2' | 'bgColor'>): string {
  const color1 = settings.color1.toLowerCase()
  const color2 = settings.color2.toLowerCase()
  const bgColor = settings.bgColor.toLowerCase()

  return SPIRIT_COLORWAYS.find((colorway) =>
    colorway.color1.toLowerCase() === color1 &&
    colorway.color2.toLowerCase() === color2 &&
    colorway.bgColor.toLowerCase() === bgColor,
  )?.id ?? 'custom'
}
