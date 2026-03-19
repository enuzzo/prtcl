import type { FontDefinition } from './types'

export const CURATED_FONTS: FontDefinition[] = [
  // ── Script / Handwriting ──
  { family: 'Pacifico', category: 'handwriting', weights: [400], vibe: 'Script, playful' },
  { family: 'Sacramento', category: 'handwriting', weights: [400], vibe: 'Elegant script' },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400], vibe: 'Handwritten, rough' },
  // ── Display / Personality ──
  { family: 'Bebas Neue', category: 'display', weights: [400], vibe: 'Bold, condensed' },
  { family: 'Bungee', category: 'display', weights: [400], vibe: 'Blocky, bold' },
  { family: 'Righteous', category: 'display', weights: [400], vibe: 'Fun, rounded' },
  { family: 'Monoton', category: 'display', weights: [400], vibe: 'Retro neon outline' },
  { family: 'Rubik Glitch', category: 'display', weights: [400], vibe: 'Glitchy, digital' },
  { family: 'Orbitron', category: 'display', weights: [400, 700], vibe: 'Futuristic, sci-fi' },
  { family: 'Press Start 2P', category: 'display', weights: [400], vibe: '8-bit pixel' },
  { family: 'Silkscreen', category: 'display', weights: [400, 700], vibe: 'Pixel bitmap' },
  // ── Serif / Editorial ──
  { family: 'Playfair Display', category: 'serif', weights: [400, 700], vibe: 'Elegant' },
  { family: 'Abril Fatface', category: 'serif', weights: [400], vibe: 'Thick, editorial' },
  // ── Mono ──
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
