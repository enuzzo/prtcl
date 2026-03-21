import { useState, useEffect, type ComponentType } from 'react'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { FeatureBento } from './FeatureBento'
import { EffectShowcase } from './EffectShowcase'
import { FinalCTA } from './FinalCTA'
import { LandingFooter } from './LandingFooter'

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
const hasIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window

export function LandingPage() {
  const [BgComponent, setBgComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    // Skip 3D background entirely on mobile
    if (isMobile) return

    const load = () => {
      import('./BackgroundEffect').then((m) => {
        setBgComponent(() => m.BackgroundEffect)
      })
    }

    if (hasIdleCallback) {
      const id = window.requestIdleCallback(load, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(load, 800)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="min-h-dvh bg-bg text-text font-mono antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent2 focus:text-bg focus:rounded-md focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* Fixed Three.js background — loaded after idle, skipped on mobile */}
      {BgComponent && <BgComponent />}

      {/* All page content sits above the background canvas */}
      <div className="relative z-10">
        <LandingNav />
        <main id="main-content">
          <LandingHero />
          <FeatureBento />
          <EffectShowcase />
          <FinalCTA />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}
