import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EditorLayout } from './editor/EditorLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/gallery" element={<div>Gallery</div>} />
        <Route path="*" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
