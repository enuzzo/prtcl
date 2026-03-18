import { buildGoogleFontsUrl } from './fonts'

let linkInjected = false

/** Inject the Google Fonts <link> tag (once). */
export function ensureFontsInjected(): void {
  if (linkInjected) return
  linkInjected = true
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = buildGoogleFontsUrl()
  document.head.appendChild(link)
}

/**
 * Wait for a specific font to be available.
 * Uses document.fonts.load() which returns a promise for the specific font face.
 * Falls back immediately if the Font Loading API is not available.
 */
export async function waitForFont(family: string, weight: string): Promise<boolean> {
  ensureFontsInjected()
  if (!document.fonts?.load) return false
  try {
    const result = await document.fonts.load(`${weight} 120px "${family}"`)
    return result.length > 0
  } catch {
    return false
  }
}
