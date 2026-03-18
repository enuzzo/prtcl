import type { Vector3, Color } from 'three'

/** The full THREE namespace, passed into effects at runtime */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ThreeLib = typeof import('three')

export interface EffectContext {
  i: number
  count: number
  target: Vector3
  color: Color
  time: number
  THREE: ThreeLib
  addControl: (id: string, label: string, min: number, max: number, initial: number) => number
  setInfo: (title: string, description: string) => void
  annotate?: (id: string, position: Vector3, label: string) => void
  textPoints?: Float32Array
  camX?: number
  camY?: number
  camZ?: number
  /** Pointer world-space X (raycasted onto camera target plane). 0 when no pointer. */
  pointerX?: number
  /** Pointer world-space Y (raycasted onto camera target plane). 0 when no pointer. */
  pointerY?: number
  /** Pointer world-space Z. 0 for now. */
  pointerZ?: number
  /** Bass frequency band (20-250 Hz), normalized 0-1. 0 when mic off. */
  bass?: number
  /** Mid frequency band (250-2000 Hz), normalized 0-1. 0 when mic off. */
  mids?: number
  /** High frequency band (2000-20000 Hz), normalized 0-1. 0 when mic off. */
  highs?: number
  /** Average energy across all bands, normalized 0-1. 0 when mic off. */
  energy?: number
  /** Beat onset detector: 1.0 on beat, decays to 0.0 over ~100ms. 0 when mic off. */
  beat?: number
}

export interface Control {
  id: string
  label: string
  min: number
  max: number
  initial: number
  value: number
}

export interface Effect {
  id: string
  slug: string
  name: string
  description: string
  author: string
  code: string
  tags: string[]
  category: 'organic' | 'math' | 'creature' | 'text' | 'abstract'
  particleCount: number
  pointSize?: number
  cameraDistance: number
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
  autoRotateSpeed?: number
  cameraZoom?: number
  createdAt: string
  controls?: Record<string, number>
  /** 'particles' (default) uses ParticleSystem, 'custom' uses a standalone R3F component */
  renderer?: 'particles' | 'custom'
  /** For custom renderers: which component to mount (e.g. 'paper-fleet') */
  customRenderer?: string
}

export type CompiledEffectFn = (
  i: number,
  count: number,
  target: Vector3,
  color: Color,
  time: number,
  THREE: ThreeLib,
  getControl: (id: string) => number,
  setInfo: (title: string, description: string) => void,
  textPoints?: Float32Array,
  camX?: number,
  camY?: number,
  camZ?: number,
  pointerX?: number,
  pointerY?: number,
  pointerZ?: number,
  bass?: number,
  mids?: number,
  highs?: number,
  energy?: number,
  beat?: number,
) => void

export interface CompiledEffect {
  fn: CompiledEffectFn
  controls: Control[]
  info: { title: string; description: string }
}
