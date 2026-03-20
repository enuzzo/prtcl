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
        {/* Logo */}
        <a href="/" className="flex items-baseline gap-0.5 group" aria-label="PRTCL home">
          <span className="text-accent font-bold text-lg tracking-[0.15em]">PRTCL</span>
          <span className="text-text-muted text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            .ES
          </span>
        </a>

        {/* CTA */}
        <a
          href="/create"
          className="
            px-5 py-2 rounded-md
            bg-accent2 text-bg font-bold text-sm tracking-wider
            hover:bg-accent2-hover hover:shadow-glow-lime
            transition-all duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2
          "
        >
          Create
        </a>
      </nav>
    </header>
  )
}
