import type { Effect } from '../../engine/types'

export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Stars approaching at warp. The oldest 3D trick in the book, unchanged since the 1984 demoscene. Still works on your cortex every single time.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['starfield', 'warp', 'space', 'abstract'],
  particleCount: 16000,
  pointSize: 1.45,
  cameraDistance: 1,
  cameraPosition: [-3.927, -0.094, -8.913],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  backgroundPreset: 'onyx',
  cameraZoom: 1,
  controls: {
    speed: 0.803,
    spread: 21.022,
  },
  createdAt: '2026-03-01',
  code: `
var speed = addControl('speed', 'Speed', 0.1, 5, 1.5);
var spread = addControl('spread', 'Spread', 5, 60, 25);

setInfo('Starfield', 'Warp-speed stars');

// Deterministic hash for XY position
var h = i * 2654435761;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = (h >>> 16) ^ h;
var hash1 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash2 = (h & 0xffff) / 65535;

// Fixed XY spread — wide field of stars
var x = (hash1 - 0.5) * spread;
var y = (hash2 - 0.5) * spread;

// Z streams toward camera with modulo wrap — the classic aquarium tunnel
var depth = spread * 2;
var zBase = (i / count) * depth;
var z = ((zBase - time * speed * 2) % depth + depth) % depth - depth * 0.5;

target.set(x, y, z);

// Brighter as stars get closer (more negative z = closer to camera)
var brightness = 1 - (z + depth * 0.5) / depth;
var lum = 0.3 + brightness * 0.7;
color.setHSL(0.6 + brightness * 0.1, 0.3, lum);
`,
  disturbMode: 'scatter',
  disturbRadius: 5.0,
  disturbStrength: 1.5,
}
