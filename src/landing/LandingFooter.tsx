import { GitHubIcon } from './icons'
import { VERSION_TAG } from '../version'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg/90 backdrop-blur-sm py-8 px-6 md:px-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: brand + version */}
        <div className="flex items-center gap-3">
          <span className="text-accent font-bold text-sm tracking-[0.15em]">PRTCL</span>
          <span className="text-text-muted/50 text-[10px] font-mono">{VERSION_TAG}</span>
          <span className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} Netmilk Studio
          </span>
        </div>

        {/* Center: links */}
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <a href="/create" className="hover:text-text transition-colors">
            Editor
          </a>
          <a
            href="https://github.com/enuzzo/prtcl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-text transition-colors"
          >
            <GitHubIcon size={14} />
            GitHub
          </a>
        </div>

        {/* Right: license + tagline */}
        <p className="text-text-muted text-xs">
          MIT License &middot; Runs on math and stubbornness.
        </p>
      </div>
    </footer>
  )
}
