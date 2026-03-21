import { GitHubIcon } from './icons'
import {
  ElementorIcon, WebflowIcon, WixIcon,
  WordPressIcon, ReactIcon,
} from '../export/icons'

/* HTML5 icon — not in export icons, defined inline */
function Html5Icon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" />
    </svg>
  )
}

const PLATFORMS = [
  { icon: <ElementorIcon size={18} />, name: 'Elementor' },
  { icon: <WebflowIcon size={18} />, name: 'Webflow' },
  { icon: <WixIcon size={18} />, name: 'Wix' },
  { icon: <WordPressIcon size={18} />, name: 'WordPress' },
  { icon: <ReactIcon size={18} />, name: 'React' },
  { icon: <Html5Icon />, name: 'HTML' },
]

export function LandingHero() {
  return (
    <section
      className="relative min-h-dvh flex items-center justify-center overflow-hidden border-b-[3px] border-accent2"
      aria-labelledby="hero-heading"
    >
      {/* Radial vignette — ensures text readability over the 3D background */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(8,4,14,0.35) 0%, rgba(8,4,14,0.6) 55%, #08040E 80%),
            linear-gradient(to bottom, rgba(8,4,14,0.25) 0%, rgba(8,4,14,0.25) 60%, #08040E 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Overline */}
        <p className="text-text-muted text-xs tracking-[0.3em] uppercase mb-6">
          GPU-accelerated particle effects
        </p>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
        >
          20,000 particles.
          <br />
          <span className="text-accent block">Zero excuses.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 md:mt-8 text-text-secondary text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Free, open-source particle engine with hand tracking, audio reactivity, and text effects.
          No accounts, no paywalls, no &ldquo;schedule a demo.&rdquo;
          Just math, shaders, and zero chill.
        </p>

        {/* Platform strip */}
        <div className="mt-8">
          <p className="text-text-muted text-sm tracking-[0.2em] uppercase mb-3">Exports to</p>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/90 text-[#08040E] hover:bg-white transition-all duration-200"
                title={p.name}
              >
                {p.icon}
                <span className="text-xs font-bold tracking-wider hidden sm:inline">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA group */}
        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/create"
            className="
              inline-flex items-center gap-2
              px-8 py-3.5 rounded-lg
              bg-accent2 text-bg font-bold text-base tracking-wider
              hover:bg-accent2-hover hover:shadow-glow-lime
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
            "
          >
            Open the editor
            <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            href="https://github.com/enuzzo/prtcl"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              px-6 py-3.5 rounded-lg
              border-2 border-white/30 text-text-secondary text-sm tracking-wider
              hover:border-white/60 hover:text-text
              transition-all duration-200
            "
          >
            <GitHubIcon />
            View on GitHub
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 md:mt-20 animate-bounce" aria-hidden="true">
          <svg className="w-5 h-5 text-text-muted mx-auto" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
