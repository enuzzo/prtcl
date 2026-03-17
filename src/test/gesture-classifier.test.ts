import { describe, it, expect } from 'vitest'
import { classifyGesture, createGestureClassifier, getHandSize } from '../tracking/gesture-classifier'
import type { Landmark } from '../tracking/types'
import { LANDMARK } from '../tracking/types'

/** Build 21 landmarks with all fingers extended (tips above PIPs) */
function openHand(): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  // For fingers 2-5: tip.y < pip.y means extended (y grows downward)
  lm[LANDMARK.INDEX_TIP] = { x: 0.5, y: 0.2, z: 0 }
  lm[LANDMARK.INDEX_PIP] = { x: 0.5, y: 0.4, z: 0 }
  lm[LANDMARK.MIDDLE_TIP] = { x: 0.55, y: 0.2, z: 0 }
  lm[LANDMARK.MIDDLE_PIP] = { x: 0.55, y: 0.4, z: 0 }
  lm[LANDMARK.RING_TIP] = { x: 0.6, y: 0.2, z: 0 }
  lm[LANDMARK.RING_PIP] = { x: 0.6, y: 0.4, z: 0 }
  lm[LANDMARK.PINKY_TIP] = { x: 0.65, y: 0.2, z: 0 }
  lm[LANDMARK.PINKY_PIP] = { x: 0.65, y: 0.4, z: 0 }
  // Thumb extended (tip.x > mcp.x for right hand)
  lm[LANDMARK.THUMB_TIP] = { x: 0.7, y: 0.35, z: 0 }
  lm[LANDMARK.THUMB_MCP] = { x: 0.5, y: 0.45, z: 0 }
  return lm
}

/** Build landmarks with all fingers curled (tips below PIPs) */
function closedFist(): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  lm[LANDMARK.INDEX_TIP] = { x: 0.5, y: 0.6, z: 0 }
  lm[LANDMARK.INDEX_PIP] = { x: 0.5, y: 0.4, z: 0 }
  lm[LANDMARK.MIDDLE_TIP] = { x: 0.55, y: 0.6, z: 0 }
  lm[LANDMARK.MIDDLE_PIP] = { x: 0.55, y: 0.4, z: 0 }
  lm[LANDMARK.RING_TIP] = { x: 0.6, y: 0.6, z: 0 }
  lm[LANDMARK.RING_PIP] = { x: 0.6, y: 0.4, z: 0 }
  lm[LANDMARK.PINKY_TIP] = { x: 0.65, y: 0.6, z: 0 }
  lm[LANDMARK.PINKY_PIP] = { x: 0.65, y: 0.4, z: 0 }
  lm[LANDMARK.THUMB_TIP] = { x: 0.45, y: 0.45, z: 0 }
  lm[LANDMARK.THUMB_MCP] = { x: 0.5, y: 0.45, z: 0 }
  return lm
}

describe('classifyGesture (stateless)', () => {
  it('classifies open hand as open_palm', () => {
    expect(classifyGesture(openHand(), 'Right')).toBe('open_palm')
  })

  it('classifies closed fist as none (only open_palm is detected)', () => {
    expect(classifyGesture(closedFist(), 'Right')).toBe('none')
  })
})

describe('createGestureClassifier (with debounce)', () => {
  it('debounces gesture changes for 150ms', () => {
    const classify = createGestureClassifier()
    // First classification is immediate
    expect(classify(openHand(), 'Right', 0)).toBe('open_palm')
    // Switch to none at t=50ms — should still return open_palm (debounce)
    expect(classify(closedFist(), 'Right', 50)).toBe('open_palm')
    // At t=100ms — still debouncing
    expect(classify(closedFist(), 'Right', 100)).toBe('open_palm')
    // At t=200ms — debounce passed (150ms of consistent none)
    expect(classify(closedFist(), 'Right', 200)).toBe('none')
  })

  it('resets debounce if gesture changes back before threshold', () => {
    const classify = createGestureClassifier()
    classify(openHand(), 'Right', 0)
    classify(closedFist(), 'Right', 50)  // start debounce for none
    classify(openHand(), 'Right', 80)    // back to palm — resets debounce
    classify(openHand(), 'Right', 250)
    expect(classify(openHand(), 'Right', 250)).toBe('open_palm')
  })
})

describe('getHandSize', () => {
  it('returns distance from wrist to middle finger tip', () => {
    const lm = openHand()
    lm[LANDMARK.WRIST] = { x: 0.5, y: 0.8, z: 0 }
    lm[LANDMARK.MIDDLE_TIP] = { x: 0.55, y: 0.2, z: 0 }
    const size = getHandSize(lm)
    // Euclidean distance: sqrt((0.05)^2 + (0.6)^2) ≈ 0.602
    expect(size).toBeCloseTo(0.602, 2)
  })
})
