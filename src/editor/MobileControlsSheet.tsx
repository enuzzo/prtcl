import { useCallback, useRef } from 'react'
import { useStore } from '../store'
import { ControlPanel } from './ControlPanel'

interface MobileControlsSheetProps {
  onClose: () => void
}

export function MobileControlsSheet({ onClose }: MobileControlsSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const effectName = useStore((s) => s.selectedEffect?.name ?? 'No effect')

  const handleBackdropPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose()
    },
    [onClose],
  )

  return (
    <div
      ref={backdropRef}
      onPointerDown={handleBackdropPointerDown}
      className="fixed inset-0 top-12 z-[70] bg-black/40 backdrop-blur-sm"
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-hidden rounded-t-2xl border-t border-border bg-surface shadow-[0_-12px_36px_rgba(0,0,0,0.45)] animate-slideUp"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface/95">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">Controls</p>
            <p className="truncate text-sm font-mono text-text">{effectName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-border bg-elevated text-text-secondary text-xs font-mono"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(72vh-60px)] overflow-y-auto overscroll-contain">
          <ControlPanel mobile />
        </div>
      </div>
    </div>
  )
}
