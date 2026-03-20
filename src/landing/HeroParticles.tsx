import { useEffect, useRef } from 'react'

/* ── Constants ─────────────────────────────────────────────── */
const PARTICLE_COUNT = 800
const COLORS: string[] = ['#FF2BD6', '#7CFF00', '#A98ED1']
const SPLASH_FONT = '"Inconsolata", "JetBrains Mono", monospace'

/* ── Timeline (ms) — one cycle ─────────────────────────────── */
const T_CONVERGE = 1200
const T_HOLD1    = 1000
const T_MORPH1   = 800
const T_HOLD2    = 800
const T_MORPH2   = 1000
const T_HOLD3    = 1200
const T_DISSOLVE = 1500
const T_DRIFT    = 500
const CYCLE = T_CONVERGE + T_HOLD1 + T_MORPH1 + T_HOLD2 + T_MORPH2 + T_HOLD3 + T_DISSOLVE + T_DRIFT // ~8000ms

// Cumulative timestamps
const C1 = T_CONVERGE
const C2 = C1 + T_HOLD1
const C3 = C2 + T_MORPH1
const C4 = C3 + T_HOLD2
const C5 = C4 + T_MORPH2
const C6 = C5 + T_HOLD3
const C7 = C6 + T_DISSOLVE

/* ── Easing ────────────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInQuad(t: number) { return t * t }
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function clamp01(t: number) { return Math.max(0, Math.min(1, t)) }

/* ── Text sampling ─────────────────────────────────────────── */
function sampleTextPoints(
  text: string, w: number, h: number, count: number,
): Array<[number, number]> {
  const off = document.createElement('canvas')
  off.width = w; off.height = h
  const ctx = off.getContext('2d')!
  const fontSize = Math.max(48, Math.min(w * 0.14, 160))
  ctx.font = `bold ${fontSize}px ${SPLASH_FONT}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, w / 2, h / 2)
  const img = ctx.getImageData(0, 0, w, h)
  const points: Array<[number, number]> = []
  for (let py = 0; py < h; py += 2) {
    for (let px = 0; px < w; px += 2) {
      if ((img.data[(py * w + px) * 4 + 3] ?? 0) > 128) points.push([px, py])
    }
  }
  // Shuffle
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[points[i], points[j]] = [points[j]!, points[i]!]
  }
  // Pad if needed
  while (points.length < count) {
    const s = points[Math.floor(Math.random() * points.length)]!
    points.push([s[0] + (Math.random() - 0.5) * 2, s[1] + (Math.random() - 0.5) * 2])
  }
  const selected = points.slice(0, count)
  selected.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])
  return selected
}

/* ── Particle ──────────────────────────────────────────────── */
interface Particle {
  x: number; y: number
  color: string
  size: number
  alpha: number
  // Start (scatter) positions
  sx: number; sy: number
  // Text targets
  t1x: number; t1y: number
  t2x: number; t2y: number
  t3x: number; t3y: number
  // Dissolve targets (random)
  dx: number; dy: number
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respect reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return

    let raf = 0
    let dead = false

    const run = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const targets1 = sampleTextPoints('PRTCL', w, h, PARTICLE_COUNT)
      const targets2 = sampleTextPoints('PRTCL.ES', w, h, PARTICLE_COUNT)
      const targets3 = sampleTextPoints('PARTICLES', w, h, PARTICLE_COUNT)

      const cx = w / 2, cy = h / 2
      const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const [t1x, t1y] = targets1[i]!
        const [t2x, t2y] = targets2[i]!
        const [t3x, t3y] = targets3[i]!
        return {
          x: 0, y: 0,
          sx: cx + (Math.random() + Math.random() - 1) * w * 0.6,
          sy: cy + (Math.random() + Math.random() - 1) * h * 0.6,
          t1x, t1y, t2x, t2y, t3x, t3y,
          dx: Math.random() * w,
          dy: Math.random() * h,
          color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FF2BD6',
          size: 0.8 + Math.random() * 1.2,
          alpha: 1,
        }
      })

      let startTime = 0

      const tick = (now: number) => {
        if (dead) return
        if (!startTime) startTime = now
        const elapsed = (now - startTime) % CYCLE

        // Max opacity for particles — subtle behind hero text
        const A = 0.35
        const A_SHIMMER = 0.06

        if (elapsed < C1) {
          // Converge: scatter → "PRTCL"
          const t = easeOutCubic(clamp01(elapsed / T_CONVERGE))
          for (const p of particles) {
            p.x = p.sx + (p.t1x - p.sx) * t
            p.y = p.sy + (p.t1y - p.sy) * t
            p.alpha = 0.15 + (A - 0.15) * t
          }
        } else if (elapsed < C2) {
          // Hold "PRTCL"
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t1x + (Math.random() - 0.5) * 0.3
            p.y = p.t1y + (Math.random() - 0.5) * 0.3
            p.alpha = A + A_SHIMMER * Math.sin(elapsed * 0.01 + i)
          }
        } else if (elapsed < C3) {
          // Morph "PRTCL" → "PRTCL.ES"
          const t = easeInOutCubic(clamp01((elapsed - C2) / T_MORPH1))
          for (const p of particles) {
            p.x = p.t1x + (p.t2x - p.t1x) * t
            p.y = p.t1y + (p.t2y - p.t1y) * t
            p.alpha = A
          }
        } else if (elapsed < C4) {
          // Hold "PRTCL.ES"
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t2x + (Math.random() - 0.5) * 0.3
            p.y = p.t2y + (Math.random() - 0.5) * 0.3
            p.alpha = A + A_SHIMMER * Math.sin(elapsed * 0.01 + i)
          }
        } else if (elapsed < C5) {
          // Morph "PRTCL.ES" → "PARTICLES"
          const t = easeInOutCubic(clamp01((elapsed - C4) / T_MORPH2))
          for (const p of particles) {
            p.x = p.t2x + (p.t3x - p.t2x) * t
            p.y = p.t2y + (p.t3y - p.t2y) * t
            p.alpha = A
          }
        } else if (elapsed < C6) {
          // Hold "PARTICLES"
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t3x + (Math.random() - 0.5) * 0.3
            p.y = p.t3y + (Math.random() - 0.5) * 0.3
            p.alpha = A + A_SHIMMER * Math.sin(elapsed * 0.01 + i)
          }
        } else if (elapsed < C7) {
          // Dissolve to random positions
          const t = easeInQuad(clamp01((elapsed - C6) / T_DISSOLVE))
          for (const p of particles) {
            p.x = p.t3x + (p.dx - p.t3x) * t
            p.y = p.t3y + (p.dy - p.t3y) * t
            p.alpha = A * (1 - t * 0.6)
          }
        } else {
          // Drift — update scatter positions for next cycle
          for (const p of particles) {
            p.x = p.dx + (Math.random() - 0.5) * 2
            p.y = p.dy + (Math.random() - 0.5) * 2
            p.alpha = 0.25
            // Next cycle starts from current dissolve position
            p.sx = p.dx
            p.sy = p.dy
            // Randomize dissolve targets for next loop
            p.dx = Math.random() * w
            p.dy = Math.random() * h
          }
        }

        /* ── Render ── */
        ctx.clearRect(0, 0, w, h)

        for (const p of particles) {
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        // Subtle additive glow on every 8th particle
        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < particles.length; i += 8) {
          const p = particles[i]!
          ctx.globalAlpha = p.alpha * 0.05
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1

        raf = requestAnimationFrame(tick)
      }

      raf = requestAnimationFrame(tick)
    }

    document.fonts.ready.then(run).catch(run)
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  )
}
