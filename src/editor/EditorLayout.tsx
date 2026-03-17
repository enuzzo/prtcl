import { useCallback, useEffect } from 'react'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { Viewport } from './Viewport'
import { EffectBrowser } from './EffectBrowser'
import { ControlPanel } from './ControlPanel'
import { useStore } from '../store'
import { compileEffect } from '../engine/compiler'
import { ALL_PRESETS } from '../effects/presets'
import type { Effect } from '../engine/types'

export function EditorLayout() {
  const selectedEffect = useStore((s) => s.selectedEffect)

  const handleSelectEffect = useCallback((effect: Effect) => {
    const result = compileEffect(effect)
    if (result.ok) {
      const store = useStore.getState()
      store.setSelectedEffect(effect)
      store.setCompiledFn(result.value.fn)
      store.setControls(result.value.controls)
      store.setInfo(result.value.info)
      store.setParticleCount(effect.particleCount)
      store.setPointSize(effect.pointSize ?? 4.0)
      store.setAutoRotateSpeed(effect.autoRotateSpeed ?? 0)
      store.setCameraZoom(1)
      // Compute base zoom distance from preset camera position/target
      const cp = effect.cameraPosition ?? [0, 0, 5]
      const ct = effect.cameraTarget ?? [0, 0, 0]
      const dx = cp[0] - ct[0], dy = cp[1] - ct[1], dz = cp[2] - ct[2]
      store.setBaseZoomDistance(Math.sqrt(dx * dx + dy * dy + dz * dz))
      store.setCameraPosition(effect.cameraPosition ?? null)
      store.setCameraTarget(effect.cameraTarget ?? null)
    } else {
      console.error('Failed to compile effect:', result.error)
    }
  }, [])

  // Auto-select first preset on mount
  useEffect(() => {
    if (!selectedEffect && ALL_PRESETS.length > 0) {
      handleSelectEffect(ALL_PRESETS[0]!)
    }
  }, [selectedEffect, handleSelectEffect])

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <EffectBrowser
          effects={ALL_PRESETS}
          selectedId={selectedEffect?.id ?? null}
          onSelect={handleSelectEffect}
        />
        <Viewport />
        <ControlPanel />
      </div>
      <StatusBar />
    </div>
  )
}
