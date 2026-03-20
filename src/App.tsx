import { lazy, Suspense, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import { SplashScreen } from './components/SplashScreen'
import { useStore } from './store'

// Lazy-load heavy routes so Three.js/R3F never loads on the landing page
const EditorLayout = lazy(() =>
  import('./editor/EditorLayout').then((m) => ({ default: m.EditorLayout })),
)
const EmbedView = lazy(() =>
  import('./embed/EmbedView').then((m) => ({ default: m.EmbedView })),
)

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const isCreate = location.pathname === '/create'

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
