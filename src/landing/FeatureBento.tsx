import { SpeedIcon, CodeIcon, TextIcon, HandIcon, MicIcon, HeartIcon } from './icons'

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
      <p className="text-text-secondary text-xs leading-relaxed">
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
      'WebGL shader renders 20,000 particles with adaptive quality scaling. Weighs less than your cookie banner.',
    accentColor: '#7CFF00',
  },
  {
    icon: <CodeIcon />,
    title: 'Export anywhere',
    description:
      'Self-contained HTML, React, or iframe. Elementor, Webflow, Wix, WordPress. Two clicks. We timed it.',
    accentColor: '#FF2BD6',
  },
  {
    icon: <TextIcon />,
    title: 'Text to particles',
    description:
      '12 Google Fonts sampled to point clouds in real-time. Your words dissolve into light. Dramatic? Absolutely.',
    accentColor: '#2CF4FF',
  },
  {
    icon: <HandIcon />,
    title: 'Gesture control',
    description:
      'MediaPipe hand tracking via webcam. Orbit camera or disrupt particles with your palm. Gloves sold separately.',
    accentColor: '#FF2BD6',
  },
  {
    icon: <MicIcon />,
    title: 'Sound-driven',
    description:
      'FFT analysis splits mic input into bass, mids, highs + beat detection. Your music becomes geometry. Your neighbor\'s too.',
    accentColor: '#FF2BD6',
  },
  {
    icon: <HeartIcon />,
    title: 'Free. MIT. Forever.',
    description:
      'No accounts. No trials. No "let\'s schedule a call." Fork it, break it, ship it. We\'ll probably still respect you.',
    accentColor: '#7CFF00',
  },
]

export function FeatureBento() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/90 backdrop-blur-sm" aria-labelledby="features-heading">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-3">Features</p>
        <h2
          id="features-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-12 md:mb-16"
        >
          Everything you need.
          <br />
          <span className="text-text-muted">Nothing you don&apos;t.</span>
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
