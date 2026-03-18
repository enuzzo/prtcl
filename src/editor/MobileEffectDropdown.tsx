import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  // Tap outside the dropdown panel to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
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
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      style={{ top: '48px' }}
    >
      <div className="bg-surface border-b border-border max-h-[50vh] overflow-hidden flex flex-col animate-slideDown">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <input
            ref={inputRef}
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
