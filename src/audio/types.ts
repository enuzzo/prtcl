export interface AudioSlice {
  // State
  audioEnabled: boolean
  audioReady: boolean
  audioError: string | null
  bassBand: number
  midsBand: number
  highsBand: number
  energy: number
  beat: number

  // Actions
  setAudioEnabled: (on: boolean) => void
  setAudioReady: (ready: boolean) => void
  setAudioError: (error: string | null) => void
  updateAudioData: (data: {
    bassBand: number
    midsBand: number
    highsBand: number
    energy: number
    beat: number
  }) => void
}
