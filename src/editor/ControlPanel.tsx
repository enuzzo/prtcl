import { useEffect, useRef, useMemo } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { TrackingSidebar } from './TrackingSidebar'
import { BackgroundPicker } from './BackgroundPicker'
import { CURATED_FONTS } from '../text/fonts'
import { SPIRIT_COLORWAYS, getSpiritColorway, matchSpiritColorway } from '../engine/spirit/colorways'
import { SPIRIT_CAMERA_POSITION, SPIRIT_CAMERA_TARGET } from '../engine/spirit/config'
import { SPIRIT_PRESETS, getSpiritPreset, matchSpiritPreset } from '../engine/spirit/presets'
import { AXIOM_PRESETS, getAxiomPreset, matchAxiomPreset } from '../effects/presets/axiom-presets'

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
    const selectedEffect = useStore.getState().selectedEffect
    const isSpirit = selectedEffect?.id === 'the-spirit'
    const { autoRotateSpeed, cameraZoom } = useStore.getState()
    const cameraFolder = pane.addFolder({ title: 'Camera' })
    const cameraParams = { autoRotateSpeed, cameraZoom }

    if (!isSpirit) {
      cameraFolder.addBinding(cameraParams, 'autoRotateSpeed', {
        min: -10, max: 10, step: 0.5, label: 'Auto Rotate',
      }).on('change', (ev: { value: number }) => {
        useStore.getState().setAutoRotateSpeed(ev.value)
      })
    }

    cameraFolder.addBinding(cameraParams, 'cameraZoom', {
      min: 0.2, max: isSpirit ? 3 : 10, step: 0.1, label: 'Zoom',
    }).on('change', (ev: { value: number }) => useStore.getState().setCameraZoom(ev.value))

    // ── Text controls (only for text effects) ────────────
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
      nebPalette: { 'PRTCL': 0, 'Classic': 1, 'Inferno': 2, 'Arctic': 3, 'Toxic': 4, 'Void': 5 },
      iriPalette: { 'Holographic': 0, 'PRTCL': 1, 'Sunset': 2, 'Ocean': 3, 'Neon': 4, 'Grayscale': 5 },
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
      let markCurrentEffectPresetCustom: (() => void) | null = null
      let effectGlobals: { particleCount: number; pointSize: number } | null = null
      const params: Record<string, number> = {}
      for (const c of currentControls) params[c.id] = c.value

      // ── Per-effect Particles & Point Size (hidden for fullscreen shader effects) ──
      const { particleCount, pointSize } = useStore.getState()
      if (particleCount > 0) {
        effectGlobals = { particleCount, pointSize }
        effectFolder.addBinding(effectGlobals, 'particleCount', {
          min: 1000, max: 30000, step: 1000, label: 'Particles',
        }).on('change', (ev: { value: number }) => {
          markCurrentEffectPresetCustom?.()
          useStore.getState().setParticleCount(ev.value)
        })
        effectFolder.addBinding(effectGlobals, 'pointSize', {
          min: 0.1, max: 12, step: 0.01, label: 'Point Size',
        }).on('change', (ev: { value: number }) => {
          markCurrentEffectPresetCustom?.()
          useStore.getState().setPointSize(ev.value)
        })
      }

      if (selectedEffect?.id === 'axiom') {
        const axiomPresetOptions: Record<string, string> = { Custom: 'custom' }
        for (const preset of AXIOM_PRESETS) {
          axiomPresetOptions[preset.name] = preset.id
        }
        const currentAxiomCamera = getCameraSnapshot()
        const axiomParams = {
          preset: matchAxiomPreset({
            particleCount,
            pointSize,
            backgroundPreset: useStore.getState().backgroundPreset,
            camera: {
              autoRotateSpeed,
              zoom: cameraZoom,
              position: currentAxiomCamera?.position ?? selectedEffect.cameraPosition ?? [0, 0, 5],
              target: currentAxiomCamera?.target ?? selectedEffect.cameraTarget ?? [0, 0, 0],
            },
            controls: {
              spread: params.spread ?? selectedEffect.controls?.spread ?? 3,
              waveHeight: params.waveHeight ?? selectedEffect.controls?.waveHeight ?? 1,
              waves: params.waves ?? selectedEffect.controls?.waves ?? 3,
              waveSpeed: params.waveSpeed ?? selectedEffect.controls?.waveSpeed ?? 0.8,
              agents: params.agents ?? selectedEffect.controls?.agents ?? 8,
              agentSpeed: params.agentSpeed ?? selectedEffect.controls?.agentSpeed ?? 1.2,
              palette: params.palette ?? selectedEffect.controls?.palette ?? 3,
            },
          }),
        }
        markCurrentEffectPresetCustom = () => {
          axiomParams.preset = 'custom'
        }

        effectFolder.addBinding(axiomParams, 'preset', {
          label: 'Preset',
          options: axiomPresetOptions,
        }).on('change', (ev: { value: string }) => {
          const preset = getAxiomPreset(ev.value)
          if (!preset) return

          const store = useStore.getState()
          axiomParams.preset = preset.id
          if (effectGlobals) {
            effectGlobals.particleCount = preset.particleCount
            effectGlobals.pointSize = preset.pointSize
          }
          cameraParams.autoRotateSpeed = preset.camera.autoRotateSpeed
          cameraParams.cameraZoom = preset.camera.zoom
          for (const [id, value] of Object.entries(preset.controls)) {
            params[id] = value
            store.updateControlValue(id, value)
          }
          store.setParticleCount(preset.particleCount)
          store.setPointSize(preset.pointSize)
          store.setBackgroundPreset(preset.backgroundPreset)
          store.setAutoRotateSpeed(preset.camera.autoRotateSpeed)
          store.setCameraZoom(preset.camera.zoom)
          store.setCameraPosition([...preset.camera.position])
          store.setCameraTarget([...preset.camera.target])
          const dx = preset.camera.position[0] - preset.camera.target[0]
          const dy = preset.camera.position[1] - preset.camera.target[1]
          const dz = preset.camera.position[2] - preset.camera.target[2]
          store.setBaseZoomDistance(Math.sqrt(dx * dx + dy * dy + dz * dz))
          pane.refresh()
        })
      }

      if (selectedEffect?.id === 'the-spirit') {
        const { spiritSettings } = useStore.getState()
        const spiritPresetOptions: Record<string, string> = { Custom: 'custom' }
        for (const preset of SPIRIT_PRESETS) {
          spiritPresetOptions[preset.name] = preset.id
        }
        const spiritColorwayOptions: Record<string, string> = { Custom: 'custom' }
        for (const colorway of SPIRIT_COLORWAYS) {
          spiritColorwayOptions[colorway.name] = colorway.id
        }
        const currentSpiritCamera = getCameraSnapshot()
        const spiritParams = {
          preset: matchSpiritPreset({
            camera: {
              autoRotateSpeed,
              zoom: cameraZoom,
              position: currentSpiritCamera?.position ?? selectedEffect.cameraPosition ?? SPIRIT_CAMERA_POSITION,
              target: currentSpiritCamera?.target ?? selectedEffect.cameraTarget ?? SPIRIT_CAMERA_TARGET,
            },
            spirit: spiritSettings,
          }),
          ...spiritSettings,
          colorway: matchSpiritColorway(spiritSettings),
        }
        const markSpiritPresetCustom = () => {
          spiritParams.preset = 'custom'
        }
        markCurrentEffectPresetCustom = markSpiritPresetCustom

        effectFolder.addBinding(spiritParams, 'preset', {
          label: 'Preset',
          options: spiritPresetOptions,
        }).on('change', (ev: { value: string }) => {
          const preset = getSpiritPreset(ev.value)
          if (!preset) return

          Object.assign(spiritParams, preset.spirit)
          spiritParams.preset = preset.id
          spiritParams.colorway = matchSpiritColorway(preset.spirit)

          const store = useStore.getState()
          store.patchSpiritSettings(preset.spirit)
          store.setAutoRotateSpeed(preset.camera.autoRotateSpeed)
          store.setCameraZoom(preset.camera.zoom)
          store.setCameraPosition([...preset.camera.position])
          store.setCameraTarget([...preset.camera.target])
          pane.refresh()
        })

        effectFolder.addBinding(spiritParams, 'dieSpeed', {
          min: 0.0005, max: 0.05, step: 0.0005, label: 'Die Speed',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ dieSpeed: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'radius', {
          min: 0.2, max: 3.0, step: 0.01, label: 'Radius',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ radius: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'attraction', {
          min: -2.0, max: 2.0, step: 0.01, label: 'Attraction',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ attraction: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'motionSpeed', {
          min: 0, max: 3.0, step: 0.05, label: 'Motion Speed',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ motionSpeed: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'colorway', {
          label: 'Palette',
          options: spiritColorwayOptions,
        }).on('change', (ev: { value: string }) => {
          const colorway = getSpiritColorway(ev.value)
          if (!colorway) return
          spiritParams.preset = 'custom'
          spiritParams.color1 = colorway.color1
          spiritParams.color2 = colorway.color2
          spiritParams.bgColor = colorway.bgColor
          useStore.getState().patchSpiritSettings({
            color1: colorway.color1,
            color2: colorway.color2,
            bgColor: colorway.bgColor,
          })
          pane.refresh()
        })

        effectFolder.addBinding(spiritParams, 'followMouse', {
          label: 'Follow Mouse',
        }).on('change', (ev: { value: boolean }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ followMouse: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'shadowDarkness', {
          min: 0, max: 5, step: 0.01, label: 'Floor Shadow',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ shadowDarkness: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'objectShadow', {
          min: 0, max: 1, step: 0.01, label: 'Inner Shadow',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ objectShadow: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'bottomLift', {
          min: 0, max: 1, step: 0.01, label: 'Bottom Gradient',
        }).on('change', (ev: { value: number }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ bottomLift: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'useTriangleParticles', {
          label: 'Triangles',
        }).on('change', (ev: { value: boolean }) => {
          markSpiritPresetCustom()
          useStore.getState().patchSpiritSettings({ useTriangleParticles: ev.value })
        })

        effectFolder.addBinding(spiritParams, 'color1', {
          label: 'Base Color', view: 'color',
        }).on('change', (ev: { value: string }) => {
          markSpiritPresetCustom()
          spiritParams.colorway = matchSpiritColorway({
            color1: ev.value,
            color2: spiritParams.color2,
            bgColor: spiritParams.bgColor,
          })
          useStore.getState().patchSpiritSettings({ color1: ev.value })
          pane.refresh()
        })

        effectFolder.addBinding(spiritParams, 'color2', {
          label: 'Fade Color', view: 'color',
        }).on('change', (ev: { value: string }) => {
          markSpiritPresetCustom()
          spiritParams.colorway = matchSpiritColorway({
            color1: spiritParams.color1,
            color2: ev.value,
            bgColor: spiritParams.bgColor,
          })
          useStore.getState().patchSpiritSettings({ color2: ev.value })
          pane.refresh()
        })

        effectFolder.addBinding(spiritParams, 'bgColor', {
          label: 'Background', view: 'color',
        }).on('change', (ev: { value: string }) => {
          markSpiritPresetCustom()
          spiritParams.colorway = matchSpiritColorway({
            color1: spiritParams.color1,
            color2: spiritParams.color2,
            bgColor: ev.value,
          })
          useStore.getState().patchSpiritSettings({ bgColor: ev.value })
          pane.refresh()
        })
      }
 
      for (const c of currentControls) {
        const dropdownOpts = DROPDOWN_CONTROLS[c.id]
        if (dropdownOpts) {
          // Render as dropdown with named options
          effectFolder.addBinding(params, c.id, {
            label: c.label, options: dropdownOpts,
          }).on('change', (ev: { value: number }) => {
            markCurrentEffectPresetCustom?.()
            useStore.getState().updateControlValue(c.id, ev.value)
            // Text preset switching: update text input when terrainText dropdown changes
            if (c.id === 'terrainText' && TEXT_PRESETS[ev.value] != null) {
              useStore.getState().setTextInput(TEXT_PRESETS[ev.value]!)
            }
          })
        } else {
          effectFolder.addBinding(params, c.id, {
            min: c.min, max: c.max, label: c.label,
          }).on('change', (ev: { value: number }) => {
            markCurrentEffectPresetCustom?.()
            useStore.getState().updateControlValue(c.id, ev.value)
          })
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
        backgroundPreset: s.selectedEffect?.id === 'the-spirit' ? undefined : s.backgroundPreset,
        camera: {
          autoRotateSpeed: s.autoRotateSpeed,
          zoom: s.cameraZoom,
          position: cam?.position ?? [0, 0, 5],
          target: cam?.target ?? [0, 0, 0],
        },
        spirit: s.selectedEffect?.id === 'the-spirit'
          ? { ...s.spiritSettings }
          : undefined,
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
      {selectedEffectId === 'the-spirit' ? (
        <div className="mx-2 mt-2 mb-0.5 rounded-lg border border-border bg-elevated/70 px-3 py-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Background</p>
          <p className="mt-1 text-[11px] leading-tight text-text-muted">
            The Spirit uses its own internal background color. Use the Spirit palette or the `Background` color above.
          </p>
        </div>
      ) : (
        <BackgroundPicker />
      )}
    </div>
  )
}
