import { useState, useMemo, useCallback } from 'react'
import type { Effect } from '../engine/types'

interface EffectBrowserProps {
  effects: Effect[]
  selectedId: string | null
  onSelect: (effect: Effect) => void
}

const CATEGORY_ORDER = ['organic', 'math', 'text', 'abstract'] as const
const CATEGORY_LABELS: Record<string, string> = {
  organic: 'Organic',
  math: 'Math',
  text: 'Text',
  abstract: 'Abstract',
}

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
            className="text-[10px] font-mono text-text-muted hover:text-accent uppercase tracking-wider transition-colors"
          >
            {allCollapsed ? '▸ Expand all' : '▾ Collapse all'}
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
            <div key={cat} className="mb-3">
              <button
                onClick={() => !isSearching && toggleCategory(cat)}
                className="flex items-center gap-1 w-full text-xs font-mono text-text-muted uppercase tracking-wider px-2 mb-1 hover:text-accent transition-colors"
              >
                <span className="text-[10px]">{isOpen ? '▾' : '▸'}</span>
                {CATEGORY_LABELS[cat]}
                <span className="ml-auto text-[10px] opacity-60">{items.length}</span>
              </button>
              {isOpen &&
                items.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => onSelect(effect)}
                    className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
                      selectedId === effect.id
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'text-text hover:bg-border/50 border border-transparent'
                    }`}
                  >
                    <div className="font-medium">{effect.name}</div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {effect.description}
                    </div>
                  </button>
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
