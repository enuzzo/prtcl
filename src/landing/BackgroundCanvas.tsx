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
const MOBILE_PARTICLE_COUNT = 3200
const MOBILE_POINT_SIZE = 0.58
const CAM_POS: [number, number, number] = [0.5, 0, 1.2]
const MOBILE_CAM_POS: [number, number, number] = [0.15, 0, 1.35]
const CAM_TARGET: [number, number, number] = [0, 0, 0]
const AUTO_ROTATE_SPEED = 0.8
const MOBILE_AUTO_ROTATE_SPEED = 0.55

export default function BackgroundCanvas() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <Canvas
      camera={{ position: isMobile ? MOBILE_CAM_POS : CAM_POS, fov: 60 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      dpr={isMobile ? 1 : [1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <IsolatedParticleSystem
        compiledFn={frequencyFn}
        controls={frequencyControls}
        particleCount={isMobile ? MOBILE_PARTICLE_COUNT : PARTICLE_COUNT}
        pointSize={isMobile ? MOBILE_POINT_SIZE : POINT_SIZE}
      />
      <OrbitControls
        target={CAM_TARGET}
        autoRotate
        autoRotateSpeed={isMobile ? MOBILE_AUTO_ROTATE_SPEED : AUTO_ROTATE_SPEED}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </Canvas>
  )
}
