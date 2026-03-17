/** MediaPipe hand landmark indices */
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const

export interface Landmark {
  x: number  // 0-1 normalized
  y: number  // 0-1 normalized
  z: number  // depth (smaller = closer)
}

export type HandGesture = 'none' | 'open_palm'

export interface TrackingSlice {
  // State
  trackingEnabled: boolean
  trackingReady: boolean
  trackingError: string | null

  // Hand data
  gesture: HandGesture
  palmPosition: { x: number; y: number } | null
  handSize: number
  confidence: number
  landmarks: Landmark[] | null

  // Actions
  setTrackingEnabled: (on: boolean) => void
  setTrackingReady: (ready: boolean) => void
  setTrackingError: (error: string | null) => void
  updateHandState: (state: Partial<Omit<TrackingSlice,
    'setTrackingEnabled' | 'setTrackingReady' | 'setTrackingError' | 'updateHandState'
  >>) => void
}
