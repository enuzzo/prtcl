import { useEffect, useState } from 'react'

/**
 * Live counter: 20,000 particles × 60 frames per second, counting
 * up from the moment the CTA scrolls into view. The number is fake-precise
 * on purpose — that's the joke.
 */
function useParticleCounter(targetVisible: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!targetVisible) return
    const RATE_PER_SECOND = 20_000 * 60 // 1.2M particles/s rendered somewhere right now
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000
      setCount(Math.floor(elapsed * RATE_PER_SECOND))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [targetVisible])

  return count
}

export function FinalCTA() {
  const [visible, setVisible] = useState(false)
  const count = useParticleCounter(visible)

  useEffect(() => {
    // Start counter when page has been scrolled past the showcase section.
    // Simple threshold instead of IntersectionObserver — we don't need precision.
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.5) setVisible(true)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const formatted = count.toLocaleString('en-US')

  return (
    <section
      className="relative py-28 md:py-40 px-6 md:px-10 overflow-hidden border-t-[3px] border-accent"
      aria-labelledby="cta-heading"
    >
      {/* Backdrop — soft radial wash, no floating dots */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(255,43,214,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 90% 60% at 15% 40%, rgba(124,255,0,0.09) 0%, transparent 55%),
            rgba(8,4,14,0.9)
          `,
        }}
        aria-hidden="true"
      />

      {/* Engineering grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section meta */}
        <div className="flex items-baseline gap-3 text-[11px] tracking-[0.25em] uppercase text-text-muted mb-10 md:mb-14">
          <span className="inline-block w-1.5 h-1.5 bg-accent translate-y-[1px]" aria-hidden="true" />
          <span className="text-accent">§ 04</span>
          <span className="opacity-40">·</span>
          <span>Exit interview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-end">
          {/* Left: copy + CTA */}
          <div>
            <h2
              id="cta-heading"
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]"
            >
              You scrolled
              <br />
              <span className="text-accent">this far.</span>
            </h2>
            <p className="mt-6 md:mt-8 text-text-secondary text-base md:text-lg leading-normal max-w-xl">
              That either means you&apos;re genuinely interested, or you&apos;re
              avoiding something important.
              <span className="text-text-muted"> Either way, the editor is right here. Again.</span>
            </p>

            <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4">
              <a
                href="/create"
                className="
                  group relative inline-flex items-center gap-3
                  px-8 py-4
                  bg-accent2 text-bg font-bold text-sm tracking-[0.2em] uppercase
                  hover:bg-accent2-hover hover:shadow-glow-lime
                  transition-all duration-200
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
                "
              >
                <span className="text-[10px] opacity-70 tracking-[0.25em] font-normal">./</span>
                Open the editor
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
              <a
                href="https://github.com/enuzzo/prtcl"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center justify-center
                  px-6 py-4
                  border border-text-muted/30 text-text-secondary text-[11px] tracking-[0.25em] uppercase
                  hover:border-text-muted hover:text-text
                  transition-all duration-200
                "
              >
                Fork on GitHub
              </a>
            </div>
          </div>

          {/* Right: live particle counter — data porn */}
          <aside
            className="
              relative border border-border bg-bg/40 backdrop-blur-sm
              px-5 py-6 md:px-7 md:py-8
            "
            aria-label="Live render counter"
          >
            {/* Corner ticks */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent" aria-hidden="true" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent" aria-hidden="true" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent" aria-hidden="true" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent" aria-hidden="true" />

            <p className="text-[10px] tracking-[0.3em] uppercase text-text-muted mb-3">
              Particles rendered since you got here
            </p>
            <div
              className="
                text-3xl md:text-4xl lg:text-5xl font-bold text-accent2
                tracking-tight tabular-nums leading-none
                min-h-[1em]
              "
              aria-live="off"
            >
              {formatted}
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[10px] tracking-[0.2em] uppercase">
              <span className="text-text-muted">Rate</span>
              <span className="text-text tabular-nums">1,200,000 / s</span>
            </div>
            <p className="mt-3 text-[10px] text-text-muted/70 leading-relaxed">
              * Approximated. None of these are real particles. None of them contribute to anything.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
