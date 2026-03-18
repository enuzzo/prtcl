import { useState, useMemo, useCallback } from 'react'
import type { Effect } from '../engine/types'

interface EffectBrowserProps {
  effects: Effect[]
  selectedId: string | null
  onSelect: (effect: Effect) => void
}

const CATEGORY_ORDER = ['organic', 'math', 'creature', 'text', 'abstract'] as const
const CATEGORY_LABELS: Record<string, string> = {
  organic: 'Organic',
  math: 'Math',
  creature: 'Creature',
  text: 'Text',
  abstract: 'Abstract',
}

/** Effects that use audio params (bass/mids/highs/energy/beat) */
const AUDIO_EFFECTS = new Set(['frequency', 'fibonacci-crystal', 'nebula-organica'])

export function EffectBrowser({ effects, selectedId, onSelect }: EffectBrowserProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const allCollapsed = collapsed.size >= CATEGORY_ORDER.length
  const toggleAll = useCallback(() => {
    if (allCollapsed) {
      setCollapsed(new Set())
    } else {
      setCollapsed(new Set(CATEGORY_ORDER))
    }
  }, [allCollapsed])

  const toggleCategory = useCallback((cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Filter + group — instant as you type
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

  // When searching, auto-expand all groups
  const isSearching = query.trim().length > 0

  return (
    <div className="w-[280px] bg-surface border-r border-border flex flex-col overflow-hidden">
      {/* Search + collapse controls */}
      <div className="p-3 border-b border-border space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search effects..."
          className="w-full px-3 py-1.5 bg-bg border border-border rounded text-sm text-text placeholder:text-text-muted font-mono focus:outline-none focus:border-accent/50"
        />
        {!isSearching && (
          <button
            onClick={toggleAll}
            className="text-[10px] font-mono text-text-muted hover:text-accent2 uppercase tracking-wider transition-colors"
          >
            {allCollapsed ? <><span className="text-accent2">▸</span> Expand all</> : <><span className="text-accent2">▾</span> Collapse all</>}
          </button>
        )}
      </div>

      {/* Effect list */}
      <div className="flex-1 overflow-y-auto p-2">
        {!hasResults && (
          <div className="text-xs font-mono text-text-muted px-2 py-4 text-center">
            No effects match "{query}"
          </div>
        )}
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat)
          if (!items || items.length === 0) return null
          const isOpen = isSearching || !collapsed.has(cat)
          return (
            <div
              key={cat}
              className="mb-3 rounded-lg bg-elevated/40 border border-border/50 overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => !isSearching && toggleCategory(cat)}
                className="flex items-center gap-1.5 w-full text-[10px] font-mono text-accent uppercase tracking-widest px-3 py-2 hover:bg-elevated/60 transition-colors"
              >
                <span className="text-accent2">{isOpen ? '▾' : '▸'}</span>
                {CATEGORY_LABELS[cat]}
                <span className="ml-auto text-[10px] text-text-muted opacity-60">{items.length}</span>
              </button>
              {/* Effect list inside card */}
              {isOpen && (
                <div className="px-1.5 pb-1.5">
                  {items.map((effect) => {
                    const isSelected = selectedId === effect.id
                    return (
                      <button
                        key={effect.id}
                        onClick={() => onSelect(effect)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm font-mono transition-colors ${
                          isSelected
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'text-text hover:bg-border/40 border border-transparent'
                        }`}
                      >
                        <div className="font-medium flex items-center justify-between gap-1">
                          <span>{effect.name}</span>
                          {AUDIO_EFFECTS.has(effect.id) && (
                            <span className="text-[10px] opacity-50 shrink-0" title="Audio reactive">🎙️</span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-xs text-text-muted mt-0.5">
                            {effect.description}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
