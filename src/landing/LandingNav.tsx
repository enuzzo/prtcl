import { useEffect, useState } from 'react'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 64)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          h-14 px-6 md:px-10
          flex items-center justify-between
          transition-all duration-300 ease-out
          ${scrolled
            ? 'bg-surface/90 backdrop-blur-md border-b border-border shadow-[0_1px_20px_rgba(8,4,14,0.8)]'
            : 'bg-transparent border-b border-transparent'
          }
        `}
        aria-label="Main navigation"
      >
        {/* Logo + specimen ID */}
        <a href="/" className="flex items-baseline gap-3 group" aria-label="PRTCL home">
          <span className="flex items-baseline gap-0.5">
            <span className="text-accent font-bold text-lg tracking-[0.15em]">PRTCL</span>
            <span className="text-text-muted text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              .ES
            </span>
          </span>
          <span
            className={`
              hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-text-muted/60
              transition-opacity duration-300
              ${scrolled ? 'opacity-100' : 'opacity-0'}
            `}
            aria-hidden="true"
          >
            Specimen Catalog
          </span>
        </a>

        <div className="flex items-center gap-3 md:gap-5">
          <a
            href="https://github.com/enuzzo/prtcl"
            target="_blank"
            rel="noopener noreferrer"
            className="
              hidden sm:inline-flex items-center
              text-text-muted text-[10px] tracking-[0.25em] uppercase font-bold
              hover:text-text transition-colors duration-200
            "
          >
            Source
          </a>
          <a
            href="/create"
            className="
              inline-flex items-center gap-2
              px-5 py-2
              bg-accent2 text-bg font-bold text-xs tracking-[0.2em] uppercase
              hover:bg-accent2-hover hover:shadow-glow-lime
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
            "
          >
            <span className="text-[10px] opacity-70 tracking-[0.25em] font-normal">./</span>
            Create
          </a>
        </div>
      </nav>
    </header>
  )
}
