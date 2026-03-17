import { useEffect, useRef } from 'react'

/* ── Constants ─────────────────────────────────────────────── */
const PARTICLE_COUNT = 1200
const COLORS: string[] = ['#FF2BD6', '#7CFF00', '#A98ED1']
const BG = '#08040E'
const FONT = '"Inconsolata", "JetBrains Mono", monospace'

/* ── Timeline (ms) ─────────────────────────────────────────── */
// "PRTCL" forms → ".ES" slides in → spreads to "PARTICLES" → explode
const T_CONVERGE = 1000    // scatter → "PRTCL"
const T_HOLD1    = 350     // hold "PRTCL"
const T_MORPH1   = 600     // ".ES" slides in → "PRTCL.ES"
const T_HOLD2    = 400     // hold "PRTCL.ES"
const T_MORPH2   = 800     // letters spread → "PARTICLES"
const T_HOLD3    = 350     // hold "PARTICLES"
const T_EXPLODE  = 500     // explode outward
const T_FADE     = 350     // canvas opacity fade

// Cumulative timestamps
const C1 = T_CONVERGE                                          // 1000
const C2 = C1 + T_HOLD1                                        // 1350
const C3 = C2 + T_MORPH1                                       // 1950
const C4 = C3 + T_HOLD2                                        // 2350
const C5 = C4 + T_MORPH2                                       // 3150
const C6 = C5 + T_HOLD3                                        // 3500
const C7 = C6 + T_EXPLODE                                      // 4000
const TOTAL = C7 + T_FADE                                       // 4350

/* ── Easing ────────────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function easeInQuad(t: number) { return t * t }
function clamp01(t: number) { return Math.max(0, Math.min(1, t)) }

/* ── Particle ──────────────────────────────────────────────── */
interface Particle {
  x: number; y: number
  color: string
  size: number
  alpha: number
  // Scatter origin
  sx: number; sy: number
  // Target positions for each text phase
  t1x: number; t1y: number   // "PRTCL"
  t2x: number; t2y: number   // "PRTCL.ES"
  t3x: number; t3y: number   // "PARTICLES"
  // Explode velocity
  vx: number; vy: number
}

