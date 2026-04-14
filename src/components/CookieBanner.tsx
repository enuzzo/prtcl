import { useEffect, useState } from 'react'

const STORAGE_KEY = 'prtcl-consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Minimal GDPR-compliant cookie consent banner.
 *
 * Strategy:
 * - GA loads in `denied` state (Consent Mode v2 set in index.html).
 * - Until the user decides, GA only sends cookieless modeled pings — no cookies, no PII.
 * - On Accept: unlock analytics_storage. On Reject: stay denied.
 * - Decision persisted to localStorage; banner never reappears.
 *
 * Both buttons have equal visual weight (GDPR requirement: reject must be as easy as accept).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Defer paint until after first frame so it slides in cleanly
        const t = setTimeout(() => setVisible(true), 400)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage blocked (private mode / cookies disabled) — show banner each visit
      setVisible(true)
    }
  }, [])

  const decide = (accepted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'rejected')
    } catch {
      /* ignore */
    }
    if (accepted && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-accent/40 bg-surface/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.6)] animate-[slideUp_300ms_ease-out]"
      style={
        {
          // Inline keyframes (avoids touching tailwind config)
          ['--prtcl-anim' as string]: 'slideUp',
        } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-xs leading-relaxed text-text-secondary sm:text-sm">
          We use Google Analytics cookies for anonymous traffic stats — no ads, no cross-site
          tracking, no personal data.{' '}
          <a
            href="/privacy"
            className="text-accent2 underline hover:text-accent2-hover"
          >
            Privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            className="flex-1 rounded-md border border-text-muted/40 bg-transparent px-4 py-2 text-xs font-medium text-text-secondary transition hover:border-text-secondary hover:text-text sm:flex-none sm:text-sm"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="flex-1 rounded-md border border-accent2 bg-accent2 px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110 sm:flex-none sm:text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
