import type { FontDefinition } from './types'

export const CURATED_FONTS: FontDefinition[] = [
  { family: 'Montserrat', category: 'sans', weights: [300, 400, 700], vibe: 'Clean, modern' },
  { family: 'Inter', category: 'sans', weights: [300, 400, 700], vibe: 'Neutral, readable' },
  { family: 'Bebas Neue', category: 'display', weights: [400], vibe: 'Bold, condensed' },
  { family: 'Oswald', category: 'sans', weights: [300, 400, 700], vibe: 'Strong, editorial' },
  { family: 'Playfair Display', category: 'serif', weights: [400, 700], vibe: 'Elegant' },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 700], vibe: 'Classic, light' },
  { family: 'Righteous', category: 'display', weights: [400], vibe: 'Fun, rounded' },
  { family: 'Pacifico', category: 'handwriting', weights: [400], vibe: 'Script, playful' },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400], vibe: 'Handwritten, rough' },
  { family: 'Bungee', category: 'display', weights: [400], vibe: 'Blocky, bold' },
  { family: 'Space Mono', category: 'mono', weights: [400, 700], vibe: 'Technical' },
  { family: 'Fira Code', category: 'mono', weights: [300, 400, 700], vibe: 'Developer' },
]

/** Build the Google Fonts CSS API URL for all curated fonts */
export function buildGoogleFontsUrl(): string {
  const families = CURATED_FONTS.map((f) => {
    const weights = f.weights.join(';')
    return `family=${f.family.replace(/ /g, '+')}:wght@${weights}`
  })
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}
