import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BACKGROUND = [8, 4, 14, 255]

const PARTICLES = [
  { cx: 16, cy: 16, r: 4, color: '#FF2BD6', opacity: 1 },
  { cx: 10, cy: 12, r: 2.5, color: '#FF2BD6', opacity: 0.9 },
  { cx: 22, cy: 11, r: 2, color: '#FF2BD6', opacity: 0.7 },
  { cx: 20, cy: 21, r: 1.8, color: '#FF2BD6', opacity: 0.6 },
  { cx: 6, cy: 8, r: 1.5, color: '#7CFF00', opacity: 1 },
  { cx: 26, cy: 6, r: 1.2, color: '#7CFF00', opacity: 0.9 },
  { cx: 27, cy: 24, r: 1.8, color: '#7CFF00', opacity: 0.8 },
  { cx: 8, cy: 24, r: 1, color: '#7CFF00', opacity: 0.7 },
  { cx: 4, cy: 18, r: 0.8, color: '#2CF4FF', opacity: 0.6 },
  { cx: 28, cy: 16, r: 0.7, color: '#2CF4FF', opacity: 0.5 },
  { cx: 14, cy: 5, r: 0.9, color: '#2CF4FF', opacity: 0.5 },
  { cx: 18, cy: 27, r: 0.6, color: '#2CF4FF', opacity: 0.4 },
  { cx: 12, cy: 20, r: 1.2, color: '#FF2BD6', opacity: 0.4 },
  { cx: 24, cy: 17, r: 0.9, color: '#7CFF00', opacity: 0.5 },
  { cx: 9, cy: 16, r: 0.7, color: '#FF2BD6', opacity: 0.3 },
]

const OUTPUTS = [
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/icon-192.png', size: 192 },
  { path: 'public/icon-512.png', size: 512 },
]

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function parseHex(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function drawCircle(pixels, size, particle) {
  const scale = size / 32
  const cx = particle.cx * scale
  const cy = particle.cy * scale
  const radius = particle.r * scale
  const [r, g, b] = parseHex(particle.color)
  const minX = Math.max(0, Math.floor(cx - radius - 1))
  const maxX = Math.min(size - 1, Math.ceil(cx + radius + 1))
  const minY = Math.max(0, Math.floor(cy - radius - 1))
  const maxY = Math.min(size - 1, Math.ceil(cy + radius + 1))

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const distance = Math.sqrt(dx * dx + dy * dy)
      const edge = Math.max(0, Math.min(1, radius + 0.5 - distance))
      const alpha = particle.opacity * edge
      if (alpha <= 0) continue

      const offset = (y * size + x) * 4
      pixels[offset] = Math.round(r * alpha + pixels[offset] * (1 - alpha))
      pixels[offset + 1] = Math.round(g * alpha + pixels[offset + 1] * (1 - alpha))
      pixels[offset + 2] = Math.round(b * alpha + pixels[offset + 2] * (1 - alpha))
      pixels[offset + 3] = 255
    }
  }
}

function createPng(size) {
  const pixels = new Uint8Array(size * size * 4)
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = BACKGROUND[0]
    pixels[i + 1] = BACKGROUND[1]
    pixels[i + 2] = BACKGROUND[2]
    pixels[i + 3] = BACKGROUND[3]
  }

  for (const particle of PARTICLES) {
    drawCircle(pixels, size, particle)
  }

  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    Buffer.from(pixels.subarray(y * size * 4, (y + 1) * size * 4)).copy(raw, rowStart + 1)
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const output of OUTPUTS) {
  writeFileSync(output.path, createPng(output.size))
  console.log(`wrote ${output.path}`)
}
