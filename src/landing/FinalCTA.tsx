const FLOATING_DOTS = [
  { x: '10%', y: '20%', size: 3, color: '#FF2BD6', duration: 6, delay: 0 },
  { x: '85%', y: '30%', size: 4, color: '#7CFF00', duration: 7, delay: 1.5 },
  { x: '25%', y: '75%', size: 2, color: '#A98ED1', duration: 5, delay: 0.8 },
  { x: '70%', y: '60%', size: 5, color: '#FF2BD6', duration: 8, delay: 2.2 },
  { x: '50%', y: '15%', size: 3, color: '#7CFF00', duration: 6.5, delay: 3 },
  { x: '90%', y: '80%', size: 2, color: '#2CF4FF', duration: 5.5, delay: 1 },
]

export function FinalCTA() {
  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-10 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 100%, rgba(255,43,214,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 20% 50%, rgba(124,255,0,0.08) 0%, transparent 50%),
            rgba(8,4,14,0.88)
          `,
        }}
        aria-hidden="true"
      />

      {/* Floating dots (CSS animated) */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {FLOATING_DOTS.map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              opacity: 0.15,
              animation: `float ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <h2
          id="cta-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6"
        >
          Your website has enough stock photos.
        </h2>
        <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-10 md:mb-12">
          Particles load faster than a hero image and look better than a gradient.
          Two clicks from here to running code.
        </p>
        <a
          href="/create"
          className="
            inline-flex items-center gap-2
            px-10 py-4 rounded-lg
            bg-accent2 text-bg font-bold text-lg tracking-wider
            hover:bg-accent2-hover hover:shadow-glow-lime
            transition-all duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
          "
        >
          Start creating
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </section>
  )
}
