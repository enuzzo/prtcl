import type { Hands, Results } from '@mediapipe/hands'

let _hands: Hands | null = null
/** Monotonic generation counter — incremented on close to invalidate stale loads */
let _gen = 0
/** Shared promise so concurrent callers piggyback on the same load */
let _pending: Promise<Hands> | null = null

export interface MediaPipeResult {
  landmarks: Array<{ x: number; y: number; z: number }>
  handedness: string
  confidence: number
}

/**
 * Lazily initialize MediaPipe Hands. Downloads WASM (~4MB) on first call.
 * Subsequent calls return the cached instance. Concurrent calls share the
 * same in-flight promise. If closeMediaPipe() is called mid-load, the
 * stale load is discarded via generation check.
 */
export async function loadMediaPipe(
  onResults: (results: MediaPipeResult | null) => void,
): Promise<Hands> {
  if (_hands) return _hands
  if (_pending) return _pending

  const gen = ++_gen

  _pending = (async () => {
    const { Hands } = await import('@mediapipe/hands')

    // Bail if closed while we were loading the module
    if (gen !== _gen) throw new Error('MediaPipe load superseded')

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

    // Bail if closed while WASM was initializing
    if (gen !== _gen) {
      hands.close()
      throw new Error('MediaPipe load superseded')
    }

    _hands = hands
    _pending = null
    return hands
  })()

  // If the load fails, clear the pending promise so the next call retries
  _pending.catch(() => {
    if (gen === _gen) _pending = null
  })

  return _pending
}

/**
 * Close and release MediaPipe resources.
 * Bumps generation to invalidate any in-flight load.
 */
export function closeMediaPipe(): void {
  _gen++
  _pending = null
  if (_hands) {
    _hands.close()
    _hands = null
  }
}
