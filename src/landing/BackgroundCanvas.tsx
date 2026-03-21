import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { IsolatedParticleSystem } from '../export/IsolatedParticleSystem'
import { frequencyFn, frequencyControls } from './precompiled-frequency'

/**
 * The actual R3F canvas for the landing page background.
 * This module is lazy-loaded so Three.js (~600KB) doesn't block initial paint.
 *
 * Uses a pre-compiled Fractal Frequency effect to avoid importing the
 * full compiler + validator + effect presets into the landing bundle.
 */

const PARTICLE_COUNT = 6000
const POINT_SIZE = 0.5
const CAM_POS: [number, number, number] = [0.5, 0, 1.2]
const CAM_TARGET: [number, number, number] = [0, 0, 0]
const AUTO_ROTATE_SPEED = 0.8

export default function BackgroundCanvas() {
  return (
    <Canvas
      camera={{ position: CAM_POS, fov: 60 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <IsolatedParticleSystem
        compiledFn={frequencyFn}
        controls={frequencyControls}
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