/* ── Text sampling (sorted by X then Y for spatial coherence) ── */
function sampleTextPointsSorted(
  text: string, w: number, h: number, count: number
): Array<[number, number]> {
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const ctx = off.getContext('2d')!

  const fontSize = Math.max(36, Math.min(w * 0.09, 90))
  ctx.font = `bold ${fontSize}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, w / 2, h / 2)

  const img = ctx.getImageData(0, 0, w, h)
  const points: Array<[number, number]> = []

  const step = 2
  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const idx = (py * w + px) * 4
      if ((img.data[idx + 3] ?? 0) > 128) {
        points.push([px, py])
      }
    }
  }

  // Shuffle first to randomize within similar positions
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = points[i]!
    points[i] = points[j]!
    points[j] = tmp
  }

  // Pad if needed
  while (points.length < count) {
    const src = points[Math.floor(Math.random() * points.length)]!
    points.push([src[0] + (Math.random() - 0.5) * 2, src[1] + (Math.random() - 0.5) * 2])
  }

  const selected = points.slice(0, count)

  // Sort by X position (primary), Y (secondary) — this ensures spatial coherence
  // Particles on the left of "PRTCL" will map to the left of "PARTICLES"
  selected.sort((a, b) => {
    const dx = a[0] - b[0]
    return dx !== 0 ? dx : a[1] - b[1]
  })

  return selected
}

/* ── Init particles ────────────────────────────────────────── */
function createParticles(w: number, h: number): Particle[] {
  // All three sorted by X → particles on "P" in PRTCL stay on "P" in PARTICLES
  const targets1 = sampleTextPointsSorted('PRTCL', w, h, PARTICLE_COUNT)
  const targets2 = sampleTextPointsSorted('PRTCL.ES', w, h, PARTICLE_COUNT)
  const targets3 = sampleTextPointsSorted('PARTICLES', w, h, PARTICLE_COUNT)

  const cx = w / 2
  const cy = h / 2

  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const [t1x, t1y] = targets1[i]!
    const [t2x, t2y] = targets2[i]!
    const [t3x, t3y] = targets3[i]!

    const sx = cx + (Math.random() + Math.random() - 1) * w * 0.6
    const sy = cy + (Math.random() + Math.random() - 1) * h * 0.6

    particles.push({
      x: sx, y: sy,
      sx, sy,
      t1x, t1y,
      t2x, t2y,
      t3x, t3y,
      vx: 0, vy: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FF2BD6',
      size: 1 + Math.random() * 1.5,
      alpha: 1,
    })
  }
  return particles
}

/* ── Component ─────────────────────────────────────────────── */
interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    let raf = 0
    let dead = false

    const run = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'

      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const particles = createParticles(w, h)
      const cx = w / 2
      const cy = h / 2
      let startTime = 0

      const tick = (now: number) => {
        if (dead) return
        if (!startTime) startTime = now
        const elapsed = now - startTime

        /* ── Phase updates ── */
        if (elapsed < C1) {
          const t = easeOutCubic(clamp01(elapsed / T_CONVERGE))
          for (const p of particles) {
            p.x = p.sx + (p.t1x - p.sx) * t
            p.y = p.sy + (p.t1y - p.sy) * t
            p.alpha = 0.4 + 0.6 * t
          }
        } else if (elapsed < C2) {
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t1x + (Math.random() - 0.5) * 0.3
            p.y = p.t1y + (Math.random() - 0.5) * 0.3
            p.alpha = 0.85 + 0.15 * Math.sin(elapsed * 0.012 + i)
          }
        } else if (elapsed < C3) {
          const t = easeInOutCubic(clamp01((elapsed - C2) / T_MORPH1))
          for (const p of particles) {
            p.x = p.t1x + (p.t2x - p.t1x) * t
            p.y = p.t1y + (p.t2y - p.t1y) * t
            p.alpha = 0.9
          }
        } else if (elapsed < C4) {
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t2x + (Math.random() - 0.5) * 0.3
            p.y = p.t2y + (Math.random() - 0.5) * 0.3
            p.alpha = 0.85 + 0.15 * Math.sin(elapsed * 0.012 + i)
          }
        } else if (elapsed < C5) {
          const t = easeInOutCubic(clamp01((elapsed - C4) / T_MORPH2))
          for (const p of particles) {
            p.x = p.t2x + (p.t3x - p.t2x) * t
            p.y = p.t2y + (p.t3y - p.t2y) * t
            p.alpha = 0.9
          }
        } else if (elapsed < C6) {
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]!
            p.x = p.t3x + (Math.random() - 0.5) * 0.3
            p.y = p.t3y + (Math.random() - 0.5) * 0.3
            p.alpha = 0.85 + 0.15 * Math.sin(elapsed * 0.012 + i)
          }
        } else if (elapsed < C7) {
          const raw = clamp01((elapsed - C6) / T_EXPLODE)
          const t = easeInQuad(raw)
          for (const p of particles) {
            if (p.vx === 0 && p.vy === 0) {
              const dx = p.t3x - cx
              const dy = p.t3y - cy
              const speed = 2.5 + Math.random() * 4
              p.vx = dx * speed
              p.vy = dy * speed
            }
            p.x = p.t3x + p.vx * t
            p.y = p.t3y + p.vy * t
            p.alpha = 1 - raw
          }
        } else if (elapsed < TOTAL) {
          const t = clamp01((elapsed - C7) / T_FADE)
          wrap.style.opacity = String(1 - t)
        } else {
          onComplete()
          return
        }

        /* ── Render ── */
        ctx.save()
        ctx.globalAlpha = 1
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, w, h)

        for (const p of particles) {
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < particles.length; i += 6) {
          const p = particles[i]!
          ctx.globalAlpha = p.alpha * 0.08
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'

        ctx.restore()
        raf = requestAnimationFrame(tick)
      }

      raf = requestAnimationFrame(tick)
    }

    document.fonts.ready.then(run).catch(run)

    return () => {
      dead = true
      cancelAnimationFrame(raf)
    }
  }, [onComplete])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        background: BG,
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Netmilk logo — top center */}
      <img
        src="/img/netmilk-logo.svg"
        alt=""
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 160,
          height: 'auto',
          opacity: 1,
        }}
      />

      {/* Copyright — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 12,
          color: '#A98ED1',
          letterSpacing: '0.05em',
        }}
      >
        &copy; {new Date().getFullYear()} Netmilk Studio &middot; MIT License
      </div>
    </div>
  )
}
