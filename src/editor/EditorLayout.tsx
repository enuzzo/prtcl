import { useCallback, useEffect, useRef, useState } from 'react'
import { useTextSampling } from '../text/useTextSampling'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { Viewport } from './Viewport'
import { EffectBrowser } from './EffectBrowser'
import { ControlPanel } from './ControlPanel'
import { ExportModal } from '../export/ExportModal'
import { Toast } from '../components/Toast'
import { useStore } from '../store'
import { compileEffect } from '../engine/compiler'
import { ALL_PRESETS } from '../effects/presets'
import { useIsMobile } from '../hooks/useIsMobile'
import { resetHandCamera } from '../tracking/hand-camera'
import type { Effect } from '../engine/types'

const LEFT_W = 280
const RIGHT_W = 320

export function EditorLayout() {
  const selectedEffect = useStore((s) => s.selectedEffect)
  const isMobile = useIsMobile()
  const leftOpen = useStore((s) => s.leftPanelOpen)
  const rightOpen = useStore((s) => s.rightPanelOpen)
  const isFullscreen = useStore((s) => s.isFullscreen)
  const introPhase = useStore((s) => s.introPhase)

  // Intro reveal: stagger panel entrance after splash completes
  const [topBarRevealed, setTopBarRevealed] = useState(false)
  const [statusBarRevealed, setStatusBarRevealed] = useState(false)
  const [togglesRevealed, setTogglesRevealed] = useState(false)
  // Keep overlay mode until user first toggles a sidebar (prevents canvas reflow glitch)
  const [userToggledPanel, setUserToggledPanel] = useState(false)

  useEffect(() => {
    if (introPhase !== 'revealing') return

    // Stagger: TopBar → sidebars (overlay) → StatusBar → toggles → complete
    const t1 = setTimeout(() => setTopBarRevealed(true), 50)
    const t2 = setTimeout(() => {
      useStore.getState().setLeftPanelOpen(true)
      useStore.getState().setRightPanelOpen(true)
    }, 150)
    const t3 = setTimeout(() => setStatusBarRevealed(true), 250)
    const t4 = setTimeout(() => setTogglesRevealed(true), 600)
    const t5 = setTimeout(() => {
      useStore.getState().setIntroPhase('complete')
    }, 900)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [introPhase])

  // Enable transitions only after intro reveal begins (prevents flash on mount)
  const transitionsEnabled = introPhase !== 'splash'

  // Auto-collapse panels when entering fullscreen, restore when exiting
  const prevFullscreen = useRef(false)
  useEffect(() => {
    if (introPhase === 'splash') return
    if (isFullscreen && !prevFullscreen.current) {
      useStore.getState().setLeftPanelOpen(false)
      useStore.getState().setRightPanelOpen(false)
    } else if (!isFullscreen && prevFullscreen.current) {
      useStore.getState().setLeftPanelOpen(true)
      useStore.getState().setRightPanelOpen(true)
    }
    prevFullscreen.current = isFullscreen
  }, [isFullscreen, introPhase])

  const handleSelectEffect = useCallback((effect: Effect, opts?: { skipCamera?: boolean }) => {
    if (useStore.getState().selectedEffect?.id === effect.id) return

    const result = compileEffect(effect)
    if (result.ok) {
      const store = useStore.getState()
      store.setSelectedEffect(effect)
      store.setCompiledFn(result.value.fn)
      store.setControls(result.value.controls)
      store.setInfo(result.value.info)
      store.setParticleCount(effect.particleCount)
      if (effect.defaultText) store.setTextInput(effect.defaultText)
      if (effect.defaultFont) store.setTextFont(effect.defaultFont)
      store.setPointSize(effect.pointSize ?? 1.0)
      store.setAutoRotateSpeed(effect.autoRotateSpeed ?? 0)
      store.setCameraZoom(1)
      const cp = effect.cameraPosition ?? [0, 0, 5]
      const ct = effect.cameraTarget ?? [0, 0, 0]
      const dx = cp[0] - ct[0], dy = cp[1] - ct[1], dz = cp[2] - ct[2]
      store.setBaseZoomDistance(Math.sqrt(dx * dx + dy * dy + dz * dz))
      if (!opts?.skipCamera) {
        store.setCameraPosition(effect.cameraPosition ?? null)
        store.setCameraTarget(effect.cameraTarget ?? null)
      }
      // Reset hand camera so new effect starts from its natural position
      resetHandCamera()
    } else {
      console.error('Failed to compile effect:', result.error)
    }
  }, [])

  useEffect(() => {
    if (!selectedEffect && ALL_PRESETS.length > 0) {
      // Skip camera on initial load — explosion callback will trigger the zoom-in
      handleSelectEffect(ALL_PRESETS[0]!, { skipCamera: true })
    }
  }, [selectedEffect, handleSelectEffect])

  useTextSampling()

  const transition = transitionsEnabled ? 'sidebar-transition' : ''

  // Sidebars are overlays during intro (no canvas reflow) and until user first toggles
  const useOverlay = isFullscreen || introPhase === 'revealing' || (introPhase === 'complete' && !userToggledPanel)

  // --- Left sidebar style + classes ---
  const leftStyle: React.CSSProperties = useOverlay
    ? { width: LEFT_W, left: leftOpen ? 0 : -LEFT_W }
    : { width: LEFT_W, marginLeft: leftOpen ? 0 : -LEFT_W }

  const leftClasses = useOverlay
    ? `absolute top-0 bottom-0 z-40 ${transition} ${leftOpen ? 'shadow-[4px_0_24px_rgba(0,0,0,0.5)]' : ''}`
    : `shrink-0 h-full overflow-hidden ${transition}`

  // --- Right sidebar style + classes ---
  const rightStyle: React.CSSProperties = useOverlay
    ? { width: RIGHT_W, right: rightOpen ? 0 : -RIGHT_W }
    : { width: RIGHT_W, marginRight: rightOpen ? 0 : -RIGHT_W }

  const rightClasses = useOverlay
    ? `absolute top-0 bottom-0 z-40 ${transition} ${rightOpen ? 'shadow-[-4px_0_24px_rgba(0,0,0,0.5)]' : ''}`
    : `shrink-0 h-full overflow-hidden ${transition}`

  // --- Toggle button positions ---
  const leftToggleStyle: React.CSSProperties = {
    left: leftOpen && !useOverlay ? LEFT_W : 0,
  }
  const rightToggleStyle: React.CSSProperties = {
    right: rightOpen && !useOverlay ? RIGHT_W : 0,
  }

  // --- Intro transforms for TopBar/StatusBar (smooth breath easing) ---
  const breathEase = 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)'
  const topBarStyle: React.CSSProperties = {
    transform: topBarRevealed || isMobile ? 'translateY(0)' : 'translateY(-100%)',
    transition: transitionsEnabled ? breathEase : 'none',
  }
  const statusBarStyle: React.CSSProperties = {
    transform: statusBarRevealed || isMobile ? 'translateY(0)' : 'translateY(100%)',
    transition: transitionsEnabled ? breathEase : 'none',
  }

  // Toggle arrows: hidden until panels are revealed
  const toggleOpacity = togglesRevealed || introPhase === 'complete'
    ? 'opacity-60 hover:opacity-100'
    : 'opacity-0 pointer-events-none'

  return (
    <div className="flex flex-col h-dvh bg-bg text-text overflow-hidden">
      <div style={topBarStyle}>
        <TopBar isMobile={isMobile} onSelectEffect={handleSelectEffect} />
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar */}
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
            onClick={() => { setUserToggledPanel(true); useStore.getState().toggleLeftPanel() }}
            className={`absolute top-1/2 -translate-y-1/2 z-[45] w-5 h-10 flex items-center justify-center
              bg-surface/60 backdrop-blur-sm border border-border rounded-r-md
              text-text-muted hover:text-accent hover:bg-surface/90
              transition-opacity duration-300 ${toggleOpacity} ${transition}`}
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
            onClick={() => { setUserToggledPanel(true); useStore.getState().toggleRightPanel() }}
            className={`absolute top-1/2 -translate-y-1/2 z-[45] w-5 h-10 flex items-center justify-center
              bg-surface/60 backdrop-blur-sm border border-border rounded-l-md
              text-text-muted hover:text-accent hover:bg-surface/90
              transition-opacity duration-300 ${toggleOpacity} ${transition}`}
            style={rightToggleStyle}
            title={rightOpen ? 'Hide controls' : 'Show controls'}
          >
            <span className="text-xs">{rightOpen ? '\u203A' : '\u2039'}</span>
          </button>
        )}

        {/* Right sidebar */}
        {!isMobile && (
          <div className={rightClasses} style={rightStyle}>
            <ControlPanel />
          </div>
        )}
      </div>
      <div style={statusBarStyle}>
        <StatusBar isMobile={isMobile} />
      </div>
      <ExportModal />
      <Toast />
    </div>
  )
}
