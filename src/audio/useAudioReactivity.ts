import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { computeBands, BeatDetector } from './analyser'

/**
 * EMA smoothing factor — how fast bands respond.
 * 0.15 = smooth, organic rise/fall (no hysteria).
 * Higher = snappier but jittery. Lower = sluggish.
 */
const SMOOTH_UP = 0.18   // rise speed (attack)
const SMOOTH_DOWN = 0.08 // fall speed (release) — slower = graceful decay

/** Noise gate — ignore signals below this threshold */
const NOISE_FLOOR = 0.02

export function useAudioReactivity(): void {
  const audioEnabled = useStore((s) => s.audioEnabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const dataRef = useRef<Uint8Array | null>(null)
  const beatDetectorRef = useRef(new BeatDetector())

  // Smoothed band values — persist across frames
  const smoothBass = useRef(0)
  const smoothMids = useRef(0)
  const smoothHighs = useRef(0)
  const smoothEnergy = useRef(0)

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
      smoothBass.current = 0
      smoothMids.current = 0
      smoothHighs.current = 0
      smoothEnergy.current = 0

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
        analyser.smoothingTimeConstant = 0.5
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount // 512
        const data = new Uint8Array(bufferLength)
        dataRef.current = data

        useStore.getState().setAudioReady(true)
        useStore.getState().setAudioError(null)

        // Analysis loop with EMA smoothing + noise gate
        function loop() {
          if (cancelled) return
          rafRef.current = requestAnimationFrame(loop)

          analyser.getByteFrequencyData(data)
          const raw = computeBands(data, bufferLength)

          // Noise gate — kill values below floor to prevent jitter on silence
          const rb = raw.bassBand < NOISE_FLOOR ? 0 : raw.bassBand
          const rm = raw.midsBand < NOISE_FLOOR ? 0 : raw.midsBand
          const rh = raw.highsBand < NOISE_FLOOR ? 0 : raw.highsBand
          const re = raw.energy < NOISE_FLOOR ? 0 : raw.energy

          // EMA smoothing — fast attack, slow release for organic feel
          const emaB = rb > smoothBass.current ? SMOOTH_UP : SMOOTH_DOWN
          const emaM = rm > smoothMids.current ? SMOOTH_UP : SMOOTH_DOWN
          const emaH = rh > smoothHighs.current ? SMOOTH_UP : SMOOTH_DOWN
          const emaE = re > smoothEnergy.current ? SMOOTH_UP : SMOOTH_DOWN

          smoothBass.current += (rb - smoothBass.current) * emaB
          smoothMids.current += (rm - smoothMids.current) * emaM
          smoothHighs.current += (rh - smoothHighs.current) * emaH
          smoothEnergy.current += (re - smoothEnergy.current) * emaE

          // Beat detection uses raw bass (not smoothed) for sharp onset
          const beat = beatDetectorRef.current.detect(raw.bassBand, performance.now())

          useStore.getState().updateAudioData({
            bassBand: smoothBass.current,
            midsBand: smoothMids.current,
            highsBand: smoothHighs.current,
            energy: smoothEnergy.current,
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
