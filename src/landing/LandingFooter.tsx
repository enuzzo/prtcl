import { GitHubIcon } from './icons'
import { VERSION_TAG } from '../version'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg py-10 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Top row: brand block + footer nav */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-8 border-b border-border/60">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-accent font-bold text-base tracking-[0.2em]">PRTCL</span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-text-muted/70">
                Specimen Catalog
              </span>
            </div>
            <p className="mt-3 text-xs text-text-muted max-w-xs leading-relaxed">
              A free, open-source particle engine for the web. Made for people who should be doing something else.
            </p>
          </div>

          <nav className="flex flex-wrap items-start gap-x-10 gap-y-6 text-[10px] tracking-[0.25em] uppercase" aria-label="Footer">
            <div className="flex flex-col gap-2">
              <span className="text-accent2 font-bold">App</span>
              <a href="/create" className="text-text-muted hover:text-text transition-colors">
                Editor
              </a>
              <a
                href="https://github.com/enuzzo/prtcl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text transition-colors inline-flex items-center gap-1.5"
              >
                <GitHubIcon size={11} />
                GitHub
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-accent2 font-bold">Legal</span>
              <a href="/privacy" className="text-text-muted hover:text-text transition-colors">
                Privacy
              </a>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('prtcl-consent')
                  } catch {
                    /* ignore */
                  }
                  window.location.reload()
                }}
                className="text-text-muted hover:text-text transition-colors cursor-pointer text-left uppercase tracking-[0.25em]"
              >
                Cookie Prefs
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom row: meta line */}
        <div className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[10px] tracking-[0.2em] uppercase text-text-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="tabular-nums text-text-muted/80">{VERSION_TAG}</span>
            <span className="opacity-40">·</span>
            <span>MIT License</span>
            <span className="opacity-40">·</span>
            <span>© {new Date().getFullYear()} Netmilk Studio</span>
          </div>
          <p className="text-text-muted/70 normal-case tracking-normal text-[11px]">
            Powered by WebGL and poor life choices.
          </p>
        </div>
      </div>
    </footer>
  )
}
