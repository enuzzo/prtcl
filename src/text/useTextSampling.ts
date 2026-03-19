import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { sampleText } from './sampler'
import { waitForFont, ensureFontsInjected } from './font-loader'

export function useTextSampling(): void {
  const textInput = useStore((s) => s.textInput)
  const textFont = useStore((s) => s.textFont)
  const textWeight = useStore((s) => s.textWeight)
  const textLineSpacing = useStore((s) => s.textLineSpacing)
  const particleCount = useStore((s) => s.particleCount)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isTextEffect = selectedEffect?.category === 'text'

  useEffect(() => {
    // Clear textPoints when switching away from text effects
    if (!isTextEffect) {
      useStore.getState().setTextPoints(null)
      return
    }

    // Debounce sampling
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      // Ensure fonts are loading
      ensureFontsInjected()
      await waitForFont(textFont, textWeight)
      useStore.getState().setTextFontsLoaded(true)

      // Sample and store
      const points = sampleText(textInput, textFont, textWeight, particleCount, textLineSpacing)
      useStore.getState().setTextPoints(points)
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [isTextEffect, textInput, textFont, textWeight, textLineSpacing, particleCount])
}
