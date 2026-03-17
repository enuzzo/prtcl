import { describe, it, expect } from 'vitest'
import { classifyGesture, createGestureClassifier } from '../tracking/gesture-classifier'
import type { Landmark } from '../tracking/types'
import { LANDMARK } from '../tracking/types'

/** Build 21 landmarks with all fingers extended (tips above PIPs) */
function openHand(): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  // For fingers 2-5: tip.y < pip.y means extended (y grows downward)
  // Index
  lm[LANDMARK.INDEX_TIP] = { x: 0.5, y: 0.2, z: 0 }
  lm[LANDMARK.INDEX_PIP] = { x: 0.5, y: 0.4, z: 0 }
  // Middle
  lm[LANDMARK.MIDDLE_TIP] = { x: 0.55, y: 0.2, z: 0 }
  lm[LANDMARK.MIDDLE_PIP] = { x: 0.55, y: 0.4, z: 0 }
  // Ring
  lm[LANDMARK.RING_TIP] = { x: 0.6, y: 0.2, z: 0 }
  lm[LANDMARK.RING_PIP] = { x: 0.6, y: 0.4, z: 0 }
  // Pinky
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
  // Fingers curled: tip.y > pip.y
  lm[LANDMARK.INDEX_TIP] = { x: 0.5, y: 0.6, z: 0 }
  lm[LANDMARK.INDEX_PIP] = { x: 0.5, y: 0.4, z: 0 }
  lm[LANDMARK.MIDDLE_TIP] = { x: 0.55, y: 0.6, z: 0 }
  lm[LANDMARK.MIDDLE_PIP] = { x: 0.55, y: 0.4, z: 0 }
  lm[LANDMARK.RING_TIP] = { x: 0.6, y: 0.6, z: 0 }
  lm[LANDMARK.RING_PIP] = { x: 0.6, y: 0.4, z: 0 }
  lm[LANDMARK.PINKY_TIP] = { x: 0.65, y: 0.6, z: 0 }
  lm[LANDMARK.PINKY_PIP] = { x: 0.65, y: 0.4, z: 0 }
  // Thumb curled
  lm[LANDMARK.THUMB_TIP] = { x: 0.45, y: 0.45, z: 0 }
  lm[LANDMARK.THUMB_MCP] = { x: 0.5, y: 0.45, z: 0 }
  return lm
}

/** Build landmarks for pinch (thumb and index tips very close) */
function pinchHand(): Landmark[] {
  const lm = openHand()
  // Move thumb tip and index tip very close together
  lm[LANDMARK.THUMB_TIP] = { x: 0.5, y: 0.3, z: 0 }
  lm[LANDMARK.INDEX_TIP] = { x: 0.51, y: 0.31, z: 0 }
  return lm
}

describe('classifyGesture (stateless, no debounce)', () => {
  it('classifies open hand as open_palm', () => {
    expect(classifyGesture(openHand(), 'Right')).toBe('open_palm')
  })

  it('classifies closed fist', () => {
    expect(classifyGesture(closedFist(), 'Right')).toBe('fist')
  })

  it('classifies pinch', () => {
    expect(classifyGesture(pinchHand(), 'Right')).toBe('pinch')
  })
})

describe('createGestureClassifier (with debounce)', () => {
  it('debounces gesture changes for 150ms', () => {
    const classify = createGestureClassifier()
    // First classification is immediate
    expect(classify(openHand(), 'Right', 0)).toBe('open_palm')
    // Switch to fist at t=50ms — should still return open_palm (debounce)
    expect(classify(closedFist(), 'Right', 50)).toBe('open_palm')
    // At t=100ms — still debouncing
    expect(classify(closedFist(), 'Right', 100)).toBe('open_palm')
    // At t=200ms — debounce passed (150ms of consistent fist)
    expect(classify(closedFist(), 'Right', 200)).toBe('fist')
  })

  it('resets debounce if gesture changes back before threshold', () => {
    const classify = createGestureClassifier()
    classify(openHand(), 'Right', 0)
    classify(closedFist(), 'Right', 50)  // start debounce for fist
    classify(openHand(), 'Right', 80)    // back to palm — resets debounce
    classify(openHand(), 'Right', 250)   // should stay palm
    expect(classify(openHand(), 'Right', 250)).toBe('open_palm')
  })
})
