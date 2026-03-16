import type { Effect } from '../../engine/types'

export const lorenz: Effect = {
  id: 'lorenz-attractor',
  slug: 'lorenz-attractor',
  name: 'Lorenz Attractor',
  description: 'Classic chaotic attractor with swirling butterfly wings',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['lorenz', 'attractor', 'chaos', 'math'],
  particleCount: 12000,
  cameraDistance: 50,
  createdAt: '2026-03-01',
  code: `
var sigma = addControl('sigma', 'Sigma', 1, 20, 10);
var rho = addControl('rho', 'Rho', 10, 40, 28);
var beta = addControl('beta', 'Beta', 0.5, 5, 2.667);
var speed = addControl('speed', 'Speed', 0.1, 3, 1);

setInfo('Lorenz Attractor', 'Classic chaotic attractor');

var steps = 50;
var seed = (i / count) * 100;
var x = 0.1 + Math.sin(seed) * 0.01;
var y = Math.cos(seed) * 0.01;
var z = 0;
var dt = 0.01 * speed;

for (var s = 0; s < steps; s++) {
  var dx = sigma * (y - x) * dt;
  var dy = (x * (rho - z) - y) * dt;
  var dz = (x * y - beta * z) * dt;
  x += dx; y += dy; z += dz;
}

// Add time-based phase shift for animation
var phase = time * speed * 0.5;
var extraSteps = Math.floor(phase) % 20;
for (var s2 = 0; s2 < extraSteps; s2++) {
  var dx2 = sigma * (y - x) * dt;
  var dy2 = (x * (rho - z) - y) * dt;
  var dz2 = (x * y - beta * z) * dt;
  x += dx2; y += dy2; z += dz2;
}

target.set(x * 0.1, y * 0.1, (z - 25) * 0.1);

// Color based on position — warm wing vs cool wing
var hue = x > 0 ? 0.0 : 0.6;
var sat = 0.7 + 0.3 * Math.sin(seed);
var lum = 0.4 + 0.2 * Math.abs(Math.sin(z * 0.1));
color.setHSL(hue, sat, lum);
`,
}
