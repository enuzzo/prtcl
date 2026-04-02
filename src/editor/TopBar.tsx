import { useCallback, useEffect, useState } from 'react'
// Note: fullscreen state is managed in the Zustand store (shared with EditorLayout for panel auto-collapse)
import { useStore } from '../store'
import { VERSION, CODENAME } from '../version'
import { MobileEffectDropdown } from './MobileEffectDropdown'
import { MobileControlsSheet } from './MobileControlsSheet'
import { ALL_PRESETS } from '../effects/presets'
import { encodeShareState } from '../share'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { getBackgroundPreset } from './background-presets'
import { DEFAULT_SPIRIT_SETTINGS, type SpiritSettings } from '../engine/spirit/config'
import { matchSpiritColorway } from '../engine/spirit/colorways'
import { getSpiritPreset, matchSpiritPreset } from '../engine/spirit/presets'
import type { Effect } from '../engine/types'

interface TopBarProps {
  isMobile: boolean
  onSelectEffect: (effect: Effect) => void
}

const EPSILON = 0.0005

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function near(a: number | undefined, b: number | undefined, epsilon = EPSILON): boolean {
  if (a == null || b == null) return a == null && b == null
  return Math.abs(a - b) <= epsilon
}

function nearVec3(a: [number, number, number] | undefined, b: [number, number, number] | undefined): boolean {
  if (!a || !b) return a == null && b == null
  return near(a[0], b[0]) && near(a[1], b[1]) && near(a[2], b[2])
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(ta)
      return copied
    } catch {
      return false
    }
  }
}

function getSpiritShareDiff(
  settings: SpiritSettings,
  colorwayId: string | undefined,
): Partial<SpiritSettings> | undefined {
  const diff: Partial<SpiritSettings> = {}

  for (const key of Object.keys(DEFAULT_SPIRIT_SETTINGS) as Array<keyof SpiritSettings>) {
    if (colorwayId && (key === 'color1' || key === 'color2' || key === 'bgColor')) {
      continue
    }

    const current = settings[key]
    const baseline = DEFAULT_SPIRIT_SETTINGS[key]

    if (typeof current === 'number' && typeof baseline === 'number') {
      if (!near(current, baseline)) diff[key] = round3(current) as never
      continue
    }

    if (current !== baseline) {
      diff[key] = current as never
    }
  }

  return Object.keys(diff).length > 0 ? diff : undefined
}

