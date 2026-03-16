import { useEffect, useRef } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'

export function ControlPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const controls = useStore((s) => s.controls)

  useEffect(() => {
    if (!containerRef.current) return
    paneRef.current?.dispose()

    // Tweakpane v4 types require @tweakpane/core which isn't separately
    // installed — the methods exist at runtime via inheritance from FolderApi.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pane = new Pane({ container: containerRef.current }) as any
    paneRef.current = pane

    // Global controls — read initial values from store
    const { particleCount, pointSize } = useStore.getState()
    const globals = pane.addFolder({ title: 'Global' })
    const globalParams = { particleCount, pointSize }

    globals.addBinding(globalParams, 'particleCount', {
      min: 1000, max: 30000, step: 1000, label: 'Particles',
    }).on('change', (ev: { value: number }) => useStore.getState().setParticleCount(ev.value))

    globals.addBinding(globalParams, 'pointSize', {
      min: 1, max: 20, step: 0.5, label: 'Point Size',
    }).on('change', (ev: { value: number }) => useStore.getState().setPointSize(ev.value))

    // Effect controls
    if (controls.length > 0) {
      const effectFolder = pane.addFolder({ title: 'Effect' })
      const params: Record<string, number> = {}
      for (const c of controls) {
        params[c.id] = c.value
        effectFolder.addBinding(params, c.id, {
          min: c.min, max: c.max, label: c.label,
        }).on('change', (ev: { value: number }) => useStore.getState().updateControlValue(c.id, ev.value))
      }
    }

    return () => { pane.dispose(); paneRef.current = null }
  }, [controls]) // ONLY depend on controls, NOT particleCount/pointSize

  return (
    <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
      <div ref={containerRef} className="p-2" />
    </div>
  )
}
