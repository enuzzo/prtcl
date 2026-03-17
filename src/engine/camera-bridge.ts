import type { Camera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/**
 * Module-level refs to the R3F camera and orbit controls.
 * Set by Viewport's CameraSync, read by ControlPanel's Copy Params.
 * No React overhead — just plain references.
 */
let _camera: Camera | null = null
let _controls: OrbitControlsImpl | null = null

export function setCameraRef(camera: Camera) { _camera = camera }
export function setControlsRef(controls: OrbitControlsImpl) { _controls = controls }
export function getControlsRef() { return _controls }

export function getCameraSnapshot() {
  if (!_camera) return null
  const pos = _camera.position
  const target = _controls?.target
  return {
    position: [round(pos.x), round(pos.y), round(pos.z)] as [number, number, number],
    target: target
      ? [round(target.x), round(target.y), round(target.z)] as [number, number, number]
      : [0, 0, 0] as [number, number, number],
  }
}

function round(n: number) { return Math.round(n * 1000) / 1000 }
