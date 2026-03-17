import { useRef, useEffect } from 'react'
import { useStore } from '../store'
import { LANDMARK } from '../tracking/types'

/** Connections between landmarks for skeleton drawing */
const CONNECTIONS: [number, number][] = [
  // Thumb
  [LANDMARK.WRIST, LANDMARK.THUMB_CMC], [LANDMARK.THUMB_CMC, LANDMARK.THUMB_MCP],
  [LANDMARK.THUMB_MCP, LANDMARK.THUMB_IP], [LANDMARK.THUMB_IP, LANDMARK.THUMB_TIP],
  // Index
  [LANDMARK.WRIST, LANDMARK.INDEX_MCP], [LANDMARK.INDEX_MCP, LANDMARK.INDEX_PIP],
  [LANDMARK.INDEX_PIP, LANDMARK.INDEX_DIP], [LANDMARK.INDEX_DIP, LANDMARK.INDEX_TIP],
  // Middle
  [LANDMARK.WRIST, LANDMARK.MIDDLE_MCP], [LANDMARK.MIDDLE_MCP, LANDMARK.MIDDLE_PIP],
  [LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_DIP], [LANDMARK.MIDDLE_DIP, LANDMARK.MIDDLE_TIP],
  // Ring
  [LANDMARK.WRIST, LANDMARK.RING_MCP], [LANDMARK.RING_MCP, LANDMARK.RING_PIP],
  [LANDMARK.RING_PIP, LANDMARK.RING_DIP], [LANDMARK.RING_DIP, LANDMARK.RING_TIP],
  // Pinky
  [LANDMARK.WRIST, LANDMARK.PINKY_MCP], [LANDMARK.PINKY_MCP, LANDMARK.PINKY_PIP],
  [LANDMARK.PINKY_PIP, LANDMARK.PINKY_DIP], [LANDMARK.PINKY_DIP, LANDMARK.PINKY_TIP],
  // Palm
  [LANDMARK.INDEX_MCP, LANDMARK.MIDDLE_MCP], [LANDMARK.MIDDLE_MCP, LANDMARK.RING_MCP],
  [LANDMARK.RING_MCP, LANDMARK.PINKY_MCP],
]

const GESTURE_LABELS: Record<string, string> = {
  none: 'No hand',
  open_palm: 'Open Palm',
  pinch: 'Pinch',
  fist: 'Fist',
}

const CANVAS_W = 120
const CANVAS_H = 90

interface TrackingThumbnailProps {
  videoEl: HTMLVideoElement | null
}

export function TrackingThumbnail({ videoEl }: TrackingThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarks = useStore((s) => s.landmarks)
  const gesture = useStore((s) => s.gesture)
  const trackingReady = useStore((s) => s.trackingReady)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !trackingReady) return

    let raf = 0
    let dead = false

    const draw = () => {
      if (dead) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw video frame in grayscale
      if (videoEl && videoEl.readyState >= 2) {
        ctx.save()
        ctx.filter = 'grayscale(1)'
        ctx.drawImage(videoEl, 0, 0, CANVAS_W, CANVAS_H)
        ctx.restore()
      } else {
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      }

      // Draw skeleton
      const lm = useStore.getState().landmarks
      if (lm && lm.length === 21) {
        ctx.strokeStyle = '#7CFF00'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.7

        // Draw connections
        for (const [a, b] of CONNECTIONS) {
          const la = lm[a]!
          const lb = lm[b]!
          ctx.beginPath()
          ctx.moveTo(la.x * CANVAS_W, la.y * CANVAS_H)
          ctx.lineTo(lb.x * CANVAS_W, lb.y * CANVAS_H)
          ctx.stroke()
        }

        // Draw joints
        ctx.globalAlpha = 1.0
        ctx.fillStyle = '#7CFF00'
        for (const l of lm) {
          ctx.beginPath()
          ctx.arc(l.x * CANVAS_W, l.y * CANVAS_H, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = 1.0
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [trackingReady, videoEl])

  if (!trackingReady) return null

  return (
    <div
      className="absolute bottom-3 right-3 transition-opacity duration-200"
      style={{ opacity: landmarks ? 1 : 0.5 }}
    >
      <div
        className="overflow-hidden"
        style={{
          width: CANVAS_W,
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(124,255,0,0.4)',
          borderRadius: 6,
        }}
      >
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
        <div
          className="text-center font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '1px',
            color: '#7CFF00',
            padding: '3px 0',
          }}
        >
          {GESTURE_LABELS[gesture] ?? 'No hand'}
        </div>
      </div>
    </div>
  )
}
