import { useState, useRef } from 'react'
import { useStore } from '../store'
import { BACKGROUND_PRESETS } from './background-presets'

const SOLIDS = BACKGROUND_PRESETS.filter((p) => p.category === 'solid')
const GRADIENTS = BACKGROUND_PRESETS.filter((p) => p.category === 'gradient')
const PATTERNS = BACKGROUND_PRESETS.filter((p) => p.category === 'pattern')

export function BackgroundPicker() {
  const backgroundPreset = useStore((s) => s.backgroundPreset)
  const backgroundColor = useStore((s) => s.backgroundColor)
  const setBackgroundPreset = useStore((s) => s.setBackgroundPreset)
  const setBackgroundColor = useStore((s) => s.setBackgroundColor)
  const [expanded, setExpanded] = useState(true)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const isCustom = !BACKGROUND_PRESETS.some((p) => p.id === backgroundPreset)

  const activeName = isCustom
    ? backgroundColor
    : BACKGROUND_PRESETS.find((p) => p.id === backgroundPreset)?.name ?? backgroundPreset

  function Swatch({ id, name, css }: { id: string; name: string; css: string }) {
    return (
      <button
        onClick={() => setBackgroundPreset(id)}
        title={name}
        className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
          backgroundPreset === id
            ? 'border-accent ring-1 ring-accent/40'
            : 'border-border/50 hover:border-text-muted/40'
        }`}
        style={{ background: css }}
      />
    )
  }

  return (
    <div className="mx-2 mt-2 mb-0.5">
      {/* Folder header — styled like Tweakpane folder */}
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
        <div className="px-2 pb-2 pt-1 space-y-2">
          {/* Solids */}
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Solid</div>
            <div className="flex flex-wrap gap-1.5">
              {SOLIDS.map((p) => <Swatch key={p.id} id={p.id} name={p.name} css={p.css} />)}
              {/* Custom color picker */}
              <button
                onClick={() => colorInputRef.current?.click()}
                title="Custom color"
                className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 relative overflow-hidden ${
                  isCustom
                    ? 'border-accent ring-1 ring-accent/40'
                    : 'border-border/50 hover:border-text-muted/40'
                }`}
                style={{ background: isCustom ? backgroundColor : '#08040E' }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-white/60 text-xs font-bold">
                  +
                </span>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={backgroundColor.startsWith('#') ? backgroundColor : '#08040E'}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value)
                    useStore.setState({ backgroundPreset: 'custom' })
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  tabIndex={-1}
                />
              </button>
            </div>
          </div>

          {/* Gradients */}
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Gradient</div>
            <div className="flex flex-wrap gap-1.5">
              {GRADIENTS.map((p) => <Swatch key={p.id} id={p.id} name={p.name} css={p.css} />)}
            </div>
          </div>

          {/* Patterns */}
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Pattern</div>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => <Swatch key={p.id} id={p.id} name={p.name} css={p.css} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
