import type { Landmark } from './types'

/**
 * Exponential Moving Average smoother for 21 MediaPipe hand landmarks.
 * Reduces jitter from frame-to-frame detection noise.
 */
export class LandmarkSmoother {
  private alpha: number
  private prev: Landmark[] | null = null

  constructor(alpha: number) {
    this.alpha = alpha
  }

  smooth(raw: Landmark[]): Landmark[] {
    if (!this.prev) {
      this.prev = raw.map((l) => ({ ...l }))
      return this.prev
    }

    const result: Landmark[] = []
    for (let i = 0; i < raw.length; i++) {
      const p = this.prev[i]!
      const r = raw[i]!
      result.push({
        x: p.x + this.alpha * (r.x - p.x),
        y: p.y + this.alpha * (r.y - p.y),
        z: p.z + this.alpha * (r.z - p.z),
      })
    }
    this.prev = result
    return result
  }

  reset(): void {
    this.prev = null
  }
}
