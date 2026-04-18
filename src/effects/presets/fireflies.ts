import type { Effect } from '../../engine/types'

export const fireflies: Effect = {
  id: 'fireflies',
  slug: 'fireflies',
  name: 'Fireflies',
  description:
    'Bioluminescent dots with no survival instinct. They just glow and drift. Relatable.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['fireflies', 'bioluminescence', 'glow', 'organic', 'night'],
  particleCount: 12000,
  pointSize: 1.55,
  cameraDistance: 5,
  cameraPosition: [-3.885, 1.33, 2.853],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.2,
  backgroundPreset: 'electric',
  createdAt: '2026-03-22',
  controls: {
    density: 4.6,
    blinkSpeed: 1.087,
    syncStrength: 0.6,
    drift: 0.249,
  },
  disturbMode: 'scatter',
  code: `
var density = addControl('density', 'Density', 1, 5, 3);
var blinkSpeed = addControl('blinkSpeed', 'Blink Speed', 0.5, 5, 2);
var syncStrength = addControl('syncStrength', 'Sync', 0, 3, 0.5);
var drift = addControl('drift', 'Drift', 0.1, 2, 0.5);

// Audio reactivity
density = density + bass * 1.5;
blinkSpeed = blinkSpeed + energy * 2;
var audioSync = syncStrength + beat * 3;

setInfo('Fireflies', 'Bioluminescent particles with independent pulse phases');

var TWO_PI = 6.283185307;

// Deterministic pseudo-random seed per particle (golden ratio)
var seed = i * 1.6180339887;

// Sine-hash pseudo-random positions (-1 to 1)
var rx = (Math.sin(seed * 127.1) * 43758.5453) % 1;
rx = rx - Math.floor(rx);
rx = rx * 2 - 1;

var ry = (Math.sin(seed * 269.5) * 43758.5453) % 1;
ry = ry - Math.floor(ry);
ry = ry * 2 - 1;

var rz = (Math.sin(seed * 419.2) * 43758.5453) % 1;
rz = rz - Math.floor(rz);
rz = rz * 2 - 1;

// Slow drift over time
var dx = Math.sin(time * drift * 0.3 + seed * 6.28) * 0.5;
var dy = Math.sin(time * drift * 0.2 + seed * 3.14) * 0.3;
var dz = Math.cos(time * drift * 0.25 + seed * 4.71) * 0.4;

// Spread volume
var spread = density * 3;

target.set(
  (rx + dx) * spread,
  (ry + dy) * spread,
  (rz + dz) * spread
);

// --- Bioluminescence ---

// Unique blink phase per particle
var blinkPhase = (Math.sin(seed * 311.7) * 43758.5453) % 1;
blinkPhase = blinkPhase - Math.floor(blinkPhase);

// Smooth blink pattern (on/off cycle)
var blink = Math.sin(time * blinkSpeed + blinkPhase * TWO_PI);
blink = blink > 0 ? blink : 0;

// Sharp peaks — brief bright glow
blink = blink * blink * blink;

// Synchronized pulse — occasional global flash
var syncWave = Math.sin(time * audioSync * 0.5);
syncWave = syncWave > 0 ? syncWave : 0;
var syncPulse = syncWave * syncWave;
syncPulse = syncPulse * syncPulse;
syncPulse = syncPulse * syncPulse; // pow(8)

// Final brightness
var light = blink * 0.6 + syncPulse * 0.3;

// --- Color: warm yellow-green ---

// Slight per-particle hue variation
var hueVar = (Math.sin(seed * 573.3) * 43758.5453) % 1;
hueVar = hueVar - Math.floor(hueVar);

var hue = 0.22 + hueVar * 0.13; // range ~0.22-0.35
var sat = 0.85;
var lum = 0.02 + light * 0.55; // very dim when off, bright when on

color.setHSL(hue, sat, lum);
`,
}
