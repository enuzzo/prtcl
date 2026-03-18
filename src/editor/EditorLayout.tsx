import { useCallback, useEffect, useRef } from 'react'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { Viewport } from './Viewport'
import { EffectBrowser } from './EffectBrowser'
import { ControlPanel } from './ControlPanel'
import { ExportModal } from '../export/ExportModal'
import { useStore } from '../store'
import { compileEffect } from '../engine/compiler'
import { ALL_PRESETS } from '../effects/presets'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Effect } from '../engine/types'

const LEFT_W = 280
const RIGHT_W = 320

export function EditorLayout() {
  const selectedEffect = useStore((s) => s.selectedEffect)
  const isMobile = useIsMobile()
  const leftOpen = useStore((s) => s.leftPanelOpen)
  const rightOpen = useStore((s) => s.rightPanelOpen)
  const isFullscreen = useStore((s) => s.isFullscreen)

  // Skip transition on initial mount (prevents panels sliding in on page load)
  const mounted = useRef(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => { mounted.current = true })
    return () => cancelAnimationFrame(t)
  }, [])

  // Auto-collapse panels when entering fullscreen, restore when exiting
  const prevFullscreen = useRef(false)
  useEffect(() => {
    if (isFullscreen && !prevFullscreen.current) {
      useStore.getState().setLeftPanelOpen(false)
      useStore.getState().setRightPanelOpen(false)
    } else if (!isFullscreen && prevFullscreen.current) {
      useStore.getState().setLeftPanelOpen(true)
      useStore.getState().setRightPanelOpen(true)
    }
    prevFullscreen.current = isFullscreen
  }, [isFullscreen])

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

  useEffect(() => {
    if (!selectedEffect && ALL_PRESETS.length > 0) {
      handleSelectEffect(ALL_PRESETS[0]!)
    }
  }, [selectedEffect, handleSelectEffect])

  const transition = mounted.current ? 'sidebar-transition' : ''

  // --- Left sidebar style + classes (inline style for dynamic values) ---
  const leftStyle: React.CSSProperties = isFullscreen
    ? { width: LEFT_W, left: leftOpen ? 0 : -LEFT_W }
    : { width: LEFT_W, marginLeft: leftOpen ? 0 : -LEFT_W }

  const leftClasses = isFullscreen
    ? `absolute top-0 bottom-0 z-40 ${transition} ${leftOpen ? 'shadow-[4px_0_24px_rgba(0,0,0,0.5)]' : ''}`
    : `shrink-0 h-full overflow-hidden ${transition}`

  // --- Right sidebar style + classes ---
  const rightStyle: React.CSSProperties = isFullscreen
    ? { width: RIGHT_W, right: rightOpen ? 0 : -RIGHT_W }
    : { width: RIGHT_W, marginRight: rightOpen ? 0 : -RIGHT_W }

  const rightClasses = isFullscreen
    ? `absolute top-0 bottom-0 z-40 ${transition} ${rightOpen ? 'shadow-[-4px_0_24px_rgba(0,0,0,0.5)]' : ''}`
    : `shrink-0 h-full overflow-hidden ${transition}`

  // --- Toggle button positions ---
  const leftToggleStyle: React.CSSProperties = {
    left: leftOpen && !isFullscreen ? LEFT_W : 0,
  }
  const rightToggleStyle: React.CSSProperties = {
    right: rightOpen && !isFullscreen ? RIGHT_W : 0,
  }

  return (
    <div className="flex flex-col h-dvh bg-bg text-text">
      <TopBar isMobile={isMobile} onSelectEffect={handleSelectEffect} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar — always rendered on desktop, never unmounted */}
        {!isMobile && (
          <div className={leftClasses} style={leftStyle}>
            <EffectBrowser
              effects={ALL_PRESETS}
              selectedId={selectedEffect?.id ?? null}
              onSelect={handleSelectEffect}
            />
          </div>
        )}

        {/* Left toggle arrow */}
        {!isMobile && (
          <button
            onClick={() => useStore.getState().toggleLeftPanel()}
            className={`absolute top-1/2 -translate-y-1/2 z-[45] w-5 h-10 flex items-center justify-center
              bg-surface/60 backdrop-blur-sm border border-border rounded-r-md
              text-text-muted hover:text-accent hover:bg-surface/90
              opacity-60 hover:opacity-100 ${transition}`}
            style={leftToggleStyle}
            title={leftOpen ? 'Hide effects' : 'Show effects'}
          >
            <span className="text-xs">{leftOpen ? '\u2039' : '\u203A'}</span>
          </button>
        )}

        <Viewport />

        {/* Right toggle arrow */}
        {!isMobile && (
          <button
            onClick={() => useStore.getState().toggleRightPanel()}
            className={`absolute top-1/2 -translate-y-1/2 z-[45] w-5 h-10 flex items-center justify-center
              bg-surface/60 backdrop-blur-sm border border-border rounded-l-md
              text-text-muted hover:text-accent hover:bg-surface/90
              opacity-60 hover:opacity-100 ${transition}`}
            style={rightToggleStyle}
            title={rightOpen ? 'Hide controls' : 'Show controls'}
          >
            <span className="text-xs">{rightOpen ? '\u203A' : '\u2039'}</span>
          </button>
        )}

        {/* Right sidebar — always rendered on desktop */}
        {!isMobile && (
          <div className={rightClasses} style={rightStyle}>
            <ControlPanel />
          </div>
        )}
      </div>
      <StatusBar isMobile={isMobile} />
      <ExportModal />
    </div>
  )
}
