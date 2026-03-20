import type { ShareState } from './types'

const R = (n: number) => Math.round(n * 1000) / 1000

function encodeVec3(v: [number, number, number]): string {
  return `${R(v[0])},${R(v[1])},${R(v[2])}`
}

function decodeVec3(s: string): [number, number, number] | undefined {
  const parts = s.split(',').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return undefined
  return parts as [number, number, number]
}

/**
 * Encode editor state into a URL hash string (without the leading #).
 */
export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams()

  params.set('effect', state.effect)
  if (state.p != null) params.set('p', String(state.p))
  if (state.ps != null) params.set('ps', String(R(state.ps)))
  if (state.ar != null) params.set('ar', String(R(state.ar)))
  if (state.z != null) params.set('z', String(R(state.z)))
  if (state.cam) params.set('cam', encodeVec3(state.cam))
  if (state.tgt) params.set('tgt', encodeVec3(state.tgt))
  if (state.bg) params.set('bg', state.bg)
  if (state.bgc) params.set('bgc', state.bgc)
  if (state.c && Object.keys(state.c).length > 0) {
    // Round control values to 3 decimals
    const rounded: Record<string, number> = {}
    for (const [k, v] of Object.entries(state.c)) rounded[k] = R(v)
    params.set('c', JSON.stringify(rounded))
  }
  if (state.txt) params.set('txt', state.txt)
  if (state.font) params.set('font', state.font)
  if (state.w) params.set('w', state.w)
  if (state.ls != null) params.set('ls', String(R(state.ls)))

  return params.toString()
}

/**
 * Parse a URL hash string into ShareState. Returns null if no valid effect found.
 */
export function parseShareHash(hash: string): ShareState | null {
  // Strip leading # if present
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const effect = params.get('effect')
  if (!effect) return null

  const state: ShareState = { effect }

  const p = parseInt(params.get('p') ?? '')
  if (!isNaN(p) && p > 0) state.p = p

  const ps = parseFloat(params.get('ps') ?? '')
  if (!isNaN(ps) && ps > 0) state.ps = ps

  const ar = parseFloat(params.get('ar') ?? '')
  if (!isNaN(ar)) state.ar = ar

  const z = parseFloat(params.get('z') ?? '')
  if (!isNaN(z) && z > 0) state.z = z

  const cam = params.get('cam')
  if (cam) {
    const v = decodeVec3(cam)
    if (v) state.cam = v
  }

  const tgt = params.get('tgt')
  if (tgt) {
    const v = decodeVec3(tgt)
    if (v) state.tgt = v
  }

  const bg = params.get('bg')
  if (bg) state.bg = bg

  const bgc = params.get('bgc')
  if (bgc) state.bgc = bgc

  const c = params.get('c')
  if (c) {
    try {
      const parsed = JSON.parse(c)
      if (typeof parsed === 'object' && parsed !== null) {
        state.c = parsed as Record<string, number>
      }
    } catch { /* ignore malformed controls */ }
  }

  const txt = params.get('txt')
  if (txt) state.txt = txt

  const font = params.get('font')
  if (font) state.font = font

  const w = params.get('w')
  if (w) state.w = w

  const ls = parseFloat(params.get('ls') ?? '')
  if (!isNaN(ls)) state.ls = ls

  return state
}
