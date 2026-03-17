import type { Effect } from '../../engine/types'

export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Warp speed. Simple premise. Unreasonably mesmerizing.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['starfield', 'warp', 'space', 'abstract'],
  particleCount: 14000,
  pointSize: 4,
  cameraDistance: 7,
  cameraPosition: [-2.531, 1.678, -6.465],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  cameraZoom: 0.7,
  controls: { speed: 2.151, spread: 8.955 },
  createdAt: '2026-03-01',
  code: `
var speed = addControl('speed', 'Speed', 0.1, 5, 2);
var spread = addControl('spread', 'Spread', 3, 20, 9);

setInfo('Starfield', 'Warp-speed stars');

// 6 deterministic hash values
var h = i * 2654435761;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = (h >>> 16) ^ h;
var hash1 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash2 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash3 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash4 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash5 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash6 = (h & 0xffff) / 65535;

// Large cube — camera sits deep inside, edges far beyond visible range
var side = spread * 6;
var half = side * 0.5;

// Initial position (uniform in cube volume)
var x0 = (hash1 - 0.5) * side;
var y0 = (hash2 - 0.5) * side;
var z0 = (hash3 - 0.5) * side;

// Per-star velocity direction (uniform on sphere — every star flies its own way)
var vTheta = hash4 * Math.PI * 2;
var vPhi = Math.acos(2 * hash5 - 1);
var vx = Math.sin(vPhi) * Math.cos(vTheta);
var vy = Math.sin(vPhi) * Math.sin(vTheta);
var vz = Math.cos(vPhi);

// Move + per-axis toroidal wrap (seamless, no visible boundaries)
var t = time * speed * 2;
var x = (((x0 + vx * t) % side) + side * 1.5) % side - half;
var y = (((y0 + vy * t) % side) + side * 1.5) % side - half;
var z = (((z0 + vz * t) % side) + side * 1.5) % side - half;

target.set(x, y, z);

// Per-star brightness + slight color variation
var lum = 0.3 + hash6 * 0.7;
color.setHSL(0.58 + hash4 * 0.12, 0.15 + hash5 * 0.15, lum);
`,
}
