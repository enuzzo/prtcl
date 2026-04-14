import { lazy, Suspense, useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import { PrivacyPolicy } from './landing/PrivacyPolicy'
import { SplashScreen } from './components/SplashScreen'
import { CookieBanner } from './components/CookieBanner'
import { useStore } from './store'
import { useIsMobile } from './hooks/useIsMobile'

// Lazy-load heavy routes so Three.js/R3F never loads on the landing page
const EditorLayout = lazy(() =>
  import('./editor/EditorLayout').then((m) => ({ default: m.EditorLayout })),
)
const EmbedView = lazy(() =>
  import('./embed/EmbedView').then((m) => ({ default: m.EmbedView })),
)

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
  )
  const location = useLocation()
  const isMobile = useIsMobile()
  const isCreate = location.pathname === '/create'
  const isEmbed = location.pathname === '/embed'

  useEffect(() => {
    if (isCreate && isMobile) {
      setShowSplash(false)
      useStore.getState().setIntroPhase('complete')
    }
  }, [isCreate, isMobile])

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
    // Trigger staggered UI panel reveal
    useStore.getState().setIntroPhase('revealing')
  }, [])

  // When explosion starts, trigger camera zoom from far → preset position
  const handleExplodeStart = useCallback(() => {
    const effect = useStore.getState().selectedEffect
    if (effect) {
      useStore.getState().setCameraPosition(effect.cameraPosition ?? [0, 0, 5])
      useStore.getState().setCameraTarget(effect.cameraTarget ?? [0, 0, 0])
    }
  }, [])

  return (
    <>
      {/* Splash only plays on /create */}
      {showSplash && isCreate && (
        <SplashScreen onComplete={handleSplashComplete} onExplodeStart={handleExplodeStart} />
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route
          path="/create"
          element={
            <Suspense fallback={<div className="h-dvh bg-bg" />}>
              <EditorLayout />
            </Suspense>
          }
        />
        <Route
          path="/embed"
          element={
            <Suspense fallback={null}>
              <EmbedView />
            </Suspense>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      {/* Cookie consent: not on /embed (third-party iframes have their own banner) */}
      {!isEmbed && <CookieBanner />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
