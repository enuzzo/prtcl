import { useState } from 'react'

interface ShowcaseEffect {
  id: string
  name: string
  description: string
  embedParams: string
}

const SHOWCASE_EFFECTS: ShowcaseEffect[] = [
  {
    id: 'frequency',
    name: 'Fractal Frequency',
    description: 'Mathematical beauty in motion',
    embedParams: '&rotate=1&orbit=0&badge=0',
  },
  {
    id: 'nebula-organica',
    name: 'Nebula',
    description: 'Organic cosmic dust',
    embedParams: '&rotate=0.5&orbit=0&badge=0',
  },
  {
    id: 'medusa',
    name: 'Medusa',
    description: 'Bioluminescent jellyfish',
    embedParams: '&rotate=1&orbit=0&badge=0',
  },
  {
    id: 'hopf-fibration',
    name: 'Hopf Fibration',
    description: 'Topology made visible',
    embedParams: '&rotate=1.5&orbit=0&badge=0',
  },
]

function ShowcaseCard({ id, name, description, embedParams }: ShowcaseEffect) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border bg-surface/30 hover:border-accent/40 transition-all duration-300">
      {/* Iframe container — 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] bg-bg">
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        <iframe
          src={`/embed?effect=${id}${embedParams}`}
          title={`${name} particle effect preview`}
          className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

        {/* Hover overlay with CTA */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-bg/80 via-transparent to-transparent
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            flex items-end justify-between
            p-5
          "
        >
          <div>
            <h3 className="text-base font-bold">{name}</h3>
            <p className="text-text-muted text-xs mt-1">{description}</p>
          </div>
          <a
            href={`/create#effect=${id}`}
            className="
              shrink-0 ml-4
              px-4 py-2 rounded-md
              bg-accent2/90 text-bg text-xs font-bold tracking-wider
              hover:bg-accent2
              transition-colors duration-200
            "
          >
            Try this &rarr;
          </a>
        </div>
      </div>

      {/* Label below iframe */}
      <div className="px-5 py-3.5 flex items-center justify-between">
        <span className="text-sm font-bold">{name}</span>
        <a
          href={`/create#effect=${id}`}
          className="text-accent2 text-xs tracking-wider hover:text-accent2-hover transition-colors"
        >
          Open &rarr;
        </a>
      </div>
    </div>
  )
}

export function EffectShowcase() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/85 backdrop-blur-sm" aria-labelledby="showcase-heading">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-3">Effects</p>
        <h2
          id="showcase-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6"
        >
          Seventeen effects.{' '}
          <span className="text-text-muted">One excuse to procrastinate.</span>
        </h2>
        <p className="text-text-secondary text-base md:text-lg max-w-2xl mb-16 md:mb-20 leading-relaxed">
          Math, organic, creatures, text, abstract &mdash; each one hand-tuned
          with real-time controls. Pick one, make it yours, pretend you wrote the shader.
        </p>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 sm:hidden [&::-webkit-scrollbar]:hidden">
          {SHOWCASE_EFFECTS.map((effect) => (
            <div key={effect.id} className="snap-center shrink-0 w-[85vw]">
              <ShowcaseCard {...effect} />
            </div>
          ))}
        </div>

        {/* Desktop: 2x2 grid */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-5 lg:gap-6">
          {SHOWCASE_EFFECTS.map((effect) => (
            <ShowcaseCard key={effect.id} {...effect} />
          ))}
        </div>
      </div>
    </section>
  )
}
