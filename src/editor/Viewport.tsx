import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ParticleSystem } from '../engine/ParticleSystem'
import { PaperFleet } from '../engine/PaperFleet'
import { TextTerrain } from '../engine/TextTerrain'
import { PerlinNoise } from '../engine/PerlinNoise'
import { InsideNebula } from '../engine/InsideNebula'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStore } from '../store'
import { useIsMobile } from '../hooks/useIsMobile'
import { setCameraRef, setControlsRef, getControlsRef } from '../engine/camera-bridge'
import { updateHandCamera } from '../tracking/hand-camera'
import { useHandTracking } from '../tracking/useHandTracking'
import { useAudioReactivity } from '../audio/useAudioReactivity'
import { TrackingThumbnail } from './TrackingThumbnail'
import { SceneBackground } from './SceneBackground'

const MORPH_DURATION = 2.0 // seconds — must match ParticleSystem

/** Sine ease-in-out — the gentlest S-curve, like a breath */
function easeInOutSine(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return -(Math.cos(Math.PI * c) - 1) / 2
}

/** Syncs store camera values (autoRotate, zoom) with the R3F scene */
function CameraSync() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const zoomRef = useRef(1)
  const { camera } = useThree()

  // Camera morph state
  const camFromPos = useRef({ x: 0, y: 0, z: 0 })
  const camToPos = useRef({ x: 0, y: 0, z: 0 })
  const camFromTarget = useRef({ x: 0, y: 0, z: 0 })
  const camToTarget = useRef({ x: 0, y: 0, z: 0 })
  const camMorphStart = useRef(-1)
  const hasPendingTarget = useRef(false)

  // Register refs for the camera bridge (used by Copy Params)
  useEffect(() => { setCameraRef(camera) }, [camera])
  useEffect(() => {
    if (controlsRef.current) setControlsRef(controlsRef.current)
  })

  useFrame(({ clock }) => {
    const state = useStore.getState()
    const ctrl = controlsRef.current

    // Start camera morph when preset sets pending position
    if (state.pendingCameraPosition) {
      const [px, py, pz] = state.pendingCameraPosition
      camFromPos.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      camToPos.current = { x: px, y: py, z: pz }
      camMorphStart.current = clock.elapsedTime
      state.setCameraPosition(null)
    }
    if (state.pendingCameraTarget && ctrl) {
      const [tx, ty, tz] = state.pendingCameraTarget
      camFromTarget.current = { x: ctrl.target.x, y: ctrl.target.y, z: ctrl.target.z }
      camToTarget.current = { x: tx, y: ty, z: tz }
      hasPendingTarget.current = true
      state.setCameraTarget(null)
    }

    // Animate camera morph
    if (camMorphStart.current >= 0) {
      const elapsed = clock.elapsedTime - camMorphStart.current
      const t = easeInOutSine(Math.min(elapsed / MORPH_DURATION, 1))

      const fp = camFromPos.current
      const tp = camToPos.current
      camera.position.set(
        fp.x + (tp.x - fp.x) * t,
        fp.y + (tp.y - fp.y) * t,
        fp.z + (tp.z - fp.z) * t,
      )

      if (hasPendingTarget.current && ctrl) {
        const ft = camFromTarget.current
        const tt = camToTarget.current
        ctrl.target.set(
          ft.x + (tt.x - ft.x) * t,
          ft.y + (tt.y - ft.y) * t,
          ft.z + (tt.z - ft.z) * t,
        )
      }

      if (t >= 1) {
        camMorphStart.current = -1
        hasPendingTarget.current = false
      }
    }

    if (ctrl) {
      ctrl.autoRotate = state.autoRotateSpeed !== 0
      ctrl.autoRotateSpeed = state.autoRotateSpeed
    }

    // Zoom slider: scale camera distance from target relative to preset distance
    // Only apply when user moves the slider (avoid fighting with scroll zoom)
    if (state.cameraZoom !== zoomRef.current) {
      zoomRef.current = state.cameraZoom
      const dir = camera.position.clone().sub(ctrl?.target ?? camera.position)
      const baseDist = dir.length()
      if (baseDist > 0.01) {
        dir.normalize()
        const newDist = state.baseZoomDistance / Math.max(0.2, state.cameraZoom)
        camera.position.copy((ctrl?.target ?? camera.position).clone().add(dir.multiplyScalar(newDist)))
      }
    }

  })

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />
}

/**
 * Runs AFTER OrbitControls' update() by being a sibling component
 * rendered after CameraSync. This ensures our camera changes stick.
 */
function HandCameraSync() {
  const { camera } = useThree()

  useFrame(() => {
    const state = useStore.getState()
    if (!state.trackingEnabled || state.trackingMode !== 'control') return
    const ctrl = getControlsRef()
    if (!ctrl) return

    // Kill auto-rotate while hand tracking is active — hand is the only controller
    ctrl.autoRotate = false

    updateHandCamera(ctrl, camera, state.palmPosition, state.handSize, state.gesture)
  })

  return null
}

/** Registry of custom renderers — maps customRenderer id to R3F component */
const CUSTOM_RENDERERS: Record<string, React.ComponentType> = {
  'paper-fleet': PaperFleet,
  'text-terrain': TextTerrain,
  'perlin-noise': PerlinNoise,
  'inside-nebula': InsideNebula,
}

/** Conditional bloom post-processing — zero overhead when disabled */
function BloomPass() {
  const enabled = useStore(s => s.bloomEnabled)
  const strength = useStore(s => s.bloomStrength)
  const threshold = useStore(s => s.bloomThreshold)
  const radius = useStore(s => s.bloomRadius)
  const isMobile = useIsMobile()
  const { gl } = useThree()

  // Toggle ACES tone mapping when bloom is active for proper HDR compression
  useFrame(() => {
    const shouldBloom = enabled && !isMobile
    gl.toneMapping = shouldBloom ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
    gl.toneMappingExposure = shouldBloom ? 1.2 : 1.0
  })

  if (!enabled || isMobile) return null

  return (
    <EffectComposer>
      <Bloom
        intensity={strength}
        luminanceThreshold={threshold}
        radius={radius}
        mipmapBlur
      />
    </EffectComposer>
  )
}

export function Viewport() {
  const trackingEnabled = useStore((s) => s.trackingEnabled)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const { videoEl } = useHandTracking()
  useAudioReactivity()

  // Determine which renderer to use
  const isCustom = selectedEffect?.renderer === 'custom'
  const CustomRenderer = isCustom && selectedEffect?.customRenderer
    ? CUSTOM_RENDERERS[selectedEffect.customRenderer] ?? null
    : null

  return (
    <div className="flex-1 min-w-0 relative">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 60 }}
        gl={{ antialias: false, alpha: false }}
      >
        <SceneBackground />
        {CustomRenderer ? <CustomRenderer /> : <ParticleSystem />}
        <BloomPass />
        <CameraSync />
        <HandCameraSync />
      </Canvas>
      {trackingEnabled && (
        <TrackingThumbnail videoEl={videoEl} />
      )}
    </div>
  )
}
