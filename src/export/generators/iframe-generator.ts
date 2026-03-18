import { CREDITS_HTML_COMMENT } from '../templates/credits'
import type { ExportPayload } from '../types'
import { useStore } from '../../store'

/**
 * Build the embed URL for a given payload.
 * Base: https://prtcl.es/embed
 *
 * Params:
 *   effect      — effect id
 *   particles   — particle count
 *   pointSize   — point size
 *   bg          — background color hex without #
 *   rotate      — autoRotateSpeed
 *   orbit       — 0 | 1
 *   controls    — JSON-encoded control values
 *   badge       — only included (as 0) when showBadge is false
 */
export function buildEmbedUrl(payload: ExportPayload): string {
  const { effect, controls, settings } = payload

  const params = new URLSearchParams()

  params.set('effect', effect.id)
  params.set('particles', String(settings.particleCount))
  params.set('pointSize', String(settings.pointSize))
  params.set('bg', settings.backgroundColor.replace(/^#/, ''))
  params.set('rotate', String(settings.autoRotateSpeed))
  params.set('orbit', settings.orbitControls ? '1' : '0')

  if (Object.keys(controls).length > 0) {
    params.set('controls', JSON.stringify(controls))
  }

  // Only include badge param when it's explicitly disabled
  if (!settings.showBadge) {
    params.set('badge', '0')
  }

  // Text params for text effects
  if (effect.category === 'text') {
    const { textInput, textFont, textWeight } = useStore.getState()
    params.set('text', textInput)
    params.set('font', textFont)
    params.set('weight', textWeight)
  }

  // Use current origin in dev so the iframe works locally for testing
  const base = import.meta.env.DEV
    ? `${window.location.origin}/embed`
    : 'https://prtcl.es/embed'
  return `${base}?${params.toString()}`
}

/**
 * Parse the height setting into an iframe-compatible attribute value.
 * '500px'  → '500'
 * '100vh'  → '100%'
 * anything else → returned as-is
 */
function parseHeight(height: string): string {
  if (height === '100vh') return '100%'
  const pxMatch = height.match(/^(\d+)px$/)
  if (pxMatch) return pxMatch[1]!
  return height
}

/**
 * Generate a self-contained iframe embed snippet.
 */
export function generateIframeEmbed(payload: ExportPayload): string {
  const { settings } = payload
  const url = buildEmbedUrl(payload)
  const height = parseHeight(settings.height)

  return [
    CREDITS_HTML_COMMENT,
    `<iframe`,
    `  src="${url}"`,
    `  width="100%"`,
    `  height="${height}"`,
    `  frameborder="0"`,
    `  allow="autoplay"`,
    `  style="border-radius:12px;display:block;"`,
    `></iframe>`,
  ].join('\n')
}
