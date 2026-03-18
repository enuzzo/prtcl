import type { Effect } from '../../engine/types'

/**
 * Black Hole "Gargantua" effect
 * Cinematic supermassive black hole with accretion disk, photon sphere,
 * gravitational lensing arcs, and background stars.
 *
 * Original concept from particles.casberry.in community.
 * Refined and extended for PRTCL by PRTCL Team.
 */
export const blackhole: Effect = {
  id: 'black-hole',
  slug: 'black-hole',
  name: 'Black Hole',
  description: 'A singularity, simulated. No real spacetime was harmed. Probably. I make no guarantees about your GPU.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['black hole', 'space', 'gargantua', 'accretion', 'physics'],
  particleCount: 25000,
  pointSize: 1,
  cameraDistance: 5,
  cameraPosition: [2.15, 0.975, -2.048],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1,
  cameraZoom: 1,
  createdAt: '2026-03-16',
  code: `
// Scale factor: original uses coords 0-200, we need ±5
var S = 0.06;

// ── Geometry ──────────────────────────────────────────────
var RS       = addControl('radius',    'Event Horizon',  0.2, 1.2, 0.36);
var MAX_R    = addControl('max_r',     'Disk Radius',    1.5, 7,   3.234);
var THICK    = addControl('thickness', 'Disk Thickness',   0, 1,   0.35);

// ── Dynamics ─────────────────────────────────────────────
var SPEED    = addControl('speed',     'Orbit Speed',      0, 3,   0.13);
var TURB     = addControl('turbulence','Turbulence',       0, 1,   0.4);

// ── Appearance ───────────────────────────────────────────
var TEMP     = addControl('temp',      'Color Temp',       0, 1,   0.272);
var GLOW     = addControl('glow',      'Core Glow',        0, 2,   1.087);

if (i === 0) setInfo('Black Hole', 'Supermassive black hole with accretion disk');

// Internal coords — controls are in world units, convert to internal
var iRS = RS / S;
var iMAX = MAX_R / S;

// ── Per-particle deterministic random ────────────────────
var r1 = (i * 13.579) % 1.0;
var r2 = (i * 97.531) % 1.0;
var r3 = (i * 24.680) % 1.0;
var group = (i * 73.197) % 100.0;

var x = 0, y = 0, z = 0;
var r = 0, theta = 0;
var hue = 0.1, sat = 1.0, light = 0.5;
var localTime = time * SPEED;

if (group < 58) {
  // ── Accretion disk — main body ─────────────────────────
  r = iRS + (r1 * r1) * (iMAX - iRS);
  var angVel = Math.pow(iRS / r, 1.5) * 3.0;
  theta = Math.abs(r2 + localTime * angVel) % 1.0 * Math.PI * 2.0;
  x = r * Math.cos(theta);
  z = r * Math.sin(theta);
  var flare = (r - iRS) * 0.08 * (0.3 + THICK * 1.4);
  var wave = 1.0 + TURB * 0.8 * Math.sin(theta * 4.0 + localTime * 1.5);
  y = (r3 - 0.5) * flare * wave;

} else if (group < 82) {
  // ── Gravitational lensing arcs ─────────────────────────
  r = iRS + (r1 * r1) * ((iMAX * 0.55) - iRS);
  var angVel2 = Math.pow(iRS / r, 1.5) * 3.0;
  var frac = Math.abs(r2 + localTime * angVel2) % 1.0;
  theta = Math.PI + frac * Math.PI;
  var bx = r * Math.cos(theta);
  var bz = r * Math.sin(theta);
  x = bx;
  if (group < 70) {
    y = -bz + (r3 - 0.5) * (1.0 + THICK);
  } else {
    y = bz + (r3 - 0.5) * (1.0 + THICK);
  }
  z = bz * 0.25;

} else if (group < 92) {
  // ── Photon sphere — tight orbit at event horizon ───────
  r = iRS * 1.01 + r1 * 0.3;
  var phi = r2 * Math.PI * 2.0;
  var costh = (r3 * 2.0) - 1.0;
  var sinth = Math.sqrt(1.0 - costh * costh);
  x = r * sinth * Math.cos(phi);
  y = r * sinth * Math.sin(phi);
  z = r * costh;
  var angle = Math.atan2(z, x) + localTime * 5.0;
  var rxz = Math.sqrt(x * x + z * z);
  x = rxz * Math.cos(angle);
  z = rxz * Math.sin(angle);

} else {
  // ── Background stars ───────────────────────────────────
  r = iMAX * 1.3 + r1 * iMAX * 3.0;
  var phi2 = r2 * Math.PI * 2.0;
  var costh2 = (r3 * 2.0) - 1.0;
  var sinth2 = Math.sqrt(1.0 - costh2 * costh2);
  x = r * sinth2 * Math.cos(phi2);
  y = r * sinth2 * Math.sin(phi2);
  z = r * costh2;
}

// ── Scale to world coords ────────────────────────────────
x *= S; y *= S; z *= S;

// ── Coloring ─────────────────────────────────────────────
if (group < 92) {
  var norm = Math.max(0.0, Math.min(1.0, (r - iRS) / (iMAX * 0.5)));
  var baseHue = 0.08 + TEMP * 0.08;
  hue = Math.max(0.0, baseHue - norm * 0.15);
  sat = 0.75 + norm * 0.25;
  if (norm < 0.05) {
    light = (0.6 + GLOW * 0.3) + (0.05 - norm) * GLOW * 4.0;
  } else {
    light = (0.4 + GLOW * 0.15) * Math.pow(1.0 - norm, 1.6);
  }
  var turb = Math.sin(r * 4.0 - localTime * 2.0) * Math.cos(theta * 5.0);
  light *= 1.0 + turb * TURB * 0.6;
} else {
  hue = 0.55 + r1 * 0.25;
  sat = 0.2;
  light = r2 > 0.97 ? 0.85 : 0.04;
}

target.set(x, y, z);
color.setHSL(hue, sat, Math.min(1.0, Math.max(0.0, light)));
`,
}
