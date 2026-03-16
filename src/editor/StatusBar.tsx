import { useStore } from '../store'

export function StatusBar() {
  const fps = useStore((s) => s.fps)
  const actualParticleCount = useStore((s) => s.actualParticleCount)
  const effectName = useStore((s) => s.selectedEffect?.name ?? 'No effect')

  return (
    <div className="flex items-center justify-between h-8 px-4 bg-surface border-t border-border text-xs font-mono text-text-muted">
      <span>{effectName}</span>
      <div className="flex gap-4">
        <span>{actualParticleCount.toLocaleString()} particles</span>
        <span>{fps} FPS</span>
      </div>
    </div>
  )
}
