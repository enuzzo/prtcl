import type { Landmark, HandGesture } from './types'
import { LANDMARK } from './types'

const PINCH_THRESHOLD = 0.05
const DEBOUNCE_MS = 150

/** Distance between two landmarks in 2D (x,y) */
function dist2d(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Check if a finger is extended: tip.y < pip.y (MediaPipe y grows downward) */
function isFingerExtended(landmarks: Landmark[], tip: number, pip: number): boolean {
  return landmarks[tip]!.y < landmarks[pip]!.y
}

/** Check if thumb is extended based on handedness */
function isThumbExtended(landmarks: Landmark[], handedness: string): boolean {
  const tip = landmarks[LANDMARK.THUMB_TIP]!
  const mcp = landmarks[LANDMARK.THUMB_MCP]!
  // Right hand: extended when tip.x > mcp.x; Left hand: tip.x < mcp.x
  return handedness === 'Right' ? tip.x > mcp.x : tip.x < mcp.x
}

/**
 * Stateless gesture classification from 21 landmarks.
 * Exported for testing. The debounced version is createGestureClassifier().
 */
export function classifyGesture(landmarks: Landmark[], handedness: string): HandGesture {
  const thumbUp = isThumbExtended(landmarks, handedness)
  const indexUp = isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP)
  const middleUp = isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP)
  const ringUp = isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_PIP)
  const pinkyUp = isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP)

  // Pinch: thumb and index tips very close together
  const pinchDist = dist2d(landmarks[LANDMARK.THUMB_TIP]!, landmarks[LANDMARK.INDEX_TIP]!)
  if (pinchDist < PINCH_THRESHOLD) {
    return 'pinch'
  }

  // Fist: all four fingers curled, thumb curled
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) {
    return 'fist'
  }

  // Open palm: all five fingers extended
  if (thumbUp && indexUp && middleUp && ringUp && pinkyUp) {
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
 * Compute normalized pinch distance (thumb-index tip distance).
 */
export function getPinchDistance(landmarks: Landmark[]): number {
  return dist2d(landmarks[LANDMARK.THUMB_TIP]!, landmarks[LANDMARK.INDEX_TIP]!)
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
      // Already confirmed — reset candidate
      candidateGesture = raw
      return confirmedGesture
    }

    if (raw !== candidateGesture) {
      // New candidate — start debounce timer
      candidateGesture = raw
      candidateStartMs = timestampMs
      return confirmedGesture
    }

    // Same candidate — check if debounce period passed
    if (timestampMs - candidateStartMs >= DEBOUNCE_MS) {
      confirmedGesture = raw
      return confirmedGesture
    }

    return confirmedGesture
  }
}
