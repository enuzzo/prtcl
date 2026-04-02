import { useState, useMemo, useCallback, useRef } from 'react'
import type { Effect } from '../engine/types'

const CATEGORY_ORDER = ['organic', 'math', 'creature', 'text', 'abstract'] as const
const CATEGORY_LABELS: Record<string, string> = {
  organic: 'Organic',
  math: 'Math',
  creature: 'Creature',
  text: 'Text',
  abstract: 'Abstract',
}

interface MobileEffectDropdownProps {
  effects: Effect[]
  selectedId: string | null
  onSelect: (effect: Effect) => void
  onClose: () => void
}

export function MobileEffectDropdown({
  effects,
  selectedId,
  onSelect,
  onClose,
}: MobileEffectDropdownProps) {
  const [query, setQuery] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  // Tap outside the dropdown panel to close
  const handleBackdropClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose()
    },
    [onClose],
  )

  // Filter + group
  const { grouped, hasResults } = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = q
      ? effects.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : effects

    const map = new Map<string, Effect[]>()
    for (const effect of filtered) {
      const list = map.get(effect.category) ?? []
      list.push(effect)
      map.set(effect.category, list)
    }
    return { grouped: map, hasResults: filtered.length > 0 }
  }, [effects, query])

  const handleSelect = useCallback(
    (effect: Effect) => {
      onSelect(effect)
      onClose()
    },
    [onSelect, onClose],
  )

  return (
    <div
      ref={backdropRef}
      onPointerDown={handleBackdropClick}
      className="fixed inset-0 top-12 z-[70] bg-black/40 backdrop-blur-sm"
      style={{ top: '48px' }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-surface border-b border-border max-h-[72vh] overflow-hidden flex flex-col animate-slideDown shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">Effects</p>
            <p className="text-sm font-mono text-text">Choose the next mess</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-border bg-elevated text-text-secondary text-xs font-mono"
          >
            Close
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search effects..."
            className="w-full px-3 py-2 bg-bg border border-border rounded text-sm text-text placeholder:text-text-muted font-mono focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Effect list */}
        <div className="flex-1 overflow-y-auto p-2 overscroll-contain">
          {!hasResults && (
            <div className="text-xs font-mono text-text-muted px-2 py-4 text-center">
              No effects match &ldquo;{query}&rdquo;
            </div>
          )}
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items || items.length === 0) return null
            return (
              <div key={cat} className="mb-2">
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider px-2 mb-1">
                  {CATEGORY_LABELS[cat]}
                </div>
                {items.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => handleSelect(effect)}
                    className={`w-full text-left px-3 py-2.5 rounded text-sm font-mono transition-colors ${
                      selectedId === effect.id
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'text-text hover:bg-border/50 border border-transparent active:bg-elevated'
                    }`}
                  >
                    <div className="font-medium">{effect.name}</div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
