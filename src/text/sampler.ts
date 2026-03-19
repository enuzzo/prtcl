/**
 * Sample text into a Float32Array of 3D points with optional color.
 *
 * Format: 6 values per point → [x, y, z, r, g, b] interleaved.
 *   - x, y, z: world-space position (z = 0 for flat text)
 *   - r, g, b: sampled color normalized 0-1 (white for plain text, native color for emoji)
 *
 * Uses an offscreen canvas to render text, scans pixel alpha,
 * normalizes to world-space coordinates centered at origin.
 */
export function sampleText(
  text: string,
  font: string,
  weight: string,
  targetCount: number,
  lineSpacing = 1.0,
): Float32Array {
  if (!text.trim()) return new Float32Array(targetCount * 6)

  const fontSize = 120
  const fontStr = `${weight} ${fontSize}px "${font}", "Inconsolata", monospace`

  // Split text into lines for multiline support
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return new Float32Array(targetCount * 6)

  // Measure each line to find widest, compute total height
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = fontStr
  const lineHeight = fontSize * lineSpacing
  let maxW = 0
  for (const line of lines) {
    const w = measure.measureText(line).width
    if (w > maxW) maxW = w
  }
  const textW = Math.ceil(maxW) + fontSize  // padding
  const textH = Math.ceil(lineHeight * lines.length) + fontSize

  // Render text on offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = textW
  canvas.height = textH
  const ctx = canvas.getContext('2d')!
  ctx.font = fontStr
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  // Draw each line centered vertically
  const totalTextH = lineHeight * lines.length
  const startY = (textH - totalTextH) / 2 + lineHeight / 2
  for (let li = 0; li < lines.length; li++) {
    ctx.fillText(lines[li]!, textW / 2, startY + li * lineHeight)
  }

  // Scan pixels — collect positions + RGB where alpha > 128
  const imageData = ctx.getImageData(0, 0, textW, textH)
  const pixels = imageData.data
  const step = 2
  const raw: { x: number; y: number; r: number; g: number; b: number }[] = []

  for (let y = 0; y < textH; y += step) {
    for (let x = 0; x < textW; x += step) {
      const idx = (y * textW + x) * 4
      const alpha = pixels[idx + 3] ?? 0
      if (alpha > 128) {
        raw.push({
          x,
          y,
          r: (pixels[idx] ?? 255) / 255,
          g: (pixels[idx + 1] ?? 255) / 255,
          b: (pixels[idx + 2] ?? 255) / 255,
        })
      }
    }
  }

  if (raw.length === 0) return new Float32Array(targetCount * 6)

  // Normalize to world space: center at origin, scale to [-spread, spread]
  const spread = 4
  const aspect = textW / textH
  const scaleX = (spread * 2 * aspect) / textW
  const scaleY = (spread * 2) / textH
  const cx = textW / 2
  const cy = textH / 2

  const normalized = raw.map((p) => ({
    x: (p.x - cx) * scaleX,
    y: -(p.y - cy) * scaleY,  // flip Y (canvas Y is down, world Y is up)
    r: p.r,
    g: p.g,
    b: p.b,
  }))

  // X-sort for spatial coherence
  normalized.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y)

  // Resample to target count — 6 values per point: x, y, z, r, g, b
  const result = new Float32Array(targetCount * 6)
  const n = normalized.length

  for (let i = 0; i < targetCount; i++) {
    const srcIdx = i < n
      ? i
      : Math.floor(Math.random() * n)  // jitter-duplicate
    const p = normalized[srcIdx]!
    const jitterX = i < n ? 0 : (Math.random() - 0.5) * 0.05
    const jitterY = i < n ? 0 : (Math.random() - 0.5) * 0.05
    result[i * 6]     = p.x + jitterX
    result[i * 6 + 1] = p.y + jitterY
    result[i * 6 + 2] = 0    // flat Z
    result[i * 6 + 3] = p.r  // red 0-1
    result[i * 6 + 4] = p.g  // green 0-1
    result[i * 6 + 5] = p.b  // blue 0-1
  }

  return result
}
