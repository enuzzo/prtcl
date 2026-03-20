/** Decoded share state from URL hash. All fields optional except effect. */
export interface ShareState {
  effect: string                            // Effect ID (required)
  p?: number                                // particleCount
  ps?: number                               // pointSize
  ar?: number                               // autoRotateSpeed
  z?: number                                // cameraZoom
  cam?: [number, number, number]            // cameraPosition
  tgt?: [number, number, number]            // cameraTarget
  bg?: string                               // backgroundPreset ID
  bgc?: string                              // custom background color (hex, no #)
  c?: Record<string, number>                // control values { id: value }
  txt?: string                              // textInput
  font?: string                             // textFont
  w?: string                                // textWeight
  ls?: number                               // textLineSpacing
}
