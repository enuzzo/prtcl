import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { ExportPreview } from './ExportPreview'
import { ExportSettingsPanel } from './ExportSettings'
import { WebsiteEmbedTab } from './tabs/WebsiteEmbedTab'
import { ReactTab } from './tabs/ReactTab'
import { IframeTab } from './tabs/IframeTab'
import { CodeXmlIcon, ReactIcon, AppWindowIcon } from './icons'
import type { ExportMode, ExportSettings, ExportPayload } from './types'

const TABS: { mode: ExportMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'website', label: 'Website Embed', icon: <CodeXmlIcon size={14} /> },
  { mode: 'react', label: 'React Component', icon: <ReactIcon size={14} /> },
  { mode: 'iframe', label: '<iframe>', icon: <AppWindowIcon size={14} /> },
]

export function ExportModal() {
  const isOpen = useStore((s) => s.exportModalOpen)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const compiledFn = useStore((s) => s.compiledFn)
  const controls = useStore((s) => s.controls)
  const particleCount = useStore((s) => s.particleCount)
  const pointSize = useStore((s) => s.pointSize)
  const backgroundColor = useStore((s) => s.backgroundColor)
  const autoRotateSpeed = useStore((s) => s.autoRotateSpeed)
  const textPoints = useStore((s) => s.textPoints)

  const [activeTab, setActiveTab] = useState<ExportMode>('website')
  const [settings, setSettings] = useState<ExportSettings>({
    particleCount: 15000,
    pointSize: 4.0,
    height: '400px',
    backgroundColor: '#08040E',
    autoRotateSpeed: 0,
    orbitControls: true,
    pointerReactive: false,
    showBadge: true,
  })

  // Detect pointer usage in effect code — must be declared BEFORE the useEffect that uses it
  const effectUsesPointer = useMemo(() => {
    if (!selectedEffect?.code) return false
    return /pointer[XYZ]/i.test(selectedEffect.code)
  }, [selectedEffect?.code])

  // Sync settings from editor state when modal opens
  useEffect(() => {
    if (!isOpen) return
    const cam = getCameraSnapshot()
    setSettings({
      particleCount,
      pointSize,
      height: '400px',
      backgroundColor,
      autoRotateSpeed,
      orbitControls: true,
      pointerReactive: effectUsesPointer,
      showBadge: true,
    })
    // Also reset active tab
    setActiveTab('website')
    // Store camera snapshot for later use — handled by payload memo
    void cam
  }, [isOpen, particleCount, pointSize, backgroundColor, autoRotateSpeed, effectUsesPointer])

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useStore.getState().setExportModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const close = useCallback(() => {
    useStore.getState().setExportModalOpen(false)
  }, [])

  // Build baked control values map
  const controlValues = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of controls) {
      map[c.id] = c.value
    }
    return map
  }, [controls])

  // Camera snapshot — captured fresh each time modal opens
  const cameraSnap = useMemo(() => {
    if (!isOpen) return { position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
    const snap = getCameraSnapshot()
    return snap ?? { position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
  }, [isOpen])

  // Stable payload object for tab components
  const payload: ExportPayload | null = useMemo(() => {
    if (!selectedEffect) return null
    return {
      effect: selectedEffect,
      controls: controlValues,
      cameraPosition: cameraSnap.position,
      cameraTarget: cameraSnap.target,
      settings,
      textPoints: selectedEffect.category === 'text' ? textPoints : undefined,
    }
  }, [selectedEffect, controlValues, cameraSnap, settings, textPoints])

  if (!isOpen || !selectedEffect) return null

  const TabComponent = activeTab === 'website' ? WebsiteEmbedTab
    : activeTab === 'react' ? ReactTab
    : IframeTab

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div
        className="relative bg-surface border border-border rounded-xl w-full max-w-[1100px] h-[80vh] max-h-[700px] mx-4 flex flex-col overflow-hidden"
        style={{ animation: 'fadeInScale 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 id="export-modal-title" className="text-lg font-mono font-bold text-text">
            Export <span className="text-accent">{selectedEffect.name}</span>
          </h2>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-elevated transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 py-2 border-b border-border shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setActiveTab(tab.mode)}
              className={`px-4 py-1.5 rounded text-sm font-mono transition-colors ${
                activeTab === tab.mode
                  ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                  : 'text-text-muted hover:text-text hover:bg-elevated border border-transparent'
              }`}
            >
              <span className="flex items-center gap-1.5">{tab.icon} {tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body — split layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Preview + Settings */}
          <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
            <ExportPreview
              compiledFn={compiledFn}
              controls={controlValues}
              particleCount={settings.particleCount}
              pointSize={settings.pointSize}
              backgroundColor={settings.backgroundColor}
              autoRotateSpeed={settings.autoRotateSpeed}
              cameraPosition={cameraSnap.position}
              cameraTarget={cameraSnap.target}
              textPoints={selectedEffect.category === 'text' ? textPoints : undefined}
            />
            <ExportSettingsPanel
              settings={settings}
              onChange={setSettings}
              mode={activeTab}
              effectUsesPointer={effectUsesPointer}
            />
          </div>

          {/* Right: Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {payload && <TabComponent payload={payload} />}
          </div>
        </div>
      </div>
    </div>
  )
}
