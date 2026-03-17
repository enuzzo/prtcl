import type { Hands, Results } from '@mediapipe/hands'

let _hands: Hands | null = null
let _loading = false

export interface MediaPipeResult {
  landmarks: Array<{ x: number; y: number; z: number }>
  handedness: string
  confidence: number
}

/**
 * Lazily initialize MediaPipe Hands. Downloads WASM (~4MB) on first call.
 * Subsequent calls return the cached instance.
 */
export async function loadMediaPipe(
  onResults: (results: MediaPipeResult | null) => void,
): Promise<Hands> {
  if (_hands) return _hands
  if (_loading) throw new Error('MediaPipe is already loading')

  _loading = true

  try {
    const { Hands } = await import('@mediapipe/hands')

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    })

    hands.onResults((results: Results) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        onResults(null)
        return
      }

      const landmarks = results.multiHandLandmarks[0]!.map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z,
      }))

      const handedness = results.multiHandedness?.[0]?.label ?? 'Right'
      const confidence = results.multiHandedness?.[0]?.score ?? 0

      onResults({ landmarks, handedness, confidence })
    })

    await hands.initialize()

    _hands = hands
    _loading = false
    return hands
  } catch (e) {
    _loading = false
    throw e
  }
}

/**
 * Close and release MediaPipe resources.
 */
export function closeMediaPipe(): void {
  if (_hands) {
    _hands.close()
    _hands = null
  }
}
