import { useState, useEffect, lazy, Suspense } from 'react'

/**
 * Lazy-loaded Three.js background effect for the landing page.
 *
 * Strategy: mount AFTER initial paint so Lighthouse scores the fast
 * static page. The R3F canvas loads asynchronously, then fades in.
 * Renders Fractal Frequency at reduced particle count (8k) for perf.
 */

// Lazy-load the heavy R3F inner component (Three.js stays out of initial bundle)
const BackgroundCanvas = lazy(() => import('./BackgroundCanvas'))

const hasIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window

export function BackgroundEffect() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Delay mount until browser is idle — Lighthouse sees fast FCP/LCP
    const activate = () => setReady(true)

    if (hasIdleCallback) {
      const id = window.requestIdleCallback(activate, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(activate, 800)
    return () => clearTimeout(id)
  }, [])

  if (!ready) return null

  return (
    <div
      className="fixed inset-0 z-0 transition-opacity duration-[2000ms]"
      style={{ opacity: ready ? 0.6 : 0 }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <BackgroundCanvas />
      </Suspense>
    </div>
  )
}
