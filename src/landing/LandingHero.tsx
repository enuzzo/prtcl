import { GitHubIcon } from './icons'
import {
  ElementorIcon, WebflowIcon, WixIcon,
  WordPressIcon, ReactIcon,
} from '../export/icons'

/* HTML5 icon — not in export icons, defined inline */
function Html5Icon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" />
    </svg>
  )
}

const PLATFORMS = [
  { icon: <ElementorIcon size={14} />, name: 'Elementor' },
  { icon: <WebflowIcon size={14} />, name: 'Webflow' },
  { icon: <WixIcon size={14} />, name: 'Wix' },
  { icon: <WordPressIcon size={14} />, name: 'WordPress' },
  { icon: <ReactIcon size={14} />, name: 'React' },
  { icon: <Html5Icon />, name: 'HTML' },
]

const SPECS: { label: string; value: string; accent?: 'pink' | 'lime' }[] = [
  { label: 'Class', value: 'visual' },
  { label: 'Particles', value: '20,000', accent: 'lime' },
  { label: 'Framerate', value: '60 fps', accent: 'lime' },
  { label: 'License', value: 'MIT' },
  { label: 'Accounts', value: 'none', accent: 'pink' },
  { label: 'Price', value: '€ 0.00', accent: 'lime' },
]

export function LandingHero() {
  return (
    <section
      className="relative min-h-dvh flex items-center overflow-hidden border-b-[3px] border-accent2 pt-20 pb-12 sm:pt-24"
      aria-labelledby="hero-heading"
    >
      {/* Radial vignette — ensures text readability over the 3D background */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `
            radial-gradient(ellipse 85% 60% at 30% 50%, rgba(8,4,14,0.25) 0%, rgba(8,4,14,0.55) 55%, #08040E 82%),
            linear-gradient(to bottom, rgba(8,4,14,0.2) 0%, rgba(8,4,14,0.25) 60%, #08040E 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Engineering grid overlay — very faint, ties the lab-notebook theme */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-10 max-w-7xl mx-auto">
        {/* Specimen file header */}
        <div className="flex items-baseline gap-3 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-text-muted mb-8 md:mb-10">
          <span className="inline-block w-1.5 h-1.5 bg-accent2 translate-y-[1px]" aria-hidden="true" />
          <span className="text-accent2">PRTCL-009</span>
          <span className="opacity-40">·</span>
          <span>Specimen Catalog</span>
          <span className="opacity-40 hidden sm:inline">·</span>
          <span className="hidden sm:inline opacity-60">Bloom &nbsp;v0.9.0</span>
        </div>

        {/* Main grid: headline left, spec sheet right */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-start">
          {/* Left: headline block */}
          <div>
            <h1
              id="hero-heading"
              className="font-bold tracking-tight leading-[0.95]"
            >
              <span className="block text-[clamp(3rem,10vw,7.5rem)] text-text">
                20,000
              </span>
              <span className="block text-[clamp(1.75rem,5vw,3.5rem)] text-text-muted font-normal mt-2">
                particles.
              </span>
              <span className="block text-[clamp(2rem,5.5vw,4.25rem)] text-accent mt-4">
                Absolutely no purpose.
              </span>
            </h1>

            {/* Sub — pushed hard against the headline */}
            <p className="mt-8 text-text-secondary text-base md:text-lg max-w-xl leading-normal">
              A GPU-accelerated particle engine that runs in the browser.
              Tweak every parameter, export one snippet, paste it on a website.
              <span className="text-text-muted"> It contributes nothing to humanity. Sixty frames per second of it.</span>
            </p>

            {/* CTA group */}
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href="/create"
                className="
                  group relative inline-flex items-center gap-3
                  px-7 py-3.5
                  bg-accent2 text-bg font-bold text-sm tracking-[0.15em] uppercase
                  hover:bg-accent2-hover hover:shadow-glow-lime
                  transition-all duration-200
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
                "
              >
                <span className="text-[10px] opacity-70 tracking-[0.25em] font-normal">./</span>
                Open the editor
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </a>
              <a
                href="https://github.com/enuzzo/prtcl"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-2
                  px-5 py-3
                  border border-text-muted/30 text-text-secondary text-xs tracking-[0.2em] uppercase
                  hover:border-text-muted hover:text-text
                  transition-all duration-200
                "
              >
                <GitHubIcon />
                Source
              </a>
            </div>
          </div>

          {/* Right: specimen sheet */}
          <aside
            className="
              hidden md:block
              border border-border px-6 py-5
              bg-bg/40 backdrop-blur-sm
              min-w-[240px]
              relative
            "
            aria-label="Specimen specifications"
          >
            {/* Corner ticks — subtle brutalist detail */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent2" aria-hidden="true" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent2" aria-hidden="true" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent2" aria-hidden="true" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent2" aria-hidden="true" />

            <p className="text-[10px] tracking-[0.3em] uppercase text-text-muted mb-4 pb-3 border-b border-border">
              Specification
            </p>
            <dl className="space-y-2.5">
              {SPECS.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-6 text-xs">
                  <dt className="tracking-[0.15em] uppercase text-text-muted">{s.label}</dt>
                  <dd
                    className={`tabular-nums font-bold ${
                      s.accent === 'lime'
                        ? 'text-accent2'
                        : s.accent === 'pink'
                        ? 'text-accent'
                        : 'text-text'
                    }`}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {/* Platform strip — quieter, as a single mono line */}
        <div className="mt-14 md:mt-20 pt-6 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-text-muted">
              Exports to
            </span>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  className="
                    flex items-center gap-2 text-text-secondary
                    hover:text-text transition-colors duration-200
                  "
                  title={p.name}
                >
                  <span className="opacity-80">{p.icon}</span>
                  <span className="text-[10px] sm:text-xs tracking-[0.15em] uppercase font-bold">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
