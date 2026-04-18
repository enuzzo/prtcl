import { useState, useEffect, useRef } from 'react'

interface ShowcaseEffect {
  id: string
  code: string
  name: string
  category: string
  particles: string
  description: string
  embedParams: string
  span: 'hero' | 'tall' | 'wide' | 'short'
}

const SHOWCASE_EFFECTS: ShowcaseEffect[] = [
  {
    id: 'frequency',
    code: 'EFX-001',
    name: 'Fractal Frequency',
    category: 'Math',
    particles: '20K',
    description: 'A recursive waveform that pulses whether you deserve it or not.',
    embedParams: '&rotate=1&orbit=0&badge=0',
    span: 'hero',
  },
  {
    id: 'murmuration',
    code: 'EFX-012',
    name: 'Murmuration',
    category: 'Organic',
    particles: '10K',
    description: 'Three rules, ten thousand starlings, one emergent hallucination.',
    embedParams: '&rotate=0.6&orbit=0&badge=0',
    span: 'tall',
  },
  {
    id: 'nebula-organica',
    code: 'EFX-004',
    name: 'Nebula Organica',
    category: 'Organic',
    particles: '15K',
    description: 'A slow-breathing organism made of dust. Patently uninterested.',
    embedParams: '&rotate=0.5&orbit=0&badge=0',
    span: 'short',
  },
  {
    id: 'hopf-fibration',
    code: 'EFX-002',
    name: 'Hopf Fibration',
    category: 'Math',
    particles: '15K',
    description: '4D topology forced through a 3D monitor. Understanding optional.',
    embedParams: '&rotate=1.5&orbit=0&badge=0',
    span: 'wide',
  },
]

/**
 * Iframe only mounts when the card scrolls into view.
 * Prevents 4× Three.js instances loading on page load.
 */
