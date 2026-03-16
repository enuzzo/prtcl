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
  // Group effects by category
  const grouped = new Map<string, Effect[]>()
  for (const effect of effects) {
    const list = grouped.get(effect.category) ?? []
    list.push(effect)
    grouped.set(effect.category, list)
  }

  return (
    <div className="w-[280px] bg-surface border-r border-border flex flex-col overflow-hidden">
      {/* Search input (visual only for now) */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search effects..."
          className="w-full px-3 py-1.5 bg-bg border border-border rounded text-sm text-text placeholder:text-text-muted font-mono focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Effect list */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat)
          if (!items || items.length === 0) return null
          return (
            <div key={cat} className="mb-4">
              <div className="text-xs font-mono text-text-muted uppercase tracking-wider px-2 mb-1">
                {CATEGORY_LABELS[cat]}
              </div>
              {items.map((effect) => (
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
