# Hand Tracking Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MediaPipe Hands-based gesture recognition that manipulates particles via three gestures: magnet (open palm), scale (pinch), and contract/explode (fist).

**Architecture:** Four decoupled layers — MediaPipe WASM → React hook → Zustand store → ParticleSystem modifier. All tracking code lives in `src/tracking/` and is lazy-loaded only when the user toggles tracking ON. The hand modifier mutates the position buffer in-place after the effect loop, so all existing effects work automatically.

**Tech Stack:** MediaPipe Hands (WASM, `@mediapipe/hands`), React 19, Zustand 5, TypeScript strict, Tailwind CSS 4, Canvas 2D (thumbnail), Vitest (tests).

**Spec:** `docs/superpowers/specs/2026-03-17-hand-tracking-design.md`

---

## Chunk 1: Core Tracking Engine + Store

### Task 1: Install MediaPipe dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @mediapipe/hands**

```bash
npm install @mediapipe/hands
```

- [ ] **Step 2: Verify install**

```bash
npx tsc -b
```

Expected: no type errors (MediaPipe ships its own types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @mediapipe/hands dependency"
```

---

### Task 2: Tracking types

**Files:**
- Create: `src/tracking/types.ts`

- [ ] **Step 1: Write tracking types**

Create `src/tracking/types.ts`:

```typescript
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

export type HandGesture = 'none' | 'open_palm' | 'pinch' | 'fist'

export type FistPhase = 'idle' | 'contracting' | 'exploding' | 'reassembling'

export interface TrackingSlice {
  // State
  trackingEnabled: boolean
  trackingReady: boolean
  trackingError: string | null

  // Hand data
  gesture: HandGesture
  palmPosition: { x: number; y: number } | null
  pinchDistance: number
  confidence: number
  landmarks: Landmark[] | null

  // Fist state machine
  fistPhase: FistPhase
  fistProgress: number

  // Actions
  setTrackingEnabled: (on: boolean) => void
  setTrackingReady: (ready: boolean) => void
  setTrackingError: (error: string | null) => void
  updateHandState: (state: Partial<Omit<TrackingSlice,
    'setTrackingEnabled' | 'setTrackingReady' | 'setTrackingError' | 'updateHandState'
  >>) => void
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/tracking/types.ts
git commit -m "feat(tracking): add types — HandGesture, Landmark, TrackingSlice"
```

---

### Task 3: Add tracking slice to Zustand store

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Import TrackingSlice and add to PrtclState**

Add import at top of `src/store.ts`:

```typescript
import type { TrackingSlice } from './tracking/types'
```

Change the interface declaration line from `export interface PrtclState {` to `export interface PrtclState extends TrackingSlice {` — all existing fields and actions inside the interface body remain unchanged:

```typescript
export interface PrtclState extends TrackingSlice {
  // ... all existing fields stay exactly as-is
}
```

- [ ] **Step 2: Add tracking default values and actions to the store creator**

After the performance actions section in `create<PrtclState>((set) => ({`, add:

```typescript
  // ── Tracking ──────────────────────────────────────────
  trackingEnabled: false,
  trackingReady: false,
  trackingError: null,
  gesture: 'none',
  palmPosition: null,
  pinchDistance: 0,
  confidence: 0,
  landmarks: null,
  fistPhase: 'idle',
  fistProgress: 0,

  setTrackingEnabled: (on) => set({ trackingEnabled: on }),
  setTrackingReady: (ready) => set({ trackingReady: ready }),
  setTrackingError: (error) => set({ trackingError: error }),
  updateHandState: (state) => set(state),
```

- [ ] **Step 3: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/store.ts
git commit -m "feat(tracking): add tracking slice to Zustand store"
```

---

### Task 4: EMA smoothing utility

**Files:**
- Create: `src/tracking/smoothing.ts`
- Create: `src/test/smoothing.test.ts`

- [ ] **Step 1: Write the test**

Create `src/test/smoothing.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/smoothing.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement LandmarkSmoother**

Create `src/tracking/smoothing.ts`:

```typescript
import type { Landmark } from './types'

/**
 * Exponential Moving Average smoother for 21 MediaPipe hand landmarks.
 * Reduces jitter from frame-to-frame detection noise.
 */
export class LandmarkSmoother {
  private alpha: number
  private prev: Landmark[] | null = null

  constructor(alpha: number) {
    this.alpha = alpha
  }

  smooth(raw: Landmark[]): Landmark[] {
    if (!this.prev) {
      this.prev = raw.map((l) => ({ ...l }))
      return this.prev
    }

    const result: Landmark[] = []
    for (let i = 0; i < raw.length; i++) {
      const p = this.prev[i]!
      const r = raw[i]!
      result.push({
        x: p.x + this.alpha * (r.x - p.x),
        y: p.y + this.alpha * (r.y - p.y),
        z: p.z + this.alpha * (r.z - p.z),
      })
    }
    this.prev = result
    return result
  }

  reset(): void {
    this.prev = null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/smoothing.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/tracking/smoothing.ts src/test/smoothing.test.ts
git commit -m "feat(tracking): EMA landmark smoother with tests"
```

---

### Task 5: Gesture classifier

**Files:**
- Create: `src/tracking/gesture-classifier.ts`
- Create: `src/test/gesture-classifier.test.ts`

- [ ] **Step 1: Write the tests**

Create `src/test/gesture-classifier.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/gesture-classifier.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement gesture classifier**

Create `src/tracking/gesture-classifier.ts`:

```typescript
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

  return (landmarks, handedness, timestampMs) => {
    const raw = classifyGesture(landmarks, handedness)

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/gesture-classifier.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/tracking/gesture-classifier.ts src/test/gesture-classifier.test.ts
git commit -m "feat(tracking): gesture classifier with debounce and tests"
```

---

### Task 6: Hand modifier (particle position mutations)

**Files:**
- Create: `src/tracking/hand-modifier.ts`
- Create: `src/test/hand-modifier.test.ts`

- [ ] **Step 1: Write the tests**

Create `src/test/hand-modifier.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/hand-modifier.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement hand modifier**

Create `src/tracking/hand-modifier.ts`:

```typescript
import type { TrackingSlice, FistPhase } from './types'

// ── Constants ──────────────────────────────────────────
const MAGNET_RANGE = 3.0
const MAGNET_STRENGTH = 0.8
const MAGNET_MIN_DIST = 0.1
const MAGNET_SMOOTH_ALPHA = 0.15

const PINCH_SCALE_MIN = 0.3
const PINCH_SCALE_MAX = 3.0
const PINCH_DIST_MAX = 0.15  // distance at which scale = 1.0
const PINCH_SMOOTH_ALPHA = 0.2

const FIST_CONTRACT_DURATION = 0.6    // seconds
const FIST_EXPLODE_DURATION = 0.4
const FIST_REASSEMBLE_DURATION = 1.2

// ── Easing ─────────────────────────────────────────────
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuad(t: number): number { return 1 - (1 - t) * (1 - t) }
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function clamp01(t: number): number { return Math.max(0, Math.min(1, t)) }

// ── Module-level state (like adaptive-quality.ts) ──────
let _smoothMagnetX = 0
let _smoothMagnetY = 0
let _smoothScale = 1.0
let _fistPhase: FistPhase = 'idle'
let _fistProgress = 0
// Snapshot of base positions when fist starts contracting
let _basePositions: Float32Array | null = null
// Explode velocities
let _explodeVelocities: Float32Array | null = null

export function resetHandModifier(): void {
  _smoothMagnetX = 0
  _smoothMagnetY = 0
  _smoothScale = 1.0
  _fistPhase = 'idle'
  _fistProgress = 0
  _basePositions = null
  _explodeVelocities = null
}

export function applyHandModifier(
  positions: Float32Array,
  count: number,
  tracking: TrackingSlice,
  delta: number,
): void {
  const { gesture } = tracking

  // Select gesture code path ONCE, then run tight inner loop
  switch (gesture) {
    case 'open_palm':
      _applyMagnet(positions, count, tracking)
      // Reset fist if it was active
      if (_fistPhase !== 'idle') _resetFist(tracking)
      break
    case 'pinch':
      _applyPinch(positions, count, tracking)
      if (_fistPhase !== 'idle') _resetFist(tracking)
      break
    case 'fist':
      _applyFist(positions, count, tracking, delta)
      break
    case 'none':
      // If fist animation is running, continue it even when gesture changes
      if (_fistPhase !== 'idle') {
        _applyFist(positions, count, tracking, delta)
      }
      break
  }
}

function _applyMagnet(positions: Float32Array, count: number, tracking: TrackingSlice): void {
  const palm = tracking.palmPosition
  if (!palm) return

  // Map palm (0-1) to scene space (centered, range +-MAGNET_RANGE)
  const targetX = (palm.x - 0.5) * 2 * MAGNET_RANGE
  const targetY = -(palm.y - 0.5) * 2 * MAGNET_RANGE  // flip Y (screen vs scene)

  // Smooth magnet position
  _smoothMagnetX += MAGNET_SMOOTH_ALPHA * (targetX - _smoothMagnetX)
  _smoothMagnetY += MAGNET_SMOOTH_ALPHA * (targetY - _smoothMagnetY)

  for (let i = 0; i < count; i++) {
    const idx = i * 3
    const dx = _smoothMagnetX - positions[idx]!
    const dy = _smoothMagnetY - positions[idx + 1]!
    const dist = Math.sqrt(dx * dx + dy * dy) + MAGNET_MIN_DIST
    const force = MAGNET_STRENGTH / (dist * dist)
    const clampedForce = Math.min(force, 0.5)  // prevent teleporting

    positions[idx] += dx * clampedForce
    positions[idx + 1] += dy * clampedForce
    // Z unchanged — magnet operates in XY plane
  }
}

function _applyPinch(positions: Float32Array, count: number, tracking: TrackingSlice): void {
  // Map pinch distance to scale factor
  const normalizedDist = clamp01(tracking.pinchDistance / PINCH_DIST_MAX)
  const targetScale = PINCH_SCALE_MIN + normalizedDist * (PINCH_SCALE_MAX - PINCH_SCALE_MIN)

  // Smooth scale
  _smoothScale += PINCH_SMOOTH_ALPHA * (targetScale - _smoothScale)

  for (let i = 0; i < count; i++) {
    const idx = i * 3
    positions[idx] *= _smoothScale
    positions[idx + 1] *= _smoothScale
    positions[idx + 2] *= _smoothScale
  }
}

function _applyFist(
  positions: Float32Array,
  count: number,
  tracking: TrackingSlice,
  delta: number,
): void {
  const prevPhase = _fistPhase

  // ── State machine transitions ──
  if (_fistPhase === 'idle' && tracking.gesture === 'fist') {
    _fistPhase = 'contracting'
    _fistProgress = 0
    // Snapshot base positions for reassembly
    _basePositions = new Float32Array(positions)
    _explodeVelocities = null
  } else if (_fistPhase === 'contracting' && tracking.gesture !== 'fist') {
    // User opened fist — explode from current state
    _fistPhase = 'exploding'
    _fistProgress = 0
    // Compute explode velocities from current positions
    _explodeVelocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const x = positions[idx]!
      const y = positions[idx + 1]!
      const z = positions[idx + 2]!
      const dist = Math.sqrt(x * x + y * y + z * z) + 0.01
      const speed = 3.0 + Math.random() * 4.0
      _explodeVelocities[idx] = (x / dist) * speed
      _explodeVelocities[idx + 1] = (y / dist) * speed
      _explodeVelocities[idx + 2] = (z / dist) * speed
    }
  } else if (_fistPhase === 'contracting' && _fistProgress >= 1.0) {
    // Max compression reached — auto-explode
    _fistPhase = 'exploding'
    _fistProgress = 0
    _explodeVelocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const speed = 3.0 + Math.random() * 4.0
      // From compressed center — random radial direction
      const angle1 = Math.random() * Math.PI * 2
      const angle2 = Math.random() * Math.PI - Math.PI / 2
      _explodeVelocities[idx] = Math.cos(angle1) * Math.cos(angle2) * speed
      _explodeVelocities[idx + 1] = Math.sin(angle2) * speed
      _explodeVelocities[idx + 2] = Math.sin(angle1) * Math.cos(angle2) * speed
    }
  } else if (_fistPhase === 'exploding' && _fistProgress >= 1.0) {
    _fistPhase = 'reassembling'
    _fistProgress = 0
  } else if (_fistPhase === 'reassembling' && _fistProgress >= 1.0) {
    _fistPhase = 'idle'
    _fistProgress = 0
    _basePositions = null
    _explodeVelocities = null
  }

  // ── Advance progress ──
  const durations: Record<FistPhase, number> = {
    idle: 1,
    contracting: FIST_CONTRACT_DURATION,
    exploding: FIST_EXPLODE_DURATION,
    reassembling: FIST_REASSEMBLE_DURATION,
  }
  _fistProgress = clamp01(_fistProgress + delta / durations[_fistPhase])

  // ── Apply phase effect ──
  if (_fistPhase === 'contracting') {
    const t = easeInCubic(_fistProgress)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      // Interpolate toward center (0,0,0)
      positions[idx] *= (1 - t)
      positions[idx + 1] *= (1 - t)
      positions[idx + 2] *= (1 - t)
    }
  } else if (_fistPhase === 'exploding' && _explodeVelocities) {
    const t = easeOutQuad(_fistProgress)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      positions[idx] += _explodeVelocities[idx]! * t
      positions[idx + 1] += _explodeVelocities[idx + 1]! * t
      positions[idx + 2] += _explodeVelocities[idx + 2]! * t
    }
  } else if (_fistPhase === 'reassembling' && _basePositions) {
    const t = easeInOutCubic(_fistProgress)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      // Interpolate from current explosion endpoint back to base
      positions[idx] += (_basePositions[idx]! - positions[idx]) * t
      positions[idx + 1] += (_basePositions[idx + 1]! - positions[idx + 1]) * t
      positions[idx + 2] += (_basePositions[idx + 2]! - positions[idx + 2]) * t
    }
  }

  // ── Write state back to store for UI ──
  if (_fistPhase !== prevPhase || _fistPhase !== 'idle') {
    tracking.updateHandState({ fistPhase: _fistPhase, fistProgress: _fistProgress })
  }
}

function _resetFist(tracking: TrackingSlice): void {
  _fistPhase = 'idle'
  _fistProgress = 0
  _basePositions = null
  _explodeVelocities = null
  tracking.updateHandState({ fistPhase: 'idle', fistProgress: 0 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/hand-modifier.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tracking/hand-modifier.ts src/test/hand-modifier.test.ts
git commit -m "feat(tracking): hand modifier — magnet, pinch, fist state machine with tests"
```

---

### Task 7: MediaPipe loader

**Files:**
- Create: `src/tracking/mediapipe-loader.ts`

- [ ] **Step 1: Implement lazy loader**

Create `src/tracking/mediapipe-loader.ts`:

```typescript
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS. (No unit test for this — it requires real WASM/webcam. Integration tested manually.)

- [ ] **Step 3: Commit**

```bash
git add src/tracking/mediapipe-loader.ts
git commit -m "feat(tracking): lazy MediaPipe Hands loader with CDN WASM"
```

---

### Task 8: useHandTracking React hook

**Files:**
- Create: `src/tracking/useHandTracking.ts`

- [ ] **Step 1: Implement the hook**

Create `src/tracking/useHandTracking.ts`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store'
import { loadMediaPipe, closeMediaPipe } from './mediapipe-loader'
import type { MediaPipeResult } from './mediapipe-loader'
import { LandmarkSmoother } from './smoothing'
import { createGestureClassifier, getPalmCenter, getPinchDistance } from './gesture-classifier'
import { resetHandModifier } from './hand-modifier'

/**
 * React hook that manages the full webcam → MediaPipe → store pipeline.
 * Only active when trackingEnabled is true.
 */
export function useHandTracking(): {
  videoEl: HTMLVideoElement | null
} {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef(0)
  const activeRef = useRef(false)

  const enabled = useStore((s) => s.trackingEnabled)

  const processResult = useCallback(() => {
    // These are created fresh per enable cycle
    let smoother: LandmarkSmoother | null = null
    let classify: ReturnType<typeof createGestureClassifier> | null = null

    return (result: MediaPipeResult | null) => {
      if (!smoother) smoother = new LandmarkSmoother(0.3)
      if (!classify) classify = createGestureClassifier()

      if (!result) {
        useStore.getState().updateHandState({
          gesture: 'none',
          palmPosition: null,
          landmarks: null,
          confidence: 0,
        })
        return
      }

      const smoothed = smoother.smooth(result.landmarks)
      const gesture = classify(smoothed, result.handedness, performance.now())
      const palmPosition = getPalmCenter(smoothed)
      const pinchDistance = getPinchDistance(smoothed)

      useStore.getState().updateHandState({
        gesture,
        palmPosition,
        pinchDistance,
        confidence: result.confidence,
        landmarks: smoothed,
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let dead = false
    const handler = processResult()

    const start = async () => {
      try {
        // Request webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        })

        if (dead) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        // Setup video element
        const video = document.createElement('video')
        video.srcObject = stream
        video.setAttribute('playsinline', '')
        video.muted = true
        await video.play()
        videoRef.current = video
        setVideoEl(video)  // Trigger re-render so TrackingThumbnail receives the element

        // Load MediaPipe
        const hands = await loadMediaPipe(handler)

        if (dead) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        useStore.getState().setTrackingReady(true)
        useStore.getState().setTrackingError(null)
        activeRef.current = true

        // Feed frames to MediaPipe.
        // Natural ~30fps throttle: await hands.send() takes ~8ms inference,
        // then rAF fires ~16ms later. Net result: one inference every ~24ms (~30fps).
        // No explicit frame-skipping needed.
        const sendFrame = async () => {
          if (dead || !activeRef.current) return
          if (!document.hidden) {
            try {
              await hands.send({ image: video })
            } catch {
              // MediaPipe occasionally drops frames — non-fatal
            }
          }
          rafRef.current = requestAnimationFrame(sendFrame)
        }
        sendFrame()
      } catch (e) {
        if (!dead) {
          const msg = e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Camera permission required for hand tracking'
            : `Hand tracking unavailable: ${(e as Error).message}`
          useStore.getState().setTrackingError(msg)
          useStore.getState().setTrackingEnabled(false)
        }
      }
    }

    start()

    return () => {
      dead = true
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)

      // Stop webcam stream
      const video = videoRef.current
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach((t) => t.stop())
        video.srcObject = null
      }
      videoRef.current = null
      setVideoEl(null)

      closeMediaPipe()
      resetHandModifier()

      useStore.getState().setTrackingReady(false)
      useStore.getState().updateHandState({
        gesture: 'none',
        palmPosition: null,
        landmarks: null,
        confidence: 0,
        fistPhase: 'idle',
        fistProgress: 0,
      })
    }
  }, [enabled, processResult])

  return { videoEl }
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/tracking/useHandTracking.ts
git commit -m "feat(tracking): useHandTracking hook — webcam, MediaPipe, classification pipeline"
```

---

### Task 9: Run all tests

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (existing + new smoothing + gesture-classifier + hand-modifier tests).

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

---

## Chunk 2: UI Components + ParticleSystem Integration

### Task 10: TopBar — tracking toggle button

**Files:**
- Modify: `src/editor/TopBar.tsx`

- [ ] **Step 1: Add tracking toggle to TopBar**

In `src/editor/TopBar.tsx`, add the store import (`useCallback` is already imported from React):

```typescript
import { useStore } from '../store'
```

Inside the `TopBar` component, add:

```typescript
const trackingEnabled = useStore((s) => s.trackingEnabled)
const trackingReady = useStore((s) => s.trackingReady)
const trackingError = useStore((s) => s.trackingError)

const toggleTracking = useCallback(() => {
  if (trackingError) {
    // Clear error and retry
    useStore.getState().setTrackingError(null)
  }
  useStore.getState().setTrackingEnabled(!trackingEnabled)
}, [trackingEnabled, trackingError])
```

Add the button before the fullscreen button in the JSX:

```tsx
{/* Hand Tracking toggle — hidden on mobile */}
<button
  onClick={toggleTracking}
  className={`px-3 py-1.5 rounded text-sm font-mono transition-colors hidden md:block ${
    trackingError
      ? 'bg-danger/10 text-danger border border-danger/30'
      : trackingEnabled
        ? 'bg-accent2/15 text-accent2 border border-accent2/40'
        : 'bg-elevated text-text-muted border border-transparent hover:bg-border/50'
  } ${trackingEnabled && !trackingReady ? 'animate-pulse' : ''}`}
  title={
    trackingError
      ?? (trackingEnabled && !trackingReady
        ? 'Loading hand tracking...'
        : trackingEnabled
          ? 'Hand tracking ON'
          : 'Enable hand tracking')
  }
>
  ✋
</button>
```

- [ ] **Step 2: Type check and verify visually**

```bash
npx tsc -b
```

Expected: PASS. Run `npm run dev` and verify the ✋ button appears in the top bar.

- [ ] **Step 3: Commit**

```bash
git add src/editor/TopBar.tsx
git commit -m "feat(tracking): add hand tracking toggle to TopBar"
```

---

### Task 11: TrackingThumbnail component

**Files:**
- Create: `src/editor/TrackingThumbnail.tsx`

- [ ] **Step 1: Implement TrackingThumbnail**

Create `src/editor/TrackingThumbnail.tsx`:

```typescript
import { useRef, useEffect } from 'react'
import { useStore } from '../store'
import { LANDMARK } from '../tracking/types'

/** Connections between landmarks for skeleton drawing */
const CONNECTIONS: [number, number][] = [
  // Thumb
  [LANDMARK.WRIST, LANDMARK.THUMB_CMC], [LANDMARK.THUMB_CMC, LANDMARK.THUMB_MCP],
  [LANDMARK.THUMB_MCP, LANDMARK.THUMB_IP], [LANDMARK.THUMB_IP, LANDMARK.THUMB_TIP],
  // Index
  [LANDMARK.WRIST, LANDMARK.INDEX_MCP], [LANDMARK.INDEX_MCP, LANDMARK.INDEX_PIP],
  [LANDMARK.INDEX_PIP, LANDMARK.INDEX_DIP], [LANDMARK.INDEX_DIP, LANDMARK.INDEX_TIP],
  // Middle
  [LANDMARK.WRIST, LANDMARK.MIDDLE_MCP], [LANDMARK.MIDDLE_MCP, LANDMARK.MIDDLE_PIP],
  [LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_DIP], [LANDMARK.MIDDLE_DIP, LANDMARK.MIDDLE_TIP],
  // Ring
  [LANDMARK.WRIST, LANDMARK.RING_MCP], [LANDMARK.RING_MCP, LANDMARK.RING_PIP],
  [LANDMARK.RING_PIP, LANDMARK.RING_DIP], [LANDMARK.RING_DIP, LANDMARK.RING_TIP],
  // Pinky
  [LANDMARK.WRIST, LANDMARK.PINKY_MCP], [LANDMARK.PINKY_MCP, LANDMARK.PINKY_PIP],
  [LANDMARK.PINKY_PIP, LANDMARK.PINKY_DIP], [LANDMARK.PINKY_DIP, LANDMARK.PINKY_TIP],
  // Palm
  [LANDMARK.INDEX_MCP, LANDMARK.MIDDLE_MCP], [LANDMARK.MIDDLE_MCP, LANDMARK.RING_MCP],
  [LANDMARK.RING_MCP, LANDMARK.PINKY_MCP],
]

const GESTURE_LABELS: Record<string, string> = {
  none: 'No hand',
  open_palm: 'Open Palm',
  pinch: 'Pinch',
  fist: 'Fist',
}

const CANVAS_W = 120
const CANVAS_H = 90

interface TrackingThumbnailProps {
  videoEl: HTMLVideoElement | null
}

export function TrackingThumbnail({ videoEl }: TrackingThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarks = useStore((s) => s.landmarks)
  const gesture = useStore((s) => s.gesture)
  const trackingReady = useStore((s) => s.trackingReady)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !trackingReady) return

    let raf = 0
    let dead = false

    const draw = () => {
      if (dead) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw video frame in grayscale
      if (videoEl && videoEl.readyState >= 2) {
        ctx.save()
        ctx.filter = 'grayscale(1)'
        ctx.drawImage(videoEl, 0, 0, CANVAS_W, CANVAS_H)
        ctx.restore()
      } else {
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      }

      // Draw skeleton
      const lm = useStore.getState().landmarks
      if (lm && lm.length === 21) {
        ctx.strokeStyle = '#7CFF00'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.7

        // Draw connections
        for (const [a, b] of CONNECTIONS) {
          const la = lm[a]!
          const lb = lm[b]!
          ctx.beginPath()
          ctx.moveTo(la.x * CANVAS_W, la.y * CANVAS_H)
          ctx.lineTo(lb.x * CANVAS_W, lb.y * CANVAS_H)
          ctx.stroke()
        }

        // Draw joints
        ctx.globalAlpha = 1.0
        ctx.fillStyle = '#7CFF00'
        for (const l of lm) {
          ctx.beginPath()
          ctx.arc(l.x * CANVAS_W, l.y * CANVAS_H, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = 1.0
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [trackingReady, videoEl])

  if (!trackingReady) return null

  return (
    <div
      className="absolute bottom-3 right-3 transition-opacity duration-200"
      style={{ opacity: landmarks ? 1 : 0.5 }}
    >
      <div
        className="overflow-hidden"
        style={{
          width: CANVAS_W,
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(124,255,0,0.4)',
          borderRadius: 6,
        }}
      >
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
        <div
          className="text-center font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '1px',
            color: '#7CFF00',
            padding: '3px 0',
          }}
        >
          {GESTURE_LABELS[gesture] ?? 'No hand'}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/editor/TrackingThumbnail.tsx
git commit -m "feat(tracking): TrackingThumbnail — B/W webcam feed with skeleton overlay"
```

---

### Task 12: TrackingSidebar component

**Files:**
- Create: `src/editor/TrackingSidebar.tsx`

- [ ] **Step 1: Implement TrackingSidebar**

Create `src/editor/TrackingSidebar.tsx`:

```typescript
import { useStore } from '../store'

const GESTURE_LABELS: Record<string, string> = {
  none: 'No hand detected',
  open_palm: 'Open Palm — Magnet',
  pinch: 'Pinch — Scale',
  fist: 'Fist — Explode',
}

const FIST_PHASE_LABELS: Record<string, string> = {
  idle: '',
  contracting: 'Contracting...',
  exploding: 'Exploding!',
  reassembling: 'Reassembling...',
}

export function TrackingSidebar() {
  const enabled = useStore((s) => s.trackingEnabled)
  const ready = useStore((s) => s.trackingReady)
  const gesture = useStore((s) => s.gesture)
  const fistPhase = useStore((s) => s.fistPhase)
  const error = useStore((s) => s.trackingError)

  if (!enabled) return null

  return (
    <div
      className="mx-2 mb-2 p-3 rounded-lg transition-all duration-200"
      style={{
        background: 'rgba(124,255,0,0.06)',
        border: '1px solid rgba(124,255,0,0.25)',
      }}
    >
      <div
        className="font-mono uppercase mb-2"
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: '#7CFF00',
        }}
      >
        ✋ Tracking
      </div>

      {error ? (
        <div className="font-mono text-danger" style={{ fontSize: 10 }}>
          {error}
        </div>
      ) : !ready ? (
        <div className="font-mono text-text-muted animate-pulse" style={{ fontSize: 10 }}>
          Loading...
        </div>
      ) : (
        <div className="font-mono" style={{ fontSize: 10 }}>
          <div style={{ color: gesture !== 'none' ? '#7CFF00' : undefined }} className={gesture === 'none' ? 'text-text-muted' : ''}>
            {GESTURE_LABELS[gesture]}
          </div>
          {fistPhase !== 'idle' && (
            <div className="text-accent mt-1" style={{ fontSize: 9 }}>
              {FIST_PHASE_LABELS[fistPhase]}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/editor/TrackingSidebar.tsx
git commit -m "feat(tracking): TrackingSidebar — status display in right panel"
```

---

### Task 13: Wire up Viewport with thumbnail + hook

**Files:**
- Modify: `src/editor/Viewport.tsx`

- [ ] **Step 1: Add hook and thumbnail to Viewport**

In `src/editor/Viewport.tsx`, add imports:

```typescript
import { useHandTracking } from '../tracking/useHandTracking'
import { TrackingThumbnail } from './TrackingThumbnail'
```

Inside the `Viewport` component, add the hook. Note: `useHandTracking` returns a state variable (not a ref) so React re-renders when the video element becomes available:

```typescript
const trackingEnabled = useStore((s) => s.trackingEnabled)
const { videoEl } = useHandTracking()
```

After the `<Canvas>` closing tag, add the thumbnail overlay (inside the `relative` div):

```tsx
{trackingEnabled && (
  <TrackingThumbnail videoEl={videoEl} />
)}
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/editor/Viewport.tsx
git commit -m "feat(tracking): wire Viewport with useHandTracking hook and thumbnail"
```

---

### Task 14: Wire up ControlPanel with TrackingSidebar

**Files:**
- Modify: `src/editor/ControlPanel.tsx`

- [ ] **Step 1: Add TrackingSidebar to ControlPanel**

In `src/editor/ControlPanel.tsx`, add import:

```typescript
import { TrackingSidebar } from './TrackingSidebar'
```

In the JSX return, add `<TrackingSidebar />` **before** the Tweakpane container div:

```tsx
return (
  <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
    <TrackingSidebar />
    <div ref={containerRef} className="p-2" />
  </div>
)
```

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/editor/ControlPanel.tsx
git commit -m "feat(tracking): add TrackingSidebar to ControlPanel"
```

---

### Task 15: Integrate hand modifier into ParticleSystem

**Files:**
- Modify: `src/engine/ParticleSystem.tsx`

- [ ] **Step 1: Add hand modifier import and call**

In `src/engine/ParticleSystem.tsx`, add a **lazy import** at the top of the file. This ensures `hand-modifier.ts` and its transitive deps are not bundled into the main chunk — they load only when tracking is first activated:

```typescript
// Lazy-loaded hand modifier — only imported when tracking is active
let _applyHandModifier: typeof import('../tracking/hand-modifier').applyHandModifier | null = null
let _handModifierLoading = false

async function ensureHandModifier() {
  if (_applyHandModifier || _handModifierLoading) return
  _handModifierLoading = true
  const mod = await import('../tracking/hand-modifier')
  _applyHandModifier = mod.applyHandModifier
}
```

Inside `useFrame()`, **after** the existing for-loop (after the closing `}` of `for (let i = 0; i < count; i++)`) and **before** `posAttr.needsUpdate = true`, add:

```typescript
    // ── Hand tracking modifier ──
    // Operates on positions buffer AFTER effect computation.
    // All existing effects work automatically — no per-effect changes needed.
    // Must also check fistPhase: explode/reassemble continue after gesture returns to 'none'.
    if (store.trackingEnabled && (store.gesture !== 'none' || store.fistPhase !== 'idle')) {
      if (!_applyHandModifier) {
        ensureHandModifier()
      } else {
        _applyHandModifier(positions, count, store, delta)
      }
    }
```

Note: `store` is already read via `useStore.getState()` at the top of `useFrame`. The `TrackingSlice` fields are available because `PrtclState extends TrackingSlice`.

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/engine/ParticleSystem.tsx
git commit -m "feat(tracking): integrate hand modifier into ParticleSystem render loop"
```

---

### Task 16: Final verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Type check**

```bash
npx tsc -b
```

Expected: PASS.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Verify in browser:
1. ✋ button visible in top bar (hidden on mobile)
2. Click ✋ → button pulses green, WASM loads, webcam activates
3. Thumbnail appears bottom-right with B/W feed + green skeleton
4. Sidebar shows "TRACKING" section with gesture status
5. Open palm → particles attracted to hand position
6. Pinch → particles scale
7. Close fist → contract; open fist → explode → reassemble
8. Toggle OFF → everything cleans up, particles return to normal
9. All existing effects still work normally

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: Production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(tracking): hand tracking v1 complete — MediaPipe, gestures, modifier, UI"
```
