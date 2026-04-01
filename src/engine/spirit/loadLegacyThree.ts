// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LegacyThree = any

declare global {
  interface Window {
    THREE?: LegacyThree
  }
}

let legacyThreePromise: Promise<LegacyThree> | null = null

export function loadLegacyThree(): Promise<LegacyThree> {
  if (window.THREE) return Promise.resolve(window.THREE)
  if (legacyThreePromise) return legacyThreePromise

  legacyThreePromise = new Promise<LegacyThree>((resolve, reject) => {
    const existing = document.getElementById('spirit-legacy-three') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load legacy Three.js')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'spirit-legacy-three'
    script.src = '/vendor/the-spirit/three.r74.min.js'
    script.async = true
    script.onload = () => {
      if (window.THREE) resolve(window.THREE)
      else reject(new Error('Legacy Three.js loaded without exposing window.THREE'))
    }
    script.onerror = () => reject(new Error('Failed to load legacy Three.js'))
    document.head.appendChild(script)
  })

  return legacyThreePromise
}
