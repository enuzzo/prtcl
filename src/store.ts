import { create } from 'zustand'
import type { Effect, CompiledEffectFn, Control } from './engine/types'
import type { TrackingSlice } from './tracking/types'
import type { AudioSlice } from './audio/types'

export interface PrtclState extends TrackingSlice, AudioSlice {
  // Effect state
  selectedEffect: Effect | null
  compiledFn: CompiledEffectFn | null
  controls: Control[]
  info: { title: string; description: string }

  // Settings
  particleCount: number
  pointSize: number
  backgroundColor: string
  bloomEnabled: boolean

  // Camera
  autoRotateSpeed: number
  cameraZoom: number
  baseZoomDistance: number
  /** Set once when effect loads; CameraSync applies it then clears */
  pendingCameraPosition: [number, number, number] | null
  pendingCameraTarget: [number, number, number] | null

  // Panel visibility
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  isFullscreen: boolean

  // Export
  exportModalOpen: boolean

  // Performance (throttled — updated at most once per second)
  fps: number
  actualParticleCount: number

  // Actions: effect
  setSelectedEffect: (effect: Effect | null) => void
  setCompiledFn: (fn: CompiledEffectFn | null) => void
  setControls: (controls: Control[]) => void
  updateControlValue: (id: string, value: number) => void
  setInfo: (info: { title: string; description: string }) => void

  // Actions: settings
  setParticleCount: (count: number) => void
  setPointSize: (size: number) => void
  setBackgroundColor: (color: string) => void
  setBloomEnabled: (enabled: boolean) => void

  // Actions: camera
  setAutoRotateSpeed: (speed: number) => void
  setCameraZoom: (zoom: number) => void
  setBaseZoomDistance: (dist: number) => void
  setCameraPosition: (pos: [number, number, number] | null) => void
  setCameraTarget: (target: [number, number, number] | null) => void

  // Actions: panels
  setLeftPanelOpen: (open: boolean) => void
  setRightPanelOpen: (open: boolean) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setIsFullscreen: (fs: boolean) => void
  setExportModalOpen: (open: boolean) => void

  // Actions: performance (throttled internally)
  setFps: (fps: number) => void
  setActualParticleCount: (count: number) => void
}

/** Module-level timestamp for throttling perf updates to once per second */
let _lastPerfUpdate = 0

/** Pending particle count to flush alongside the next fps update */
let _pendingParticleCount: number | null = null

export const useStore = create<PrtclState>((set) => ({
  // Effect state
  selectedEffect: null,
  compiledFn: null,
  controls: [],
  info: { title: '', description: '' },

  // Settings
  particleCount: 15000,
  pointSize: 4.0,
  backgroundColor: '#08040E',
  bloomEnabled: false,

  // Camera
  autoRotateSpeed: 0,
  cameraZoom: 1,
  baseZoomDistance: 5,
  pendingCameraPosition: null,
  pendingCameraTarget: null,

  // Panel visibility
  leftPanelOpen: true,
  rightPanelOpen: true,
  isFullscreen: false,

  // Export
  exportModalOpen: false,

  // Performance
  fps: 0,
  actualParticleCount: 0,

  // Actions: effect
  setSelectedEffect: (effect) => set({ selectedEffect: effect }),
  setCompiledFn: (fn) => set({ compiledFn: fn }),
  setControls: (controls) => set({ controls }),
  updateControlValue: (id, value) =>
    set((state) => ({
      controls: state.controls.map((c) =>
        c.id === id ? { ...c, value } : c,
      ),
    })),
  setInfo: (info) => set({ info }),

  // Actions: settings
  setParticleCount: (count) => set({ particleCount: count }),
  setPointSize: (size) => set({ pointSize: size }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),

  // Actions: camera
  setAutoRotateSpeed: (speed) => set({ autoRotateSpeed: speed }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
  setBaseZoomDistance: (dist) => set({ baseZoomDistance: dist }),
  setCameraPosition: (pos) => set({ pendingCameraPosition: pos }),
  setCameraTarget: (target) => set({ pendingCameraTarget: target }),

  // Actions: panels
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setIsFullscreen: (fs) => set({ isFullscreen: fs }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),

  // ── Tracking ──────────────────────────────────────────
  trackingEnabled: false,
  trackingReady: false,
  trackingError: null,
  gesture: 'none',
  palmPosition: null,
  handSize: 0,
  confidence: 0,
  landmarks: null,

  setTrackingEnabled: (on) => set({ trackingEnabled: on }),
  setTrackingReady: (ready) => set({ trackingReady: ready }),
  setTrackingError: (error) => set({ trackingError: error }),
  updateHandState: (state) => set(state),

  // ── Audio ───────────────────────────────────────────────
  audioEnabled: false,
  audioReady: false,
  audioError: null,
  bassBand: 0,
  midsBand: 0,
  highsBand: 0,
  energy: 0,
  beat: 0,

  setAudioEnabled: (on) => set({ audioEnabled: on }),
  setAudioReady: (ready) => set({ audioReady: ready }),
  setAudioError: (error) => set({ audioError: error }),
  updateAudioData: (data) => set(data),

  // Actions: performance (throttled to once per second, batched together)
  setFps: (fps) => {
    const now = Date.now()
    if (now - _lastPerfUpdate < 1000) {
      _pendingParticleCount = null
      return
    }
    _lastPerfUpdate = now
    const update: Partial<PrtclState> = { fps }
    if (_pendingParticleCount !== null) {
      update.actualParticleCount = _pendingParticleCount
      _pendingParticleCount = null
    }
    set(update)
  },
  setActualParticleCount: (count) => {
    _pendingParticleCount = count
  },
}))
