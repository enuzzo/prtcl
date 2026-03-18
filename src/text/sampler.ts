/**
 * Sample text into a Float32Array of 3D points (x, y, z interleaved).
 * Uses an offscreen canvas to render text, scans pixel alpha,
 * normalizes to world-space coordinates centered at origin.
 */
export function sampleText(
  text: string,
  font: string,
  weight: string,
  targetCount: number,
): Float32Array {
  if (!text.trim()) return new Float32Array(targetCount * 3)

  const fontSize = 120
  const fontStr = `${weight} ${fontSize}px "${font}", "Inconsolata", monospace`

  // Measure text to size canvas
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = fontStr
  const metrics = measure.measureText(text)
  const textW = Math.ceil(metrics.width) + fontSize  // padding
  const textH = fontSize * 2

  // Render text on offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = textW
  canvas.height = textH
  const ctx = canvas.getContext('2d')!
  ctx.font = fontStr
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, textW / 2, textH / 2)

  // Scan pixels — collect positions where alpha > 128
  const imageData = ctx.getImageData(0, 0, textW, textH)
  const pixels = imageData.data
  const step = 2
  const raw: [number, number][] = []

  for (let y = 0; y < textH; y += step) {
    for (let x = 0; x < textW; x += step) {
      const alpha = pixels[(y * textW + x) * 4 + 3] ?? 0
      if (alpha > 128) raw.push([x, y])
    }
  }

  if (raw.length === 0) return new Float32Array(targetCount * 3)

  // Normalize to world space: center at origin, scale to [-spread, spread]
  const spread = 4
  const aspect = textW / textH
  const scaleX = (spread * 2 * aspect) / textW
  const scaleY = (spread * 2) / textH
  const cx = textW / 2
  const cy = textH / 2

  const normalized = raw.map(([x, y]) => [
    (x - cx) * scaleX,
    -(y - cy) * scaleY,  // flip Y (canvas Y is down, world Y is up)
  ] as [number, number])

  // X-sort for spatial coherence
  normalized.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])

  // Resample to target count
  const result = new Float32Array(targetCount * 3)
  const n = normalized.length

  for (let i = 0; i < targetCount; i++) {
    const srcIdx = i < n
      ? i
      : Math.floor(Math.random() * n)  // jitter-duplicate
    const [px, py] = normalized[srcIdx]!
    const jitterX = i < n ? 0 : (Math.random() - 0.5) * 0.05
    const jitterY = i < n ? 0 : (Math.random() - 0.5) * 0.05
    result[i * 3]     = px + jitterX
    result[i * 3 + 1] = py + jitterY
    result[i * 3 + 2] = 0  // flat Z
  }

  return result
}
