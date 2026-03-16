import type { Effect } from '../../engine/types'

export const galaxy: Effect = {
  id: 'spiral-galaxy',
  slug: 'spiral-galaxy',
  name: 'Spiral Galaxy',
  description: 'Logarithmic spiral arms with dust lanes and central bulge',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['galaxy', 'spiral', 'space', 'math'],
  particleCount: 18000,
  cameraDistance: 8,
  createdAt: '2026-03-01',
  code: `
var arms = addControl('arms', 'Arms', 2, 8, 4);
var spin = addControl('spin', 'Spin', 0.1, 3, 1.2);
var spread = addControl('spread', 'Spread', 0, 1, 0.4);

setInfo('Spiral Galaxy', 'Logarithmic spiral arms');

// Deterministic hash for jitter (no Math.random)
var h = i * 2654435761;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = (h >>> 16) ^ h;
var hash1 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash2 = (h & 0xffff) / 65535;
h = h * 1103515245 + 12345;
var hash3 = (h & 0xffff) / 65535;

// Assign to spiral arm
var armIndex = Math.floor(hash1 * arms);
var armAngle = (armIndex / arms) * Math.PI * 2;

// Radial distance with logarithmic distribution
var r = Math.pow(hash2, 0.5) * 3.5;

// Spiral angle
var theta = armAngle + r * spin + time * 0.2;

// Spread jitter
var jx = (hash3 - 0.5) * spread * r * 0.5;
var jy = (hash1 * hash2 - 0.5) * spread * 0.3;

var x = Math.cos(theta) * r + jx;
var z = Math.sin(theta) * r + jx;
var y = jy * (1 - r / 4);

target.set(x, y, z);

// Color: warm center, blue outer
var hue = 0.1 + r * 0.15;
if (hue > 0.7) hue = 0.6;
var sat = 0.5 + 0.4 * (1 - r / 4);
var lum = 0.5 + 0.3 * (1 - r / 4);
color.setHSL(hue, sat, lum);
`,
}
