import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ParticleSystem } from '../engine/ParticleSystem'
import { useStore } from '../store'
import { setCameraRef, setControlsRef } from '../engine/camera-bridge'

/** Syncs store camera values (autoRotate, zoom) with the R3F scene */
function CameraSync() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const zoomRef = useRef(1)
  const { camera } = useThree()

  // Register refs for the camera bridge (used by Copy Params)
  useEffect(() => { setCameraRef(camera) }, [camera])
  useEffect(() => {
    if (controlsRef.current) setControlsRef(controlsRef.current)
  })

  useFrame(() => {
    const state = useStore.getState()
    const ctrl = controlsRef.current

    // Apply pending camera position from effect preset (one-shot)
    if (state.pendingCameraPosition) {
      const [px, py, pz] = state.pendingCameraPosition
      camera.position.set(px, py, pz)
      state.setCameraPosition(null)
    }
    if (state.pendingCameraTarget && ctrl) {
      const [tx, ty, tz] = state.pendingCameraTarget
      ctrl.target.set(tx, ty, tz)
      state.setCameraTarget(null)
    }

    if (ctrl) {
      ctrl.autoRotate = state.autoRotateSpeed !== 0
      ctrl.autoRotateSpeed = state.autoRotateSpeed
    }

    // Zoom slider: scale camera distance from target
    // Only apply when user moves the slider (avoid fighting with scroll zoom)
    if (state.cameraZoom !== zoomRef.current) {
      zoomRef.current = state.cameraZoom
      const dir = camera.position.clone().sub(ctrl?.target ?? camera.position)
      const baseDist = dir.length()
      if (baseDist > 0.01) {
        dir.normalize()
        const newDist = 5 / Math.max(0.1, state.cameraZoom)
        camera.position.copy((ctrl?.target ?? camera.position).clone().add(dir.multiplyScalar(newDist)))
      }
    }
  })

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />
}

export function Viewport() {
  const backgroundColor = useStore((s) => s.backgroundColor)

  return (
    <div className="flex-1 relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: false }}
        style={{ background: backgroundColor }}
      >
        <ParticleSystem />
        <CameraSync />
      </Canvas>
    </div>
  )
}
