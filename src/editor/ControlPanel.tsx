import { useEffect, useRef, useMemo } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { TrackingSidebar } from './TrackingSidebar'
import { BackgroundPicker } from './BackgroundPicker'
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

      const { textLineSpacing } = useStore.getState()
      const lines = textInput.split('\n')
      const textParams = { line1: lines[0] || '', line2: lines[1] || '', font: textFont, weight: textWeight, lineSpacing: textLineSpacing }

      textFolder.addBinding(textParams, 'line1', { label: 'Line 1' })
        .on('change', (ev: { value: string }) => {
          const l2 = useStore.getState().textInput.split('\n')[1] || ''
          useStore.getState().setTextInput(l2 ? ev.value + '\n' + l2 : ev.value)
        })
      textFolder.addBinding(textParams, 'line2', { label: 'Line 2' })
        .on('change', (ev: { value: string }) => {
          const l1 = useStore.getState().textInput.split('\n')[0] || ''
          useStore.getState().setTextInput(ev.value ? l1 + '\n' + ev.value : l1)
        })

      textFolder.addBinding(textParams, 'font', { label: 'Font', options: fontOptions })
        .on('change', (ev: { value: string }) => useStore.getState().setTextFont(ev.value))

      // Weight options — only show if font has multiple weights
      const currentFontDef = CURATED_FONTS.find(f => f.family === textFont)
      const fontWeights = currentFontDef?.weights ?? [400]
      if (fontWeights.length > 1) {
        const weightOptions: Record<string, string> = {}
        for (const w of fontWeights) {
          const label = w <= 300 ? 'Light' : w <= 400 ? 'Regular' : 'Bold'
          weightOptions[label] = String(w)
        }
        textFolder.addBinding(textParams, 'weight', { label: 'Weight', options: weightOptions })
          .on('change', (ev: { value: string }) => useStore.getState().setTextWeight(ev.value))
      }

      // Line spacing — useful for multiline text
      textFolder.addBinding(textParams, 'lineSpacing', { label: 'Line Spacing', min: 0.8, max: 2.0, step: 0.05 })
        .on('change', (ev: { value: number }) => useStore.getState().setTextLineSpacing(ev.value))
    }

    // ── Effect controls ────────────────────────────────────
    // Controls that should render as a dropdown instead of a slider
    const DROPDOWN_CONTROLS: Record<string, Record<string, number>> = {
      colorMode: { 'PRTCL': 0, 'Spectrum': 1, 'Noir': 2 },
      style: { 'PRTCL': 0, 'Classic': 1, 'Gold': 2, 'Ice': 3 },
      palette: { 'Deep Ocean': 0, 'Magma': 1, 'Rainbow': 2, 'Noir': 3, 'PRTCL': 4 },
      krakenColor: { 'Lava': 0, 'Venom': 1, 'Abyss': 2 },
      anemonePalette: { 'Reef': 0, 'Neon': 1, 'Deep Sea': 2, 'Blossom': 3 },
      terrainText: { 'Custom': 0, 'Random': 1, 'Manifesto': 2, 'Aurelius': 3 },
      terrainPalette: { 'PRTCL': 0, 'Typewriter': 1, 'Vintage': 2, 'Matrix': 3 },
      wavePalette: { 'PRTCL': 0, 'Ocean': 1, 'Sunset': 2, 'Neon': 3, 'Spectrum': 4 },
    }

    // Text presets: when a terrainText dropdown changes, also update the text input
    const TEXT_PRESETS: Record<number, string> = {
      1: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      2: 'Here\'s to the ones who never read the manual. The tinkerers. The overthinkers. The dangerously caffeinated. The ones with solder burns and beautiful ideas. The square pegs who 3D-printed their own holes. They ship things that don\'t scale. They build things nobody asked for. They mass-produce prototypes of problems that don\'t exist yet. Because the ones absurd enough to think a single particle can change how you see the world are usually right.',
      3: 'The happiness of your life depends upon the quality of your thoughts. Waste no more time arguing about what a good man should be. Be one. The best revenge is to be unlike him who performed the injury. Very little is needed to make a happy life. It is all within yourself in your way of thinking.',
    }

    {
      const effectFolder = pane.addFolder({ title: 'Effect' })

      // ── Per-effect Particles & Point Size ──────────────
      const { particleCount, pointSize } = useStore.getState()
      const effectGlobals = { particleCount, pointSize }
      effectFolder.addBinding(effectGlobals, 'particleCount', {
        min: 1000, max: 30000, step: 1000, label: 'Particles',
      }).on('change', (ev: { value: number }) => useStore.getState().setParticleCount(ev.value))
      effectFolder.addBinding(effectGlobals, 'pointSize', {
        min: 0.1, max: 12, step: 0.01, label: 'Point Size',
      }).on('change', (ev: { value: number }) => useStore.getState().setPointSize(ev.value))

      const params: Record<string, number> = {}
      for (const c of currentControls) {
        params[c.id] = c.value
        const dropdownOpts = DROPDOWN_CONTROLS[c.id]
        if (dropdownOpts) {
          // Render as dropdown with named options
          effectFolder.addBinding(params, c.id, {
            label: c.label, options: dropdownOpts,
          }).on('change', (ev: { value: number }) => {
            useStore.getState().updateControlValue(c.id, ev.value)
            // Text preset switching: update text input when terrainText dropdown changes
            if (c.id === 'terrainText' && TEXT_PRESETS[ev.value] != null) {
              useStore.getState().setTextInput(TEXT_PRESETS[ev.value]!)
            }
          })
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
        particleCount: s.particleCount,
        pointSize: Math.round(s.pointSize * 1000) / 1000,
        backgroundPreset: s.backgroundPreset,
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
    <div className="w-[320px] h-full bg-surface border-l border-border overflow-y-auto">
      <TrackingSidebar />
      <div ref={containerRef} className="p-2" />
      <BackgroundPicker />
    </div>
  )
}
