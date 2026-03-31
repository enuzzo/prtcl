import { useState } from 'react'
import { useStore } from '../store'
import { BACKGROUND_PRESETS } from './background-presets'

export function BackgroundPicker() {
  const backgroundPreset = useStore((s) => s.backgroundPreset)
  const setBackgroundPreset = useStore((s) => s.setBackgroundPreset)
  const [expanded, setExpanded] = useState(true)

  const activeName = BACKGROUND_PRESETS.find((p) => p.id === backgroundPreset)?.name ?? backgroundPreset

  return (
    <div className="mx-2 mt-2 mb-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider text-text-secondary hover:text-text transition-colors"
        style={{ background: 'var(--tp-base-background-color, transparent)' }}
      >
        <span
          className="transition-transform text-[8px]"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        Background
        <span className="ml-auto text-[9px] text-text-muted normal-case tracking-normal">{activeName}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2 pt-1.5 space-y-2">
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setBackgroundPreset(p.id)}
                title={p.name}
                className={`w-14 h-14 rounded-lg border-2 transition-all hover:scale-105 ${
                  backgroundPreset === p.id
                    ? 'border-accent ring-1 ring-accent/40'
                    : 'border-border/50 hover:border-text-muted/40'
                }`}
                style={{ background: p.css }}
              />
            ))}
          </div>
          <p className="text-[9px] text-text-muted/60 italic leading-tight">
            Need transparency? Export has you covered. Your particles, their background. We don&apos;t judge.
          </p>
        </div>
      )}
    </div>
  )
}
