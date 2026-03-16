import { useEffect, useRef, useMemo } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'

export function ControlPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const controls = useStore((s) => s.controls)

  // Only rebuild Tweakpane when the SET of controls changes (new effect selected),
  // not when control VALUES change (slider moved). This prevents disposing the pane
  // mid-event which causes a crash.
  const controlSchema = useMemo(
    () => controls.map((c) => `${c.id}:${c.min}:${c.max}:${c.initial}`).join('|'),
    [controls],
  )

  useEffect(() => {
    if (!containerRef.current) return
    paneRef.current?.dispose()

    const currentControls = useStore.getState().controls

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

    // Effect controls — read from store snapshot, not from the subscribed value
    if (currentControls.length > 0) {
      const effectFolder = pane.addFolder({ title: 'Effect' })
      const params: Record<string, number> = {}
      for (const c of currentControls) {
        params[c.id] = c.value
        effectFolder.addBinding(params, c.id, {
          min: c.min, max: c.max, label: c.label,
        }).on('change', (ev: { value: number }) => useStore.getState().updateControlValue(c.id, ev.value))
      }
    }

    return () => { pane.dispose(); paneRef.current = null }
  }, [controlSchema]) // Depend on schema (ids+ranges), NOT on array reference

  return (
    <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
      <div ref={containerRef} className="p-2" />
    </div>
  )
}
