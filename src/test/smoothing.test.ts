import { describe, it, expect } from 'vitest'
import { LandmarkSmoother } from '../tracking/smoothing'
import type { Landmark } from '../tracking/types'

function makeLandmarks(x: number, y: number, z: number): Landmark[] {
  return Array.from({ length: 21 }, () => ({ x, y, z }))
}

describe('LandmarkSmoother', () => {
  it('returns raw values on first frame', () => {
    const smoother = new LandmarkSmoother(0.3)
    const raw = makeLandmarks(0.5, 0.5, 0)
    const result = smoother.smooth(raw)
    expect(result[0]!.x).toBeCloseTo(0.5)
    expect(result[0]!.y).toBeCloseTo(0.5)
  })

  it('smooths toward new values over multiple frames', () => {
    const smoother = new LandmarkSmoother(0.3)
    smoother.smooth(makeLandmarks(0, 0, 0))
    // Jump to 1.0 — should not reach it immediately
    const result = smoother.smooth(makeLandmarks(1, 1, 0))
    expect(result[0]!.x).toBeCloseTo(0.3)  // EMA: 0 + 0.3*(1-0) = 0.3
    expect(result[0]!.y).toBeCloseTo(0.3)
  })

  it('converges after many frames', () => {
    const smoother = new LandmarkSmoother(0.3)
    smoother.smooth(makeLandmarks(0, 0, 0))
    for (let i = 0; i < 50; i++) {
      smoother.smooth(makeLandmarks(1, 1, 0))
    }
    const result = smoother.smooth(makeLandmarks(1, 1, 0))
    expect(result[0]!.x).toBeCloseTo(1.0, 1)
  })

  it('reset clears state', () => {
    const smoother = new LandmarkSmoother(0.3)
    smoother.smooth(makeLandmarks(0.8, 0.8, 0))
    smoother.reset()
    const result = smoother.smooth(makeLandmarks(0.2, 0.2, 0))
    expect(result[0]!.x).toBeCloseTo(0.2)  // Fresh start, no smoothing
  })
})
