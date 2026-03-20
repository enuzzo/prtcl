import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { IsolatedParticleSystem } from '../export/IsolatedParticleSystem'
import { frequency } from '../effects/presets/frequency'
import { compileEffect } from '../engine/compiler'

/**
 * The actual R3F canvas for the landing page background.
 * This module is lazy-loaded so Three.js (~600KB) doesn't block initial paint.
 *
 * Renders Fractal Frequency at 8k particles with auto-rotate.
 * Uses transparent WebGL so the dark page bg shows through.
 */

const PARTICLE_COUNT = 6000
const POINT_SIZE = 0.5
const CAM_POS: [number, number, number] = [0.5, 0, 1.2]
const CAM_TARGET: [number, number, number] = [0, 0, 0]
const AUTO_ROTATE_SPEED = 0.8

export default function BackgroundCanvas() {
  const { compiledFn, controlValues } = useMemo(() => {
    const result = compileEffect(frequency)
    if (!result.ok) return { compiledFn: null, controlValues: {} }

    const vals: Record<string, number> = {}
    for (const c of result.value.controls) {
      vals[c.id] = c.initial
    }
    return { compiledFn: result.value.fn, controlValues: vals }
  }, [])

  if (!compiledFn) return null

  return (
    <Canvas
      camera={{ position: CAM_POS, fov: 60 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <IsolatedParticleSystem
        compiledFn={compiledFn}
        controls={controlValues}
        particleCount={PARTICLE_COUNT}
        pointSize={POINT_SIZE}
      />
      <OrbitControls
        target={CAM_TARGET}
        autoRotate
        autoRotateSpeed={AUTO_ROTATE_SPEED}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </Canvas>
  )
}
