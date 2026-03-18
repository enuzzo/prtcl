import { useEffect, useRef, useMemo } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { TrackingSidebar } from './TrackingSidebar'
import { CURATED_FONTS } from '../text/fonts'

export function ControlPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const controls = useStore((s) => s.controls)

  // Only rebuild Tweakpane when the SET of controls changes (new effect selected),
  // not when control VALUES change (slider moved). This prevents disposing the pane
  // mid-event which causes a crash.
  const selectedEffectId = useStore((s) => s.selectedEffect?.id)

  const controlSchema = useMemo(
    () => `${selectedEffectId}|${controls.map((c) => `${c.id}:${c.min}:${c.max}:${c.initial}`).join('|')}`,
    [controls, selectedEffectId],
  )

  useEffect(() => {
    if (!containerRef.current) return
    paneRef.current?.dispose()

    const currentControls = useStore.getState().controls

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pane = new Pane({ container: containerRef.current }) as any
    paneRef.current = pane

    // ── Global controls ────────────────────────────────────
    const { particleCount, pointSize } = useStore.getState()
    const globals = pane.addFolder({ title: 'Global' })
    const globalParams = { particleCount, pointSize }

    globals.addBinding(globalParams, 'particleCount', {
      min: 1000, max: 30000, step: 1000, label: 'Particles',
    }).on('change', (ev: { value: number }) => useStore.getState().setParticleCount(ev.value))

    globals.addBinding(globalParams, 'pointSize', {
      min: 0.2, max: 2.5, step: 0.1, label: 'Point Size',
    }).on('change', (ev: { value: number }) => useStore.getState().setPointSize(ev.value))

    // ── Camera controls ────────────────────────────────────
    const { autoRotateSpeed, cameraZoom } = useStore.getState()
    const cameraFolder = pane.addFolder({ title: 'Camera' })
    const cameraParams = { autoRotateSpeed, cameraZoom }

    cameraFolder.addBinding(cameraParams, 'autoRotateSpeed', {
      min: -10, max: 10, step: 0.5, label: 'Auto Rotate',
    }).on('change', (ev: { value: number }) => useStore.getState().setAutoRotateSpeed(ev.value))

    cameraFolder.addBinding(cameraParams, 'cameraZoom', {
      min: 0.2, max: 10, step: 0.1, label: 'Zoom',
    }).on('change', (ev: { value: number }) => useStore.getState().setCameraZoom(ev.value))

    // ── Text controls (only for text effects) ────────────
    const selectedEffect = useStore.getState().selectedEffect
    if (selectedEffect?.category === 'text') {
      const textFolder = pane.addFolder({ title: 'Text' })
      const { textInput, textFont, textWeight } = useStore.getState()

      const fontOptions: Record<string, string> = {}
      for (const f of CURATED_FONTS) fontOptions[f.family] = f.family

      const textParams = { text: textInput, font: textFont, weight: textWeight }

      textFolder.addBinding(textParams, 'text', { label: 'Text' })
        .on('change', (ev: { value: string }) => useStore.getState().setTextInput(ev.value))

      textFolder.addBinding(textParams, 'font', { label: 'Font', options: fontOptions })
        .on('change', (ev: { value: string }) => useStore.getState().setTextFont(ev.value))

      // Weight options — filter by selected font's available weights
      const currentFontDef = CURATED_FONTS.find(f => f.family === textFont)
      const weightOptions: Record<string, string> = {}
      for (const w of (currentFontDef?.weights ?? [300, 400, 700])) {
        const label = w <= 300 ? 'Light' : w <= 400 ? 'Regular' : 'Bold'
        weightOptions[label] = String(w)
      }

      textFolder.addBinding(textParams, 'weight', { label: 'Weight', options: weightOptions })
        .on('change', (ev: { value: string }) => useStore.getState().setTextWeight(ev.value))
    }

    // ── Effect controls ────────────────────────────────────
    // Controls that should render as a dropdown instead of a slider
    const DROPDOWN_CONTROLS: Record<string, Record<string, number>> = {
      colorMode: { 'PRTCL': 0, 'Spectrum': 1, 'Noir': 2 },
      style: { 'PRTCL': 0, 'Classic': 1, 'Gold': 2, 'Ice': 3 },
      palette: { 'Aurora': 0, 'PRTCL': 1, 'Fire': 2, 'Ocean': 3 },
    }

    if (currentControls.length > 0) {
      const effectFolder = pane.addFolder({ title: 'Effect' })
      const params: Record<string, number> = {}
      for (const c of currentControls) {
        params[c.id] = c.value
        const dropdownOpts = DROPDOWN_CONTROLS[c.id]
        if (dropdownOpts) {
          // Render as dropdown with named options
          effectFolder.addBinding(params, c.id, {
            label: c.label, options: dropdownOpts,
          }).on('change', (ev: { value: number }) => useStore.getState().updateControlValue(c.id, ev.value))
        } else {
          effectFolder.addBinding(params, c.id, {
            min: c.min, max: c.max, label: c.label,
          }).on('change', (ev: { value: number }) => useStore.getState().updateControlValue(c.id, ev.value))
        }
      }
    }

    // ── Copy Params button ─────────────────────────────────
    const toolsFolder = pane.addFolder({ title: 'Tools' })
    toolsFolder.addButton({ title: 'Copy Params' }).on('click', () => {
      const s = useStore.getState()
      const cam = getCameraSnapshot()
      const snapshot = {
        effect: s.selectedEffect?.id ?? 'unknown',
        global: {
          particleCount: s.particleCount,
          pointSize: s.pointSize,
        },
        camera: {
          autoRotateSpeed: s.autoRotateSpeed,
          zoom: s.cameraZoom,
          position: cam?.position ?? [0, 0, 5],
          target: cam?.target ?? [0, 0, 0],
        },
        controls: Object.fromEntries(
          s.controls.map((c) => [c.id, Math.round(c.value * 1000) / 1000]),
        ),
      }
      const text = JSON.stringify(snapshot, null, 2)
      // Clipboard API can fail when document isn't focused — use fallback
      const copyToClipboard = async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // Fallback: textarea + execCommand
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.cssText = 'position:fixed;left:-9999px'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
      }
      copyToClipboard().then(() => {
        const btn = toolsFolder.children[0] as { title: string }
        const prev = btn.title
        btn.title = 'In your clipboard. You\u2019re welcome.'
        setTimeout(() => { btn.title = prev }, 1200)
      })
    })

    return () => { pane.dispose(); paneRef.current = null }
  }, [controlSchema]) // Depend on schema (ids+ranges), NOT on array reference

  return (
    <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
      <TrackingSidebar />
      <div ref={containerRef} className="p-2" />
    </div>
  )
}
