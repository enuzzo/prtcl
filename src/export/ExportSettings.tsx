import type { ExportSettings as ExportSettingsType, ExportMode } from './types'

interface ExportSettingsProps {
  settings: ExportSettingsType
  onChange: (settings: ExportSettingsType) => void
  mode: ExportMode
  effectUsesPointer: boolean
}

const HEIGHT_OPTIONS = ['300px', '400px', '500px', '600px', '100vh']

export function ExportSettingsPanel({ settings, onChange, mode, effectUsesPointer }: ExportSettingsProps) {
  const update = <K extends keyof ExportSettingsType>(key: K, value: ExportSettingsType[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4 text-sm font-mono">
      <h3 className="text-text-secondary uppercase tracking-wider text-xs">Settings</h3>

      {/* Particle Count */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Particles</span>
          <span className="text-text">{settings.particleCount.toLocaleString()}</span>
        </label>
        <input type="range" min={1000} max={20000} step={500}
          value={settings.particleCount}
          onChange={(e) => update('particleCount', parseInt(e.target.value))}
          className="w-full accent-accent2" />
      </div>

      {/* Point Size */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Point Size</span>
          <span className="text-text">{settings.pointSize}</span>
        </label>
        <input type="range" min={0.2} max={8.0} step={0.1}
          value={settings.pointSize}
          onChange={(e) => update('pointSize', parseFloat(e.target.value))}
          className="w-full accent-accent2" />
      </div>

      {/* Height — only for Website Embed */}
      {mode === 'website' && (
        <div>
          <label className="block text-text-secondary mb-1">Height</label>
          <select value={settings.height}
            onChange={(e) => update('height', e.target.value)}
            className="w-full bg-elevated border border-border rounded px-2 py-1.5 text-text">
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h} value={h}>{h === '100vh' ? 'Full viewport' : h}</option>
            ))}
          </select>
        </div>
      )}

      {/* Background */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Background</span>
          <span className="text-text">{settings.backgroundColor}</span>
        </label>
        <input type="color" value={settings.backgroundColor}
          onChange={(e) => update('backgroundColor', e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer" />
      </div>

      {/* Auto-rotate */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Auto-rotate</span>
          <span className="text-text">{settings.autoRotateSpeed || 'Off'}</span>
        </label>
        <input type="range" min={0} max={5} step={0.1}
          value={settings.autoRotateSpeed}
          onChange={(e) => update('autoRotateSpeed', parseFloat(e.target.value))}
          className="w-full accent-accent2" />
      </div>

      {/* Toggles */}
      <Toggle label="Orbit controls" checked={settings.orbitControls} onChange={(v) => update('orbitControls', v)} />
      {effectUsesPointer && (
        <Toggle label="Pointer reactive" checked={settings.pointerReactive} onChange={(v) => update('pointerReactive', v)} />
      )}
      <Toggle label="PRTCL badge" checked={settings.showBadge} onChange={(v) => update('showBadge', v)} />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-text-secondary">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-accent2' : 'bg-elevated border border-border'}`}
      >
        <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}
