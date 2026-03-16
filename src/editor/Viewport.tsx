import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ParticleSystem } from '../engine/ParticleSystem'
import { useStore } from '../store'

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
        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  )
}
