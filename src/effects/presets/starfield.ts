import type { Effect } from '../../engine/types'

export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Warp-speed stars streaking through space',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['starfield', 'warp', 'space', 'abstract'],
  particleCount: 10000,
  cameraDistance: 1,
  createdAt: '2026-03-01',
  code: `
var speed = addControl('speed', 'Speed', 0.1, 5, 1.5);
var spread = addControl('spread', 'Spread', 1, 10, 4);

setInfo('Starfield', 'Warp-speed stars');

// Deterministic hash for position
var h = i * 2654435761;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = (h >>> 16) ^ h;
var hash1 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash2 = (h & 0xffff) / 65535;

// XY spread
var x = (hash1 - 0.5) * spread;
var y = (hash2 - 0.5) * spread;

// Z movement with modulo wrapping
var depth = 20;
var zBase = (i / count) * depth;
var z = ((zBase - time * speed * 2) % depth + depth) % depth - depth * 0.5;

target.set(x, y, z);

// Brighter as stars get closer (more negative z viewed from cam at z=0)
var brightness = 1 - (z + depth * 0.5) / depth;
var lum = 0.3 + brightness * 0.7;
color.setHSL(0.6 + brightness * 0.1, 0.3, lum);
`,
}
