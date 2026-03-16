import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create" element={<div>Editor</div>} />
        <Route path="/gallery" element={<div>Gallery</div>} />
        <Route path="*" element={<div>PRTCL</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
