import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { FeatureBento } from './FeatureBento'
import { EffectShowcase } from './EffectShowcase'
import { FinalCTA } from './FinalCTA'
import { LandingFooter } from './LandingFooter'
import { BackgroundEffect } from './BackgroundEffect'

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-text font-mono antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent2 focus:text-bg focus:rounded-md focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* Fixed Three.js background — lazy-loaded after paint */}
      <BackgroundEffect />

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
