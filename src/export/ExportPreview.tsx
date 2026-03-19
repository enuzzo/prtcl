import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { IsolatedParticleSystem } from './IsolatedParticleSystem'
import type { CompiledEffectFn } from '../engine/types'

interface ExportPreviewProps {
  compiledFn: CompiledEffectFn | null
  controls: Record<string, number>
  particleCount: number
  pointSize: number
  backgroundColor: string
  autoRotateSpeed: number
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  textPoints?: Float32Array | null
}

export function ExportPreview({
  compiledFn, controls, particleCount, pointSize,
  backgroundColor, autoRotateSpeed, cameraPosition, cameraTarget, textPoints,
}: ExportPreviewProps) {
  if (!compiledFn) return null

  return (
    <div className="rounded-lg overflow-hidden border border-border" style={{ background: backgroundColor }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        style={{ height: 260 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <IsolatedParticleSystem
          compiledFn={compiledFn}
          controls={controls}
          particleCount={particleCount}
          pointSize={pointSize}
          textPoints={textPoints}
        />
        <OrbitControls
          target={cameraTarget}
          autoRotate={autoRotateSpeed > 0}
          autoRotateSpeed={autoRotateSpeed}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
