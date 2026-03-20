import { GitHubIcon } from './icons'

/* Platform brand icons — simple SVGs at 20px */
function ElementorIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 7h2v10h-2V7zm-3 3h2v4H7.5v-4zm9 0h-2v4h2v-4z" />
    </svg>
  )
}

function WebflowIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M17.803 6.085S15.644 10.378 15.52 10.671c-.035-.345-.87-4.586-.87-4.586C13.478 2.906 10.33 2.86 8.96 5.17L4.004 13.53s1.932.095 3.39-.814c1.046-.652 1.56-1.637 1.56-1.637s.856 4.394.975 4.985c.975 4.78 6.127 3.478 7.682.183l4.389-9.164s-2.455-.277-4.197.002z" />
    </svg>
  )
}

function WordPressIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.26 15.22L7.16 8.26c.55-.025 1.05-.07 1.05-.07.5-.06.44-.79-.06-.76 0 0-1.49.12-2.45.12-.17 0-.37-.01-.58-.02C6.68 5.38 9.14 4 12 4c2.13 0 4.07.8 5.54 2.11-.04 0-.07-.01-.11-.01-1 0-1.71.87-1.71 1.8 0 .84.48 1.54 1 2.38.39.67.83 1.53.83 2.78 0 .86-.33 1.86-.77 3.25l-1.01 3.37-3.63-10.82c.55-.025 1.05-.07 1.05-.07.5-.06.44-.79-.06-.76 0 0-1.05.08-1.73.11l-3.68 10.97zm10.39-5.41c.68-1.69.91-3.04.91-4.24 0-.44-.03-.84-.09-1.22A8.97 8.97 0 0 1 21 12c0 2.82-1.3 5.34-3.33 6.98l2.42-7.17zM12 20c-1.16 0-2.27-.25-3.27-.69l3.47-10.08 3.56 9.75.03.06A7.952 7.952 0 0 1 12 20z" />
    </svg>
  )
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-12c-.93 0-1.78.56-2.65 1.68C8.52 4.43 7.87 6.1 7.5 8c-2-.38-3.67-.27-4.79.28C1.6 8.85 1 9.69 1 10.5c0 .93.56 1.78 1.68 2.65C3.93 14.02 5.6 14.63 7.5 15c.38 2 1.02 3.67 1.85 4.79.57 1.11 1.41 1.71 2.15 1.71.93 0 1.78-.56 2.65-1.68.87-1.25 1.52-2.92 1.85-4.82 2 .38 3.67.27 4.79-.28 1.11-.57 1.71-1.41 1.71-2.22 0-.93-.56-1.78-1.68-2.65C19.57 8.98 17.9 8.37 16 8c-.38-2-1.02-3.67-1.85-4.79C13.58 2.1 12.74 1.5 12 1.5z" />
    </svg>
  )
}

function HtmlIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M4.136 3.012h15.729l-1.431 16.15L11.991 21l-6.414-1.837L4.136 3.012zM7.39 8.317l-.261-2.935h9.753l-.086.96-.086.962-.097 1.013H9.57l.174 1.96h6.991l-.26 2.886-.463 2.143-.027.12-3.994 1.106-.002.001-3.987-1.107-.272-3.05h1.94l.139 1.545 2.18.588 2.18-.588.228-2.543H7.655l-.265-2.061z" />
    </svg>
  )
}

function WixIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
      <path d="M4.82 8l1.24 4.64L7.3 8h2.4l1.24 4.64L12.18 8h2.4l-2.64 8h-2.4l-1.24-4.64L7.06 16H4.66L2 8h2.82zm12.36 0l1.68 4.8L20.54 8H23l-3.36 8h-2.4L14.58 8h2.6z" />
    </svg>
  )
}

const PLATFORMS = [
  { icon: <ElementorIcon />, name: 'Elementor' },
  { icon: <WebflowIcon />, name: 'Webflow' },
  { icon: <WixIcon />, name: 'Wix' },
  { icon: <WordPressIcon />, name: 'WordPress' },
  { icon: <ReactIcon />, name: 'React' },
  { icon: <HtmlIcon />, name: 'HTML' },
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
