import { useCallback, useEffect, useState } from 'react'
// Note: fullscreen state is managed in the Zustand store (shared with EditorLayout for panel auto-collapse)
import { useStore } from '../store'
import { VERSION, CODENAME } from '../version'
import { MobileEffectDropdown } from './MobileEffectDropdown'
import { ALL_PRESETS } from '../effects/presets'
import type { Effect } from '../engine/types'

interface TopBarProps {
  isMobile: boolean
  onSelectEffect: (effect: Effect) => void
}

export function TopBar({ isMobile, onSelectEffect }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
      setDropdownOpen(false)
    },
    [onSelectEffect],
  )

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
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-mono text-text hover:bg-elevated transition-colors max-w-[45vw] truncate"
          >
            <span className="truncate">{selectedEffect?.name ?? 'Select'}</span>
            <span className={`text-[10px] text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Hand Tracking toggle */}
          <button
            onClick={toggleTracking}
            className={`px-3 py-1.5 rounded text-sm font-mono transition-colors ${
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
          >
            {'\u270B'}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>

          {/* Export — desktop only */}
          {!isMobile && (
            <button className="px-4 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded text-sm font-mono hover:bg-accent2/20 transition-colors">
              Export
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown overlay */}
      {isMobile && dropdownOpen && (
        <MobileEffectDropdown
          effects={ALL_PRESETS}
          selectedId={selectedEffect?.id ?? null}
          onSelect={handleMobileSelect}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </>
  )
}
