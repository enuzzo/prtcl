import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'

export function TopBar() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state when user presses ESC (browser exits fullscreen natively)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const trackingEnabled = useStore((s) => s.trackingEnabled)
  const trackingReady = useStore((s) => s.trackingReady)
  const trackingError = useStore((s) => s.trackingError)

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

  return (
    <div className="flex items-center justify-between h-12 px-4 bg-surface border-b border-border">
      <span className="font-mono text-accent font-bold tracking-wider">PRTCL</span>
      <div className="flex items-center gap-2">
        {/* Hand Tracking toggle — hidden on mobile */}
        <button
          onClick={toggleTracking}
          className={`px-3 py-1.5 rounded text-sm font-mono transition-colors hidden md:block ${
            trackingError
              ? 'bg-danger/10 text-danger border border-danger/30'
              : trackingEnabled
                ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                : 'bg-elevated text-text-muted border border-transparent hover:bg-border/50'
          } ${trackingEnabled && !trackingReady ? 'animate-pulse' : ''}`}
          title={
            trackingError
              ?? (trackingEnabled && !trackingReady
                ? 'Loading hand tracking...'
                : trackingEnabled
                  ? 'Hand tracking ON'
                  : 'Enable hand tracking')
          }
        >
          {'\u270B'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
        <button className="px-4 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded text-sm font-mono hover:bg-accent2/20 transition-colors">
          Export
        </button>
      </div>
    </div>
  )
}
