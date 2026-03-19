import { Vector3, Spherical } from 'three'
import type { Camera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// ── Constants ──────────────────────────────────────────
const ROTATE_SPEED = 0.06          // radians per frame at full offset
const ZOOM_ALPHA = 0.05            // lerp speed for zoom smoothing
const DEAD_ZONE = 0.06             // ignore palm movement within this radius of anchor
const RETURN_ALPHA = 0.025        // lerp speed for returning to home position
const INPUT_ALPHA = 0.12          // lerp speed for smoothing raw hand inputs

// ── Pre-allocated objects (zero GC in render loop) ─────
const _offset = new Vector3()
const _spherical = new Spherical()

// ── Module-level state ─────────────────────────────────
let _engaged = false
const _homePosition = new Vector3()
const _homeTarget = new Vector3()
let _homeRadius = 5
let _baselineHandSize = 0
let _wasOpenPalm = false
let _smoothRadius = 0
let _smoothPalmX = 0.5
let _smoothPalmY = 0.5
let _smoothHandSize = 0

/** Anchor point — where the palm was when tracking began (the "joystick zero") */
let _anchorX = 0.5
let _anchorY = 0.5

export function resetHandCamera(): void {
  _engaged = false
  _baselineHandSize = 0
  _smoothRadius = 0
  _smoothPalmX = 0.5
  _smoothPalmY = 0.5
  _smoothHandSize = 0
  _anchorX = 0.5
  _anchorY = 0.5
  _wasOpenPalm = false
}

/**
 * Controls camera rotation + zoom from hand tracking data.
 * Called every frame from HandCameraSync's useFrame.
 *
 * On first detection, the palm position becomes the "anchor" — all movement
 * is relative to that point, like grabbing a joystick wherever your hand is.
 * Hand size (wrist–finger distance) → zoom (relative to baseline).
 * 5s timeout with no hand → smooth return to home camera position.
 */
export function updateHandCamera(
  controls: OrbitControlsImpl,
  camera: Camera,
  palmPosition: { x: number; y: number } | null,
  handSize: number,
  gesture: string,
): void {
  if (gesture === 'open_palm' && palmPosition) {
    // Capture home state on very first engagement
    if (!_engaged) {
      _engaged = true
      _homePosition.copy(camera.position)
      _homeTarget.copy(controls.target)
      _offset.copy(camera.position).sub(controls.target)
      _homeRadius = _offset.length()
      _baselineHandSize = handSize
      _smoothRadius = _homeRadius
      _smoothPalmX = palmPosition.x
      _smoothPalmY = palmPosition.y
      _smoothHandSize = handSize
    }

    // Re-anchor every time the palm reappears (fist → open, or hand gone → back)
    if (!_wasOpenPalm) {
      _anchorX = _smoothPalmX
      _anchorY = _smoothPalmY
    }
    _wasOpenPalm = true

    // Smooth raw inputs to avoid jerks on tracking flicker
    _smoothPalmX += (palmPosition.x - _smoothPalmX) * INPUT_ALPHA
    _smoothPalmY += (palmPosition.y - _smoothPalmY) * INPUT_ALPHA
    _smoothHandSize += (handSize - _smoothHandSize) * INPUT_ALPHA

    // Offset from anchor — X inverted so hand "pushes" the object naturally
    const dx = _smoothPalmX - _anchorX
    const dy = _anchorY - _smoothPalmY
    const mag = Math.sqrt(dx * dx + dy * dy)

    // Current spherical state
    _offset.copy(camera.position).sub(controls.target)
    _spherical.setFromVector3(_offset)

    // Rotation (only outside dead zone)
    if (mag > DEAD_ZONE) {
      const scale = (mag - DEAD_ZONE) / (0.5 - DEAD_ZONE)
      const normDx = (dx / mag) * scale
      const normDy = (dy / mag) * scale

      _spherical.theta += normDx * ROTATE_SPEED
      _spherical.phi -= normDy * ROTATE_SPEED
      _spherical.phi = Math.max(0.15, Math.min(Math.PI - 0.15, _spherical.phi))
    }

    // Zoom (relative to hand size at first detection)
    if (_baselineHandSize > 0.01) {
      const sizeRatio = _smoothHandSize / _baselineHandSize
      const targetRadius = _homeRadius * Math.max(0.4, Math.min(2.5, sizeRatio))
      _smoothRadius += (targetRadius - _smoothRadius) * ZOOM_ALPHA
      _spherical.radius = _smoothRadius
    }

    _offset.setFromSpherical(_spherical)
    camera.position.copy(controls.target).add(_offset)
    return
  }

  // ── Palm not open (fist, gone, other gesture) ──────
  _wasOpenPalm = false
  if (!_engaged) return

  // Immediately return to home position — pugno/mano via = reset
  camera.position.lerp(_homePosition, RETURN_ALPHA)
  controls.target.lerp(_homeTarget, RETURN_ALPHA)

  // Snap and disengage when close enough
  if (camera.position.distanceTo(_homePosition) < 0.05) {
    camera.position.copy(_homePosition)
    controls.target.copy(_homeTarget)
    _engaged = false
    _baselineHandSize = 0
  }
}
