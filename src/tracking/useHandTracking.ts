import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store'
import { loadMediaPipe, closeMediaPipe } from './mediapipe-loader'
import type { MediaPipeResult } from './mediapipe-loader'
import { LandmarkSmoother } from './smoothing'
import { createGestureClassifier, getPalmCenter, getHandSize } from './gesture-classifier'
import { resetHandCamera } from './hand-camera'
import { getCameraStartErrorMessage } from './camera-errors'
import { getCurrentCameraSupportError, requestUserCamera, takePendingCameraStream } from './camera-stream'

/**
 * React hook that manages the full webcam → MediaPipe → store pipeline.
 * Only active when trackingEnabled is true.
 */
export function useHandTracking(): {
  videoEl: HTMLVideoElement | null
} {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef(0)
  const activeRef = useRef(false)

  const enabled = useStore((s) => s.trackingEnabled)

  const processResult = useCallback(() => {
    // These are created fresh per enable cycle
    let smoother: LandmarkSmoother | null = null
    let classify: ReturnType<typeof createGestureClassifier> | null = null

    return (result: MediaPipeResult | null) => {
      if (!smoother) smoother = new LandmarkSmoother(0.3)
      if (!classify) classify = createGestureClassifier()

      if (!result) {
        useStore.getState().updateHandState({
          gesture: 'none',
          palmPosition: null,
          landmarks: null,
          confidence: 0,
        })
        return
      }

      const smoothed = smoother.smooth(result.landmarks)
      const gesture = classify(smoothed, result.handedness, performance.now())
      const palmPosition = getPalmCenter(smoothed)
      const handSize = getHandSize(smoothed)

      useStore.getState().updateHandState({
        gesture,
        palmPosition,
        handSize,
        confidence: result.confidence,
        landmarks: smoothed,
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let dead = false
    const handler = processResult()

    const start = async () => {
      try {
        const store = useStore.getState()
        const supportError = getCurrentCameraSupportError()

        if (supportError) {
          store.setTrackingError(supportError)
          store.showToast(supportError)
          store.setTrackingEnabled(false)
          return
        }

        // Request webcam
        console.log('[PRTCL] Tracking: requesting webcam...')
        const stream = takePendingCameraStream() ?? await requestUserCamera()

        if (dead) {
          console.log('[PRTCL] Tracking: dead after getUserMedia, bailing')
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        // Setup video element
        console.log('[PRTCL] Tracking: webcam acquired, setting up video')
        const video = document.createElement('video')
        video.srcObject = stream
        video.setAttribute('playsinline', '')
        video.playsInline = true
        video.autoplay = true
        video.muted = true
        video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
        document.body.appendChild(video)
        await video.play()
        videoRef.current = video
        setVideoEl(video)  // Trigger re-render so TrackingThumbnail receives the element

        // Load MediaPipe
        console.log('[PRTCL] Tracking: loading MediaPipe...')
        const hands = await loadMediaPipe(handler)

        if (dead) {
          console.log('[PRTCL] Tracking: dead after loadMediaPipe, bailing')
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        console.log('[PRTCL] Tracking: ready! Starting frame loop')
        useStore.getState().setTrackingReady(true)
        useStore.getState().setTrackingError(null)
        useStore.getState().showToast('Hand tracking ready.')
        activeRef.current = true

        // Feed frames to MediaPipe.
        // Natural ~30fps throttle: await hands.send() takes ~8ms inference,
        // then rAF fires ~16ms later. Net result: one inference every ~24ms (~30fps).
        // No explicit frame-skipping needed.
        const sendFrame = async () => {
          if (dead || !activeRef.current) return
          if (!document.hidden) {
            try {
              await hands.send({ image: video })
            } catch {
              // MediaPipe occasionally drops frames — non-fatal
            }
          }
          rafRef.current = requestAnimationFrame(sendFrame)
        }
        sendFrame()
      } catch (e) {
        // Ignore expected errors from cleanup/strict-mode superseding a stale load
        if (dead) return
        console.warn('[PRTCL] Hand tracking start() failed:', e)
        const msg = getCameraStartErrorMessage(e, navigator.userAgent)
        useStore.getState().setTrackingError(msg)
        useStore.getState().showToast(msg)
        useStore.getState().setTrackingEnabled(false)
      }
    }

    start()

    return () => {
      dead = true
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)

      // Stop webcam stream
      const video = videoRef.current
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach((t) => t.stop())
        video.srcObject = null
      }
      video?.remove()
      videoRef.current = null
      setVideoEl(null)

      closeMediaPipe()
      resetHandCamera()

      useStore.getState().setTrackingReady(false)
      useStore.getState().updateHandState({
        gesture: 'none',
        palmPosition: null,
        landmarks: null,
        confidence: 0,
        handSize: 0,
      })
    }
  }, [enabled, processResult])

  return { videoEl }
}
