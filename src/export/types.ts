import type { Effect } from '../engine/types'

export type ExportMode = 'website' | 'react' | 'iframe'

export interface ExportSettings {
  particleCount: number
  pointSize: number
  height: string           // '400px', '500px', '100vh', etc.
  backgroundColor: string  // hex e.g. '#08040E'
  autoRotateSpeed: number  // 0 = off
  orbitControls: boolean
  pointerReactive: boolean
  showBadge: boolean
}

/** Everything a generator needs to produce output */
export interface ExportPayload {
  effect: Effect
  controls: Record<string, number>  // baked control values
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  settings: ExportSettings
}
