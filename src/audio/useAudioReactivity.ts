import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { computeBands, BeatDetector } from './analyser'

export function useAudioReactivity(): void {
  const audioEnabled = useStore((s) => s.audioEnabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const dataRef = useRef<Uint8Array | null>(null)
  const beatDetectorRef = useRef(new BeatDetector())

  useEffect(() => {
    if (!audioEnabled) {
      // Cleanup
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (ctxRef.current) {
        ctxRef.current.close()
        ctxRef.current = null
      }
      analyserRef.current = null
      dataRef.current = null
      beatDetectorRef.current.reset()

      const s = useStore.getState()
      s.setAudioReady(false)
      s.updateAudioData({ bassBand: 0, midsBand: 0, highsBand: 0, energy: 0, beat: 0 })
      return
    }

    // Init
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream

        const ctx = new AudioContext()
        ctxRef.current = ctx

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount // 512
        const data = new Uint8Array(bufferLength)
        dataRef.current = data

        useStore.getState().setAudioReady(true)
        useStore.getState().setAudioError(null)

        // Analysis loop
        function loop() {
          if (cancelled) return
          rafRef.current = requestAnimationFrame(loop)

          analyser.getByteFrequencyData(data)
          const bands = computeBands(data, bufferLength)
          const beat = beatDetectorRef.current.detect(bands.bassBand, performance.now())

          useStore.getState().updateAudioData({
            bassBand: bands.bassBand,
            midsBand: bands.midsBand,
            highsBand: bands.highsBand,
            energy: bands.energy,
            beat,
          })
        }
        loop()
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No microphone found'
            : `Microphone error: ${(err as Error).message}`
        useStore.getState().setAudioError(msg)
        useStore.getState().setAudioEnabled(false)
      }
    }

    start()

    // Tab visibility: suspend/resume AudioContext
    function onVisibility() {
      const ctx = ctxRef.current
      if (!ctx) return
      if (document.hidden) ctx.suspend()
      else ctx.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (ctxRef.current) {
        ctxRef.current.close()
        ctxRef.current = null
      }
    }
  }, [audioEnabled])
}
