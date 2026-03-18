import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { EditorLayout } from './editor/EditorLayout'
import { EmbedView } from './embed/EmbedView'
import { SplashScreen } from './components/SplashScreen'

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const isEmbed = location.pathname === '/embed'

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  return (
    <>
      {showSplash && !isEmbed && <SplashScreen onComplete={handleSplashComplete} />}
      <Routes>
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/embed" element={<EmbedView />} />
        <Route path="/gallery" element={<div>Gallery</div>} />
        <Route path="*" element={<EditorLayout />} />
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
