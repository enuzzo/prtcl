import type { Landmark, HandGesture } from './types'
import { LANDMARK } from './types'

const DEBOUNCE_MS = 150

/** Check if a finger is extended: tip.y < pip.y (MediaPipe y grows downward) */
function isFingerExtended(landmarks: Landmark[], tip: number, pip: number): boolean {
  return landmarks[tip]!.y < landmarks[pip]!.y
}


/**
 * Stateless gesture classification from 21 landmarks.
 * Detects open_palm when at least 3 of 4 fingers are extended (thumb excluded —
 * its x-axis check is unreliable across camera angles and handedness).
 */
export function classifyGesture(landmarks: Landmark[], _handedness: string): HandGesture {
  const indexUp = isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP)
  const middleUp = isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP)
  const ringUp = isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_PIP)
  const pinkyUp = isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP)

  const extended = (indexUp ? 1 : 0) + (middleUp ? 1 : 0) + (ringUp ? 1 : 0) + (pinkyUp ? 1 : 0)

  if (extended >= 3) {
    return 'open_palm'
  }

  return 'none'
}

/**
 * Compute palm center from wrist + MCP landmarks.
 */
export function getPalmCenter(landmarks: Landmark[]): { x: number; y: number } {
  const wrist = landmarks[LANDMARK.WRIST]!
  const indexMcp = landmarks[LANDMARK.INDEX_MCP]!
  const middleMcp = landmarks[LANDMARK.MIDDLE_MCP]!
  const ringMcp = landmarks[LANDMARK.RING_MCP]!
  const pinkyMcp = landmarks[LANDMARK.PINKY_MCP]!
  return {
    x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
    y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
  }
}

/**
 * Compute hand size as wrist-to-middle-finger-tip distance.
 * Proxy for hand distance from camera: larger = closer, smaller = farther.
 */
export function getHandSize(landmarks: Landmark[]): number {
  const wrist = landmarks[LANDMARK.WRIST]!
  const middleTip = landmarks[LANDMARK.MIDDLE_TIP]!
  const dx = wrist.x - middleTip.x
  const dy = wrist.y - middleTip.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Create a debounced gesture classifier.
 * A gesture must remain stable for DEBOUNCE_MS before it's reported.
 */
export function createGestureClassifier(): (
  landmarks: Landmark[],
  handedness: string,
  timestampMs: number,
) => HandGesture {
  let confirmedGesture: HandGesture = 'none'
  let candidateGesture: HandGesture = 'none'
  let candidateStartMs = 0
  let isFirst = true

  return (landmarks, handedness, timestampMs) => {
    const raw = classifyGesture(landmarks, handedness)

    // First call — immediately confirm (no debounce on startup)
    if (isFirst) {
      isFirst = false
      confirmedGesture = raw
      candidateGesture = raw
      return confirmedGesture
    }

    if (raw === confirmedGesture) {
      candidateGesture = raw
      return confirmedGesture
    }

    if (raw !== candidateGesture) {
      candidateGesture = raw
      candidateStartMs = timestampMs
      return confirmedGesture
    }

    if (timestampMs - candidateStartMs >= DEBOUNCE_MS) {
      confirmedGesture = raw
      return confirmedGesture
    }

    return confirmedGesture
  }
}
