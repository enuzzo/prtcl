import { describe, expect, it } from 'vitest'
import { FIST_COLLAPSE_SCALE, getHandShapeTargetScale } from '../tracking/hand-shape-collapse'

describe('getHandShapeTargetScale', () => {
  it('collapses the effect while tracking sees a fist', () => {
    expect(getHandShapeTargetScale('fist')).toBe(FIST_COLLAPSE_SCALE)
  })

  it('returns the effect to default scale for open palm or no hand', () => {
    expect(getHandShapeTargetScale('open_palm')).toBe(1)
    expect(getHandShapeTargetScale('none')).toBe(1)
  })
})
