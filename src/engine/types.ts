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
  category: 'organic' | 'math' | 'text' | 'abstract'
  particleCount: number
  pointSize?: number
  cameraDistance: number
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
  autoRotateSpeed?: number
  cameraZoom?: number
  createdAt: string
  controls?: Record<string, number>
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
) => void

export interface CompiledEffect {
  fn: CompiledEffectFn
  controls: Control[]
  info: { title: string; description: string }
}
