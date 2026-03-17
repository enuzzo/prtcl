import type { Effect } from '../../engine/types'

export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Warp speed. Simple premise. Unreasonably mesmerizing.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['starfield', 'warp', 'space', 'abstract'],
  particleCount: 23000,
  pointSize: 3.3,
  cameraDistance: 1,
  cameraPosition: [-5.292, 0.027, -8.177],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  controls: { speed: 1.5, spread: 23.708 },
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
}
