import { SpeedIcon, CodeIcon, TextIcon, HandIcon, HeartIcon } from './icons'

interface BentoCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: string
}

function BentoCard({ icon, title, description, accentColor = '#FF2BD6' }: BentoCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-xl
        bg-surface/40 backdrop-blur-lg
        border-2 border-border
        p-5
        hover:border-accent/40 hover:bg-surface/60
        transition-all duration-300 ease-out
      "
    >
      {/* Icon + Title inline */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm leading-snug">
        {description}
      </p>
    </div>
  )
}

const CARDS: BentoCardProps[] = [
  {
    icon: <SpeedIcon />,
    title: '20k @ 60fps',
    description:
      'Custom WebGL shaders with adaptive quality. Scales itself down on weak hardware before anything melts. Twenty thousand points doing absolutely nothing useful, beautifully.',
    accentColor: '#7CFF00',
  },
  {
    icon: <CodeIcon />,
    title: 'Copy. Paste. Done.',
    description:
      'Exports one self-contained snippet. HTML, React, or iframe. No npm install, no build step. It just works. We\'re as surprised as you are.',
    accentColor: '#FF2BD6',
  },
  {
    icon: <TextIcon />,
    title: 'Text → particles',
    description:
      'Type a word. Pick a font. Watch 20,000 points form your letters, hold still for a moment of false hope, then dissolve into entropy. Three effects, 12 fonts.',
    accentColor: '#2CF4FF',
  },
  {
    icon: <HandIcon />,
    title: 'Hand tracking',
    description:
      'Open your palm at the webcam. Orbit the scene, attract particles, scatter them. MediaPipe WASM, no plugin. You\'re waving at your screen alone. We don\'t judge.',
    accentColor: '#FF2BD6',
  },
  {
    icon: <HeartIcon />,
    title: 'Free. MIT. Forever.',
    description:
      'No accounts. No watermarks. No emails. The code is on GitHub. Fork it, break it, claim you wrote it. The universe is indifferent and so are we.',
    accentColor: '#7CFF00',
  },
]

export function FeatureBento() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/90 backdrop-blur-sm" aria-labelledby="features-heading">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-3">What it does</p>
        <h2
          id="features-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-12 md:mb-16"
        >
          Five features.
          <br />
          <span className="text-text-muted">All equally unnecessary.</span>
        </h2>

        {/* Flat 3x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {CARDS.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
