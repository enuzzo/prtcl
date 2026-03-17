import { useCallback, useEffect, useState } from 'react'

export function TopBar() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state when user presses ESC (browser exits fullscreen natively)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

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
