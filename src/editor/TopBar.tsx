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
  const audioEnabled = useStore((s) => s.audioEnabled)
  const audioReady = useStore((s) => s.audioReady)
  const audioError = useStore((s) => s.audioError)
  const bassBand = useStore((s) => s.bassBand)
  const midsBand = useStore((s) => s.midsBand)
  const highsBand = useStore((s) => s.highsBand)
  const selectedEffect = useStore((s) => s.selectedEffect)

  const toggleAudio = useCallback(() => {
    if (audioError) {
      useStore.getState().setAudioError(null)
    }
    useStore.getState().setAudioEnabled(!audioEnabled)
  }, [audioEnabled, audioError])

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
          {/* Audio mic toggle + expanding bars */}
          <div className="flex items-center">
            {/* Expanding frequency bars — grow left from mic button */}
            <div
              className="flex items-end gap-[2px] overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                width: audioEnabled && audioReady && !isMobile ? '40px' : '0px',
                marginRight: audioEnabled && audioReady && !isMobile ? '6px' : '0px',
                opacity: audioEnabled && audioReady ? 1 : 0,
              }}
            >
              {[
                bassBand,
                (bassBand + midsBand) / 2,
                midsBand,
                (midsBand + highsBand) / 2,
                highsBand,
              ].map((v, idx) => (
                <div
                  key={idx}
                  className="w-[4px] rounded-sm"
                  style={{
                    height: `${Math.max(2, v * 16)}px`,
                    backgroundColor: `rgba(255, 43, 214, ${0.4 + v * 0.6})`,
                    transition: 'height 50ms ease-out',
                  }}
                />
              ))}
            </div>

            {/* Mic button */}
            <button
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded text-sm font-mono transition-colors ${
                audioError
                  ? 'bg-danger/10 text-danger border border-danger/30'
                  : audioEnabled
                    ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                    : 'bg-elevated text-text-muted border border-transparent hover:bg-border/50'
              } ${audioEnabled && !audioReady ? 'animate-pulse' : ''}`}
              title={
                audioError
                  ?? (audioEnabled && !audioReady
                    ? 'Requesting mic...'
                    : audioEnabled
                      ? 'Mic ON — click to mute'
                      : 'React to sound')
              }
            >
              🎙️
            </button>
          </div>

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
