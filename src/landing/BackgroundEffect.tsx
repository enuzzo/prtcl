import { useState, useEffect } from 'react'
import BackgroundCanvas from './BackgroundCanvas'

/**
 * Three.js background effect for the landing page.
 * Lazy-loaded by LandingPage — this file (and Three.js) is never in the
 * initial bundle. Fades in with a 2s CSS opacity transition.
 */
export function BackgroundEffect() {
  const [visible, setVisible] = useState(false)

  // Fade in one frame after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="fixed inset-0 z-0 transition-opacity duration-[2000ms]"
      style={{ opacity: visible ? 0.6 : 0 }}
      aria-hidden="true"
    >
      <BackgroundCanvas />
    </div>
  )
}
