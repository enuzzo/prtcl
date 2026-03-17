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

    positions[idx] = positions[idx]! + dx * clampedForce
    positions[idx + 1] = positions[idx + 1]! + dy * clampedForce
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
    positions[idx] = positions[idx]! * _smoothScale
    positions[idx + 1] = positions[idx + 1]! * _smoothScale
    positions[idx + 2] = positions[idx + 2]! * _smoothScale
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
      positions[idx] = positions[idx]! * (1 - t)
      positions[idx + 1] = positions[idx + 1]! * (1 - t)
      positions[idx + 2] = positions[idx + 2]! * (1 - t)
    }
  } else if (_fistPhase === 'exploding' && _explodeVelocities) {
    const t = easeOutQuad(_fistProgress)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      positions[idx] = positions[idx]! + _explodeVelocities[idx]! * t
      positions[idx + 1] = positions[idx + 1]! + _explodeVelocities[idx + 1]! * t
      positions[idx + 2] = positions[idx + 2]! + _explodeVelocities[idx + 2]! * t
    }
  } else if (_fistPhase === 'reassembling' && _basePositions) {
    const t = easeInOutCubic(_fistProgress)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      // Interpolate from current explosion endpoint back to base
      positions[idx] = positions[idx]! + (_basePositions[idx]! - positions[idx]!) * t
      positions[idx + 1] = positions[idx + 1]! + (_basePositions[idx + 1]! - positions[idx + 1]!) * t
      positions[idx + 2] = positions[idx + 2]! + (_basePositions[idx + 2]! - positions[idx + 2]!) * t
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
