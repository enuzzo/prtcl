import { SpeedIcon, CodeIcon, TextIcon, HandIcon, HeartIcon } from './icons'

interface Feature {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  accent: 'lime' | 'pink' | 'cyan'
}

const FEATURES: Feature[] = [
  {
    id: 'F-02',
    icon: <CodeIcon />,
    title: 'Copy. Paste. Done.',
    description:
      'One self-contained snippet. HTML, React, or iframe. No npm install, no build step, no package graph. It just works. We\'re as surprised as you are.',
    accent: 'pink',
  },
  {
    id: 'F-03',
    icon: <TextIcon />,
    title: 'Text → particles',
    description:
      'Type a word. Pick a font. Watch 20,000 points form your letters, hold still for a moment of false hope, then dissolve. Three effects, twelve fonts.',
    accent: 'cyan',
  },
  {
    id: 'F-04',
    icon: <HandIcon />,
    title: 'Hand tracking',
    description:
      'Open your palm at the webcam. Orbit the scene, attract particles, scatter them. MediaPipe WASM, no plugin. You\'re waving at your screen alone. We don\'t judge.',
    accent: 'pink',
  },
  {
    id: 'F-05',
    icon: <HeartIcon />,
    title: 'Free. MIT. Forever.',
    description:
      'No accounts. No watermarks. No emails. The code is on GitHub. Fork it, break it, claim you wrote it. The universe is indifferent and so are we.',
    accent: 'lime',
  },
]

const STATS = [
  { value: '22', label: 'Effects', accent: 'pink' },
  { value: '0', label: 'Accounts', accent: 'lime' },
  { value: '∞', label: 'Exports', accent: 'pink' },
  { value: 'MIT', label: 'License', accent: 'lime' },
]

function accentClass(a: Feature['accent']) {
  return a === 'lime' ? 'text-accent2' : a === 'cyan' ? 'text-info' : 'text-accent'
}

function accentBorder(a: Feature['accent']) {
  return a === 'lime'
    ? 'hover:border-accent2/50'
    : a === 'cyan'
    ? 'hover:border-info/50'
    : 'hover:border-accent/50'
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article
      className={`
        group relative
        bg-surface/30 backdrop-blur-md
        border border-border ${accentBorder(feature.accent)}
        p-5 sm:p-6
        transition-colors duration-300
      `}
    >
      {/* Header row: ID + icon */}
      <div className="flex items-start justify-between mb-4">
        <span className={`text-[10px] tracking-[0.3em] uppercase font-bold ${accentClass(feature.accent)}`}>
          {feature.id}
        </span>
        <div className={`w-6 h-6 flex items-center justify-center ${accentClass(feature.accent)} opacity-70`}>
          {feature.icon}
        </div>
      </div>
      <h3 className="text-base md:text-lg font-bold tracking-tight mb-2 leading-tight">
        {feature.title}
      </h3>
      <p className="text-text-secondary text-sm leading-snug">
        {feature.description}
      </p>
    </article>
  )
}

export function FeatureBento() {
  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/90 backdrop-blur-sm overflow-hidden"
      aria-labelledby="features-heading"
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
        {/* Section meta header — like a chapter marker in a catalog */}
        <div className="flex items-baseline gap-3 text-[11px] tracking-[0.25em] uppercase text-text-muted mb-6">
          <span className="inline-block w-1.5 h-1.5 bg-accent translate-y-[1px]" aria-hidden="true" />
          <span className="text-accent">§ 02</span>
          <span className="opacity-40">·</span>
          <span>Capabilities</span>
        </div>

        <h2
          id="features-heading"
          className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95] mb-4"
        >
          Five features.
        </h2>
        <p className="text-text-muted text-xl md:text-2xl tracking-tight mb-14 md:mb-20">
          All equally unnecessary.
        </p>

        {/* Asymmetric grid: dominant stat card on left, feature stack on right (desktop only) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 md:gap-5 items-stretch">
          {/* F-01: the hero speed card — giant "60" */}
          <article
            className="
              relative overflow-hidden
              bg-surface/40 backdrop-blur-md
              border border-border hover:border-accent2/50
              p-6 md:p-8
              transition-colors duration-300
              min-h-[320px] lg:min-h-full
              flex flex-col justify-between
              group
            "
          >
            {/* Corner ticks */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent2" aria-hidden="true" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent2" aria-hidden="true" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent2" aria-hidden="true" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent2" aria-hidden="true" />

            <div className="flex items-start justify-between">
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-accent2">
                F-01
              </span>
              <div className="w-6 h-6 flex items-center justify-center text-accent2 opacity-70">
                <SpeedIcon />
              </div>
            </div>

            {/* Giant number — the centerpiece */}
            <div className="my-6 md:my-10 leading-none">
              <div className="flex items-start gap-2">
                <span className="text-[clamp(5rem,14vw,9rem)] font-bold text-accent2 tracking-tighter tabular-nums leading-[0.85]">
                  60
                </span>
                <span className="text-xl md:text-2xl text-text-muted mt-3 tracking-tight">
                  fps
                </span>
              </div>
              <div className="mt-2 text-sm md:text-base text-text-muted tracking-[0.15em] uppercase">
                at 20k particles
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-lg font-bold tracking-tight mb-2">
                Fast, mostly.
              </h3>
              <p className="text-text-secondary text-sm leading-snug max-w-md">
                Custom WebGL shaders with adaptive quality. Scales itself down on weak hardware
                before anything melts. Twenty thousand points doing absolutely nothing useful, beautifully.
              </p>
            </div>
          </article>

          {/* Right column: 2×2 of the other four features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {FEATURES.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
          </div>
        </div>

        {/* Stats strip — the catalog summary */}
        <div className="mt-16 md:mt-20 border-t border-b border-border py-6 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-border">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center md:px-4">
                <div
                  className={`text-3xl md:text-5xl font-bold tracking-tight tabular-nums ${
                    stat.accent === 'lime' ? 'text-accent2' : 'text-accent'
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-text-muted mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
