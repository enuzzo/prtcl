import { create } from 'zustand'
import type { Effect, CompiledEffectFn, Control } from './engine/types'

export interface PrtclState {
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

  // Actions: performance (throttled internally)
  setFps: (fps: number) => void
  setActualParticleCount: (count: number) => void
}

/** Module-level timestamp for throttling perf updates to once per second */
let _lastPerfUpdate = 0

export const useStore = create<PrtclState>((set) => ({
  // Effect state
  selectedEffect: null,
  compiledFn: null,
  controls: [],
  info: { title: '', description: '' },

  // Settings
  particleCount: 15000,
  pointSize: 4.0,
  backgroundColor: '#050510',
  bloomEnabled: false,

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

  // Actions: performance (throttled to once per second)
  setFps: (fps) => {
    const now = Date.now()
    if (now - _lastPerfUpdate < 1000) return
    _lastPerfUpdate = now
    set({ fps })
  },
  setActualParticleCount: (count) => {
    const now = Date.now()
    if (now - _lastPerfUpdate < 1000) return
    _lastPerfUpdate = now
    set({ actualParticleCount: count })
  },
}))
