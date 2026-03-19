import { useEffect, useRef } from 'react'

/* ── Constants ─────────────────────────────────────────────── */
const PARTICLE_COUNT = 1800
const COLORS: string[] = ['#FF2BD6', '#7CFF00', '#A98ED1']
const BG = '#08040E'
const SPLASH_FONT = '"Inconsolata", "JetBrains Mono", monospace'

/* ── Timeline (ms) ─────────────────────────────────────────── */
const T_CONVERGE = 1000    // scatter → "PRTCL"
const T_HOLD1    = 400     // hold "PRTCL"
const T_MORPH1   = 600     // ".ES" slides in → "PRTCL.ES"
const T_HOLD2    = 450     // hold "PRTCL.ES"
const T_MORPH2   = 800     // letters spread → "PARTICLES"
const T_HOLD3    = 500     // hold "PARTICLES"
const T_FADE     = 1400    // crossfade to reveal 3D scene

// Cumulative timestamps
const C1 = T_CONVERGE                                          // 1000
const C2 = C1 + T_HOLD1                                        // 1400
const C3 = C2 + T_MORPH1                                       // 2000
const C4 = C3 + T_HOLD2                                        // 2450
const C5 = C4 + T_MORPH2                                       // 3250
const C6 = C5 + T_HOLD3                                        // 3750
const C7 = C6 + T_FADE                                         // 5150

/* ── Easing ────────────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInQuad(t: number) { return t * t }
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function clamp01(t: number) { return Math.max(0, Math.min(1, t)) }

/* ── Particle ──────────────────────────────────────────────── */
interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  size: number
  alpha: number
  sx: number; sy: number
  t1x: number; t1y: number
  t2x: number; t2y: number
  t3x: number; t3y: number
}

/* ── Text sampling ─────────────────────────────────────────── */
function sampleTextPointsSorted(
  text: string, w: number, h: number, count: number
): Array<[number, number]> {
  const off = document.createElement('canvas')
  off.width = w; off.height = h
  const ctx = off.getContext('2d')!
  const fontSize = Math.max(64, Math.min(w * 0.16, 200))
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
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[points[i], points[j]] = [points[j]!, points[i]!]
  }
  while (points.length < count) {
    const s = points[Math.floor(Math.random() * points.length)]!
    points.push([s[0] + (Math.random() - 0.5) * 2, s[1] + (Math.random() - 0.5) * 2])
  }
  const selected = points.slice(0, count)
  selected.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])
  return selected
}

function createParticles(w: number, h: number): Particle[] {
  const targets1 = sampleTextPointsSorted('PRTCL', w, h, PARTICLE_COUNT)
  const targets2 = sampleTextPointsSorted('PRTCL.ES', w, h, PARTICLE_COUNT)
  const targets3 = sampleTextPointsSorted('PARTICLES', w, h, PARTICLE_COUNT)
  const cx = w / 2, cy = h / 2
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const [t1x, t1y] = targets1[i]!
    const [t2x, t2y] = targets2[i]!
    const [t3x, t3y] = targets3[i]!
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      sx: cx + (Math.random() + Math.random() - 1) * w * 0.6,
      sy: cy + (Math.random() + Math.random() - 1) * h * 0.6,
      t1x, t1y, t2x, t2y, t3x, t3y,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FF2BD6',
      size: 1 + Math.random() * 1.5,
      alpha: 1,
    }
  })
}

/* ── Component ─────────────────────────────────────────────── */
interface SplashScreenProps { onComplete: () => void; onExplodeStart?: () => void }

export function SplashScreen({ onComplete, onExplodeStart }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const copyrightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const logo = logoRef.current
    const copyright = copyrightRef.current
    if (!canvas || !wrap) return

    let raf = 0, dead = false

    const run = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth, h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const particles = createParticles(w, h)
      const cx = w / 2, cy = h / 2
      let startTime = 0

      let explodeFired = false

      const tick = (now: number) => {
        if (dead) return
        if (!startTime) startTime = now
        const elapsed = now - startTime

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
          /* ── Explode: particles fly off-screen edges at high velocity ── */
          if (!explodeFired) { explodeFired = true; onExplodeStart?.() }
          const raw = clamp01((elapsed - C6) / T_FADE)
          const t = easeInQuad(raw)
          for (const p of particles) {
            if (p.vx === 0 && p.vy === 0) {
              const dx = p.t3x - cx
              const dy = p.t3y - cy
              // High speed so particles fly well past screen edges
              const speed = 5 + Math.random() * 6
              p.vx = dx * speed
              p.vy = dy * speed
            }
            p.x = p.t3x + p.vx * t
            p.y = p.t3y + p.vy * t
            // No alpha fade — particles stay fully visible until off-screen
            p.alpha = 1
          }
          // Crossfade: in the second half, fade the overlay so PRTCL emerges underneath
          if (raw > 0.35) {
            const fadeT = easeInOutCubic((raw - 0.35) / 0.65)
            wrap.style.opacity = String(1 - fadeT)
          }
          // Logo rises and fades
          if (logo) {
            const logoT = easeInOutCubic(clamp01(raw / 0.6))
            logo.style.transform = `translateX(-50%) translateY(${-logoT * 120}px)`
            logo.style.opacity = String(1 - logoT)
          }
          // Copyright fades quickly
          if (copyright) {
            copyright.style.opacity = String(1 - clamp01(raw / 0.3))
          }
        } else {
          wrap.style.opacity = '0'
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
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [onComplete, onExplodeStart])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100vh', pointerEvents: 'none', background: BG }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <img
        ref={logoRef}
        src="/img/netmilk-logo.svg"
        alt=""
        style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', width: 160, height: 'auto', opacity: 1 }}
      />
      <div
        ref={copyrightRef}
        style={{
          position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center',
          fontFamily: '"Inconsolata", "JetBrains Mono", monospace', fontSize: 12,
          color: '#A98ED1', letterSpacing: '0.05em',
        }}
      >
        &copy; {new Date().getFullYear()} Netmilk Studio &middot; MIT License
      </div>
    </div>
  )
}