function ShowcaseCard({ effect, variant }: { effect: ShowcaseEffect; variant: 'hero' | 'side' }) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setInView(true); io.disconnect() } },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const isHero = variant === 'hero'

  return (
    <div
      ref={ref}
      className={`
        group relative overflow-hidden
        border border-border bg-surface/30
        hover:border-accent/40
        transition-colors duration-300
        ${isHero ? 'h-full min-h-[400px] lg:min-h-[520px]' : 'h-full min-h-[220px]'}
      `}
    >
      {/* Iframe container fills the card */}
      <div className="absolute inset-0 bg-bg">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {inView && (
          <iframe
            src={`/embed?effect=${effect.id}${effect.embedParams}`}
            title={`${effect.name} particle effect preview`}
            className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>

      {/* Top-left specimen label — always visible, tiny */}
      <div className="absolute top-0 left-0 z-10 flex items-center gap-2 px-3 py-2 bg-bg/80 backdrop-blur-sm">
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-accent2">
          {effect.code}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-text-muted">
          {effect.category}
        </span>
      </div>

      {/* Top-right particle count */}
      <div className="absolute top-0 right-0 z-10 px-3 py-2 bg-bg/80 backdrop-blur-sm">
        <span className="text-[10px] tracking-[0.2em] uppercase text-text-muted">
          {effect.particles}&nbsp;particles
        </span>
      </div>

      {/* Bottom info strip — gradient fade, always visible */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5"
        style={{
          background: 'linear-gradient(to top, rgba(8,4,14,0.92) 0%, rgba(8,4,14,0.7) 50%, transparent 100%)',
        }}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className={`font-bold tracking-tight truncate ${isHero ? 'text-lg md:text-2xl' : 'text-sm md:text-base'}`}>
              {effect.name}
            </h3>
            {isHero && (
              <p className="text-text-secondary text-xs md:text-sm mt-1.5 leading-snug max-w-md">
                {effect.description}
              </p>
            )}
          </div>
          <a
            href={`/create#effect=${effect.id}`}
            className={`
              shrink-0
              px-3 py-1.5
              bg-accent2/90 text-bg font-bold tracking-[0.15em] uppercase
              hover:bg-accent2
              transition-colors duration-200
              ${isHero ? 'text-[11px] md:text-xs' : 'text-[10px]'}
            `}
            aria-label={`Open ${effect.name} in editor`}
          >
            Open →
          </a>
        </div>
      </div>
    </div>
  )
}

export function EffectShowcase() {
  const [hero, ...others] = SHOWCASE_EFFECTS

  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/85 backdrop-blur-sm overflow-hidden"
      aria-labelledby="showcase-heading"
    >
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section meta header */}
        <div className="flex items-baseline gap-3 text-[11px] tracking-[0.25em] uppercase text-text-muted mb-6">
          <span className="inline-block w-1.5 h-1.5 bg-accent2 translate-y-[1px]" aria-hidden="true" />
          <span className="text-accent2">§ 03</span>
          <span className="opacity-40">·</span>
          <span>Specimens</span>
          <span className="opacity-40 ml-auto hidden md:inline">22 catalogued</span>
        </div>

        <h2
          id="showcase-heading"
          className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95] mb-4"
        >
          Twenty-two effects.
        </h2>
        <p className="text-text-muted text-xl md:text-2xl tracking-tight mb-6">
          Zero practical applications.
        </p>
        <p className="text-text-secondary text-sm md:text-base max-w-2xl mb-14 md:mb-16 leading-relaxed">
          Fractals, organic clouds, swarming flocks, 4D topology. Every preset has live sliders
          so you can adjust parameters you don&apos;t fully understand until it looks exactly right.
          <span className="text-text-muted"> That&apos;s the process. That&apos;s always the process.</span>
        </p>

        {/* Mobile: horizontal snap scroll, no iframes (saves ~9MB of Three.js) */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 sm:hidden [&::-webkit-scrollbar]:hidden">
          {SHOWCASE_EFFECTS.map((effect) => (
            <a
              key={effect.id}
              href={`/create#effect=${effect.id}`}
              className="snap-center shrink-0 w-[82vw] block border border-border bg-surface/30 hover:border-accent/40 transition-colors duration-300"
            >
              <div className="aspect-[16/10] bg-bg flex items-center justify-center relative">
                <span className="text-accent text-5xl font-bold opacity-20 tracking-tighter">
                  {effect.code.split('-')[1]}
                </span>
                <div className="absolute top-0 left-0 flex items-center gap-2 px-3 py-2 bg-bg/80">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-accent2">
                    {effect.code}
                  </span>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-text-muted">
                    {effect.category}
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-bold">{effect.name}</span>
                <span className="text-accent2 text-[10px] tracking-[0.2em] uppercase font-bold">Open →</span>
              </div>
            </a>
          ))}
        </div>

        {/* Desktop: irregular masonry — 1 hero (spans 2 rows) + 3 smaller cards */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:grid-rows-[repeat(3,minmax(0,200px))] lg:grid-rows-[repeat(2,minmax(0,260px))] gap-4 lg:gap-5">
          {/* Hero: spans full height on left */}
          <div className="sm:row-span-3 lg:row-span-2">
            <ShowcaseCard effect={hero!} variant="hero" />
          </div>

          {/* Three supporting cards, right column */}
          {others.map((effect) => (
            <div key={effect.id}>
              <ShowcaseCard effect={effect} variant="side" />
            </div>
          ))}
        </div>

        {/* Footer link — "view all" call-out */}
        <div className="mt-10 md:mt-14 flex items-center justify-between gap-4 pt-6 border-t border-border/60">
          <p className="text-xs md:text-sm text-text-muted tracking-wide">
            Eighteen more in the editor. They&apos;re all like this.
          </p>
          <a
            href="/create"
            className="
              shrink-0 inline-flex items-center gap-2
              text-accent2 text-xs md:text-sm tracking-[0.2em] uppercase font-bold
              hover:text-accent2-hover transition-colors duration-200
            "
          >
            Browse the catalog
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
