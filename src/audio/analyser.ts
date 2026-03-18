export interface AudioBands {
  bassBand: number
  midsBand: number
  highsBand: number
  energy: number
}

/**
 * Compute normalized frequency bands from raw FFT data.
 *
 * With fftSize=1024 at 44100 Hz sample rate, each bin ≈ 43 Hz:
 *   Bass  (20-250 Hz)    → bins 0-5
 *   Mids  (250-2000 Hz)  → bins 6-46
 *   Highs (2000-20000 Hz) → bins 47-464
 *
 * Each band: sum byte values in range / (count * 255) → normalized 0-1.
 */
export function computeBands(data: Uint8Array, binCount: number): AudioBands {
  const bassEnd = Math.min(6, binCount)
  const midsEnd = Math.min(47, binCount)
  const highsEnd = Math.min(465, binCount)

  let bassSum = 0
  let midsSum = 0
  let highsSum = 0

  for (let i = 0; i < bassEnd; i++) bassSum += data[i] ?? 0
  for (let i = bassEnd; i < midsEnd; i++) midsSum += data[i] ?? 0
  for (let i = midsEnd; i < highsEnd; i++) highsSum += data[i] ?? 0

  const bassBand = bassEnd > 0 ? bassSum / (bassEnd * 255) : 0
  const midsBand = (midsEnd - bassEnd) > 0 ? midsSum / ((midsEnd - bassEnd) * 255) : 0
  const highsBand = (highsEnd - midsEnd) > 0 ? highsSum / ((highsEnd - midsEnd) * 255) : 0
  const energy = (bassBand + midsBand + highsBand) / 3

  return { bassBand, midsBand, highsBand, energy }
}

const HISTORY_SIZE = 30
const BEAT_THRESHOLD = 1.5
const BEAT_DECAY_MS = 100

/**
 * Simple onset detector: beat fires when current bass energy
 * exceeds 1.5× the rolling average. Beat value decays from
 * 1.0 to 0.0 over ~100ms for smooth effect transitions.
 */
export class BeatDetector {
  private history: number[] = []
  private lastBeatTime = 0

  detect(bassBand: number, now: number): number {
    this.history.push(bassBand)
    if (this.history.length > HISTORY_SIZE) this.history.shift()

    // Need at least a few frames for a meaningful average
    if (this.history.length < 5) return 0

    const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length

    if (bassBand > avg * BEAT_THRESHOLD && avg > 0.01) {
      this.lastBeatTime = now
      return 1
    }

    // Decay
    const elapsed = now - this.lastBeatTime
    if (elapsed < BEAT_DECAY_MS) {
      return 1 - elapsed / BEAT_DECAY_MS
    }

    return 0
  }

  reset(): void {
    this.history = []
    this.lastBeatTime = 0
  }
}
