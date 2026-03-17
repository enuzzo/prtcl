import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EditorLayout } from './editor/EditorLayout'
import { SplashScreen } from './components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Routes>
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/gallery" element={<div>Gallery</div>} />
        <Route path="*" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