export function TopBar({ isMobile, onSelectEffect }: TopBarProps) {
  const [activeMobileSheet, setActiveMobileSheet] = useState<'effects' | 'controls' | null>(null)
  const isFullscreen = useStore((s) => s.isFullscreen)

  // Sync browser fullscreen state with store (handles ESC key, etc.)
  useEffect(() => {
    const onChange = () => useStore.getState().setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const trackingEnabled = useStore((s) => s.trackingEnabled)
  const trackingReady = useStore((s) => s.trackingReady)
  const trackingError = useStore((s) => s.trackingError)
  const selectedEffect = useStore((s) => s.selectedEffect)

  const toggleTracking = useCallback(() => {
    if (trackingError) {
      useStore.getState().setTrackingError(null)
    }
    useStore.getState().setTrackingEnabled(!trackingEnabled)
  }, [trackingEnabled, trackingError])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }, [])

  const handleMobileSelect = useCallback(
    (effect: Effect) => {
      onSelectEffect(effect)
      setActiveMobileSheet(null)
    },
    [onSelectEffect],
  )

  // Share: serialize the current editor deltas into a compact URL.
  const handleShare = useCallback(async () => {
    const store = useStore.getState()
    const effect = store.selectedEffect
    if (!effect) return

    const camSnap = getCameraSnapshot()
    const isTextEffect = effect.category === 'text'

    let spiritPresetId: string | undefined
    let spiritColorwayId: string | undefined
    let spiritDiff: Partial<SpiritSettings> | undefined

    if (effect.id === 'the-spirit') {
      const currentCamera = {
        autoRotateSpeed: store.autoRotateSpeed,
        zoom: store.cameraZoom,
        position: camSnap?.position ?? effect.cameraPosition ?? [0, 0, 5],
        target: camSnap?.target ?? effect.cameraTarget ?? [0, 0, 0],
      }

      const matchedPresetId = matchSpiritPreset({
        camera: currentCamera,
        spirit: store.spiritSettings,
      })

      if (matchedPresetId !== 'custom') {
        spiritPresetId = matchedPresetId
      } else {
        const matchedColorwayId = matchSpiritColorway(store.spiritSettings)
        if (matchedColorwayId !== 'custom') {
          spiritColorwayId = matchedColorwayId
        }
        spiritDiff = getSpiritShareDiff(store.spiritSettings, spiritColorwayId)
      }
    }

    const spiritPreset = spiritPresetId ? getSpiritPreset(spiritPresetId) : undefined

    const controlValues: Record<string, number> = {}
    for (const ctrl of store.controls) {
      if (!near(ctrl.value, ctrl.initial)) {
        controlValues[ctrl.id] = round3(ctrl.value)
      }
    }

    const currentBackgroundPreset = getBackgroundPreset(store.backgroundPreset)
    const usingBackgroundPreset = currentBackgroundPreset?.css === store.backgroundColor
    const bgPreset = effect.id === 'the-spirit'
      ? undefined
      : usingBackgroundPreset && currentBackgroundPreset && store.backgroundPreset !== effect.backgroundPreset
        ? store.backgroundPreset
        : undefined
    const bgCustom = effect.id !== 'the-spirit' && !usingBackgroundPreset && /^#/i.test(store.backgroundColor)
      ? store.backgroundColor.replace(/^#/, '')
      : undefined

    const hash = encodeShareState({
      effect: effect.id,
      p: store.particleCount !== effect.particleCount ? store.particleCount : undefined,
      ps: !near(store.pointSize, effect.pointSize ?? 0.21) ? round3(store.pointSize) : undefined,
      ar: !near(store.autoRotateSpeed, spiritPreset?.camera.autoRotateSpeed ?? effect.autoRotateSpeed ?? 0)
        ? round3(store.autoRotateSpeed)
        : undefined,
      z: !near(store.cameraZoom, spiritPreset?.camera.zoom ?? effect.cameraZoom ?? 1)
        ? round3(store.cameraZoom)
        : undefined,
      cam: camSnap?.position && !nearVec3(camSnap.position, spiritPreset?.camera.position ?? effect.cameraPosition)
        ? camSnap.position
        : undefined,
      tgt: camSnap?.target && !nearVec3(camSnap.target, spiritPreset?.camera.target ?? effect.cameraTarget)
        ? camSnap.target
        : undefined,
      bg: bgPreset,
      bgc: bgCustom,
      c: Object.keys(controlValues).length > 0 ? controlValues : undefined,
      txt: isTextEffect ? store.textInput : undefined,
      font: isTextEffect ? store.textFont : undefined,
      w: isTextEffect ? store.textWeight : undefined,
      ls: isTextEffect ? store.textLineSpacing : undefined,
      spr: spiritPresetId,
      sc: spiritColorwayId,
      sp: spiritDiff,
    })

    const url = `${window.location.origin}/create#${hash}`

    try {
      if (isMobile && typeof navigator.share === 'function') {
        await navigator.share({ title: `${effect.name} · PRTCL`, url })
        return
      }

      const copied = await copyText(url)
      store.showToast(copied ? 'Link copied. Deploy at will.' : 'Could not copy — check browser permissions.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const copied = await copyText(url)
      store.showToast(copied ? 'Link copied. Deploy at will.' : 'Could not share this link right now.')
    }
  }, [isMobile])

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 bg-surface border-b border-border relative z-50">
        {/* Left: Logo (always) + version/codename (desktop only) */}
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-accent font-bold tracking-wider">PRTCL</span>
          {!isMobile && (
            <>
              <span
                className="font-mono text-text-muted font-bold tracking-wider hidden sm:inline"
                title={`v${VERSION} "${CODENAME}"`}
              >
                {VERSION}
              </span>
              <span className="font-mono text-text-muted font-bold tracking-wider hidden md:inline">
                {CODENAME}
              </span>
            </>
          )}
        </div>

        {/* Center: Effect name dropdown trigger (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setActiveMobileSheet((sheet) => (sheet === 'effects' ? null : 'effects'))}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-border/70 text-sm font-mono text-text hover:bg-elevated transition-colors max-w-[30vw] truncate"
          >
            <span className="truncate">{selectedEffect?.name ?? 'Select'}</span>
            <span className={`text-[10px] text-text-muted transition-transform ${activeMobileSheet === 'effects' ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
        )}

        {/* Right: actions */}
        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
          {isMobile && (
            <button
              onClick={() => setActiveMobileSheet((sheet) => (sheet === 'controls' ? null : 'controls'))}
              className="px-2 py-1.5 rounded text-sm font-mono bg-elevated text-text-muted border border-transparent hover:bg-border/50 transition-colors"
              title="Effect controls"
              aria-label="Open effect controls"
            >
              ⚙
            </button>
          )}

          {/* Hand Tracking toggle */}
          <button
            onClick={toggleTracking}
            className={`${isMobile ? 'px-2.5' : 'px-3'} py-1.5 rounded text-sm font-mono transition-colors ${
              isMobile ? '' : 'hidden md:block'
            } ${
              trackingError
                ? 'bg-danger/10 text-danger border border-danger/30'
                : trackingEnabled
                  ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                  : 'bg-elevated text-text-muted border border-transparent hover:bg-border/50'
            } ${trackingEnabled && !trackingReady ? 'animate-pulse' : ''}`}
            title={
              trackingError
                ?? (trackingEnabled && !trackingReady
                  ? 'Summoning MediaPipe...'
                  : trackingEnabled
                    ? 'Hand tracking ON'
                    : 'Control with hands')
            }
            aria-label="Toggle hand tracking"
          >
            {'\u270B'}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`${isMobile ? 'px-2.5' : 'px-3'} py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors`}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            ⛶
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className={`${isMobile ? 'px-2.5' : 'px-3'} py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors`}
            title={isMobile ? 'Share this effect' : 'Copy share link'}
            aria-label="Share this effect"
          >
            {isMobile ? '↗' : 'Share'}
          </button>

          {/* Export — desktop only */}
          {!isMobile && selectedEffect?.renderer !== 'custom' && (
            <button
              onClick={() => useStore.getState().setExportModalOpen(true)}
              className="px-4 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded text-sm font-mono hover:bg-accent2/20 transition-colors"
            >
              Export
            </button>
          )}
          {!isMobile && selectedEffect?.renderer === 'custom' && (
            <button
              className="px-4 py-1.5 bg-elevated text-text-muted border border-border rounded text-sm font-mono cursor-not-allowed opacity-50"
              title="Export not available for custom renderer effects"
              disabled
            >
              Export
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown overlay */}
      {isMobile && activeMobileSheet === 'effects' && (
        <MobileEffectDropdown
          effects={ALL_PRESETS}
          selectedId={selectedEffect?.id ?? null}
          onSelect={handleMobileSelect}
          onClose={() => setActiveMobileSheet(null)}
        />
      )}
      {isMobile && activeMobileSheet === 'controls' && (
        <MobileControlsSheet onClose={() => setActiveMobileSheet(null)} />
      )}
    </>
  )
}
