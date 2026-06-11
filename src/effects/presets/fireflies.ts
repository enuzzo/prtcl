import type { Effect } from '../../engine/types'

/**
 * Fireflies — synchrony rewrite.
 * Each firefly wanders a smooth Lissajous path in a ground-biased volume.
 * Blink phases blend between independent and a global clock (Kuramoto-style
 * sync slider), and a spatial wave term makes flashes sweep across the swarm
 * like real Pteroptyx mangrove displays. A dim teal mist hugs the ground.
 */
export const fireflies: Effect = {
  id: 'fireflies',
  slug: 'fireflies',
  name: 'Fireflies',
  description: 'Bioluminescent dots with no survival instinct, now syncing their flashes like the mangrove ones do. Thousands of tiny lanterns agreeing on a rhythm nobody wrote down. Still relatable.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['fireflies', 'bioluminescence', 'glow', 'organic', 'night', 'sync'],
  particleCount: 12000,
  pointSize: 1.55,
  cameraDistance: 5,
  cameraPosition: [-3.885, 1.33, 2.853],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.2,
  backgroundPreset: 'twilight',
  createdAt: '2026-03-22',
  bloom: true,
  bloomStrength: 0.55,
  bloomRadius: 0.5,
  bloomThreshold: 0.45,
  controls: {
    density: 3.4,
    blinkSpeed: 1.4,
    syncStrength: 0.55,
    drift: 0.45,
    flashWave: 0.55,
  },
  disturbMode: 'scatter',
  code: `
var density    = addControl('density', 'Swarm Size', 1, 5, 3);
var blinkSpeed = addControl('blinkSpeed', 'Blink Speed', 0.5, 5, 1.5);
var sync       = addControl('syncStrength', 'Synchrony', 0, 1, 0.55);
var drift      = addControl('drift', 'Drift', 0.1, 2, 0.5);
var flashWave  = addControl('flashWave', 'Flash Waves', 0, 1, 0.5);

setInfo('Fireflies', 'Synchronizing swarm — flashes sweep the field in waves');

var TWO_PI = 6.283185307;
var spread = density * 1.6;

// Deterministic per-particle hashes
var seed = i * 1.6180339887;
var h1 = Math.sin(seed * 127.1) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(seed * 269.5) * 43758.5453; h2 = h2 - Math.floor(h2);
var h3 = Math.sin(seed * 419.2) * 43758.5453; h3 = h3 - Math.floor(h3);
var h4 = Math.sin(seed * 631.7) * 43758.5453; h4 = h4 - Math.floor(h4);

if (h4 < 0.16) {
  // ── GROUND MIST — dim teal layer with a slow swirl ──
  var mr = Math.sqrt(h1) * spread * 1.5;
  var ma = h2 * TWO_PI + time * 0.05 * (1.5 - h1);
  var mx = Math.cos(ma) * mr;
  var mz = Math.sin(ma) * mr;
  var my = -spread * 0.62 + h3 * spread * 0.12
         + Math.sin(time * 0.4 + h1 * TWO_PI) * 0.06;
  target.set(mx, my, mz);
  var mlum = 0.03 + h3 * 0.04 + Math.sin(time * 0.3 + h2 * TWO_PI) * 0.012;
  color.setHSL(0.48, 0.45, mlum < 0 ? 0 : mlum);
} else {
  // ── FIREFLIES — smooth Lissajous wander, ground-biased ──
  var fx = (h1 * 2 - 1) * spread;
  var fz = (h2 * 2 - 1) * spread;
  // More flies near the ground, a few climb high
  var fy = (Math.pow(h3, 1.7) * 1.5 - 0.55) * spread * 0.85;

  var wSpd = drift * (0.5 + h2 * 0.8);
  fx = fx + Math.sin(time * wSpd * 0.41 + h1 * TWO_PI) * 0.9
          + Math.sin(time * wSpd * 0.173 + h3 * TWO_PI) * 1.4;
  fy = fy + Math.sin(time * wSpd * 0.29 + h2 * TWO_PI) * 0.45;
  fz = fz + Math.cos(time * wSpd * 0.37 + h3 * TWO_PI) * 0.9
          + Math.cos(time * wSpd * 0.151 + h1 * TWO_PI) * 1.4;

  target.set(fx, fy, fz);

  // ── BLINK — own rhythm blended toward the global clock ──
  var ownPhase = time * blinkSpeed * (0.75 + h2 * 0.5) + h1 * TWO_PI;
  var globalPhase = time * blinkSpeed;
  var phase = ownPhase + (globalPhase - ownPhase) * sync;

  // Spatial wave: flashes sweep diagonally across the swarm
  phase = phase - (fx + fz) * flashWave * 0.55;

  var blink = Math.sin(phase);
  blink = blink > 0 ? blink : 0;
  // Sharp attack: pow(8) keeps flashes brief and lantern-like
  blink = blink * blink;
  blink = blink * blink;
  blink = blink * blink;

  // ── COLOR — amber-green lanterns, greener idle, golden at peak ──
  if (h3 > 0.97) {
    // The rare blue ghost firefly (they exist, look them up)
    color.setHSL(0.55, 0.8, 0.04 + blink * 0.75);
  } else {
    var hue = 0.24 - blink * 0.11 + h1 * 0.04;
    var lum = 0.025 + blink * 0.68;
    color.setHSL(hue, 0.9, lum > 1 ? 1 : lum);
  }
}
`,
}
