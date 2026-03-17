import { describe, it, expect, beforeEach } from 'vitest'
import { applyHandModifier, resetHandModifier } from '../tracking/hand-modifier'
import type { TrackingSlice } from '../tracking/types'

/** Create a minimal TrackingSlice with overrides */
function makeTracking(overrides: Partial<TrackingSlice> = {}): TrackingSlice {
  return {
    trackingEnabled: true,
    trackingReady: true,
    trackingError: null,
    gesture: 'none',
    palmPosition: null,
    pinchDistance: 0,
    confidence: 0.9,
    landmarks: null,
    fistPhase: 'idle',
    fistProgress: 0,
    setTrackingEnabled: () => {},
    setTrackingReady: () => {},
    setTrackingError: () => {},
    updateHandState: () => {},
    ...overrides,
  }
}

/** Create a positions buffer with particles at known locations */
function makePositions(count: number): Float32Array {
  const buf = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    buf[i * 3] = i       // x = particle index
    buf[i * 3 + 1] = 0   // y = 0
    buf[i * 3 + 2] = 0   // z = 0
  }
  return buf
}

describe('applyHandModifier', () => {
  beforeEach(() => resetHandModifier())

  it('does nothing for gesture=none', () => {
    const pos = makePositions(10)
    const original = new Float32Array(pos)
    applyHandModifier(pos, 10, makeTracking({ gesture: 'none' }), 0.016)
    expect(pos).toEqual(original)
  })

  it('open_palm attracts particles toward palm position', () => {
    const pos = makePositions(5)
    applyHandModifier(pos, 5, makeTracking({
      gesture: 'open_palm',
      palmPosition: { x: 0.5, y: 0.5 },
    }), 0.016)
    // Particle at x=0 should move toward palm (mapped to ~0,0 in scene)
    // Particle at x=4 should move toward palm too
    // All particles should have shifted
    const moved = pos[0] !== 0 || pos[3] !== 1
    expect(moved).toBe(true)
  })

  it('pinch scales particle positions', () => {
    const pos = makePositions(3)
    // Pinch distance 0 = tight = small scale (0.3x)
    applyHandModifier(pos, 3, makeTracking({
      gesture: 'pinch',
      pinchDistance: 0,
    }), 0.016)
    // After several frames of smoothing toward 0.3x scale, positions should shrink
    // Run multiple frames for smoothing to converge
    for (let i = 0; i < 30; i++) {
      // Reset positions each frame to test scale
      for (let j = 0; j < 3; j++) { pos[j * 3] = j; pos[j * 3 + 1] = 0; pos[j * 3 + 2] = 0 }
      applyHandModifier(pos, 3, makeTracking({
        gesture: 'pinch',
        pinchDistance: 0,
      }), 0.016)
    }
    // Particle at x=2 should be scaled down significantly
    expect(Math.abs(pos[6]!)).toBeLessThan(2)
  })

  it('fist starts contracting phase', () => {
    const pos = makePositions(5)
    const tracking = makeTracking({ gesture: 'fist' })
    const updates: Partial<TrackingSlice>[] = []
    tracking.updateHandState = (s) => { updates.push(s) }

    applyHandModifier(pos, 5, tracking, 0.1)

    // Should have started contracting — particles move toward center
    expect(updates.some(u => u.fistPhase === 'contracting')).toBe(true)
  })
})
