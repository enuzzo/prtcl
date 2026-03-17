import type { Effect } from '../../engine/types'

/**
 * Fibonacci Crystal
 * A continuous 3D form — particles distributed on a Fibonacci sphere
 * with volumetric depth, colored by kaleidoscopic pattern folding
 * and Quilez cosine palette. No flat planes — a single organic shape
 * wrapped in fractal symmetry.
 *
 * Uses the classic Fibonacci sphere algorithm (golden angle + arccosine)
 * for even distribution, then maps spherical coords through sector
 * symmetry for the kaleidoscope pattern.
 *
 * Adapted from Alexandr Korotaev's 2D Fibonacci shader (lekzd@mail.ru).
 * Palette function by Inigo Quilez (iquilezles.org/articles/palettes).
 */
export const fibonacciCrystal: Effect = {
  id: 'fibonacci-crystal',
  slug: 'fibonacci-crystal',
  name: 'Fibonacci Crystal',
  description: 'A living kaleidoscope. Fibonacci sphere wrapped in fractal symmetry. Math is beautiful.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['fibonacci', 'crystal', 'kaleidoscope', 'fractal', 'symmetry', 'palette', 'sphere'],
  particleCount: 25000,
  pointSize: 2.5,
  cameraDistance: 6,
  cameraPosition: [4, 3, 5],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1.5,
  cameraZoom: 1,
  createdAt: '2026-03-18',
  code: `
var sectors = addControl('sectors', 'Sectors', 2, 32, 12);
var depth = addControl('depth', 'Depth', 0.1, 2, 0.8);
var scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
var colorSpeed = addControl('colorSpeed', 'Color Speed', 0, 2, 0.15);
var complexity = addControl('complexity', 'Complexity', 1, 20, 8);

var PI = Math.PI;
var TAU = PI * 2;
var GOLDEN_ANGLE = TAU / (1 + (1 + Math.sqrt(5)) / 2); // ~2.3999.. radians

// ── Quilez cosine palette ──
var palA0 = 0.8, palA1 = 0.5, palA2 = 0.4;
var palB0 = 1.0, palB1 = 1.0, palB2 = 0.2;
var palD0 = 0.80, palD1 = 0.90, palD2 = 0.30;

// ── Per-particle pseudo-random for volumetric depth ──
var hash = (i * 2654435761) >>> 0;
var rand01 = ((hash & 0xFFFF) / 65535.0); // 0..1

// ── Fibonacci sphere distribution ──
// Classic algorithm: even points on a sphere surface
var t = i / count; // 0..1
var theta = i * GOLDEN_ANGLE; // longitude: golden angle spiral
var phi = Math.acos(1 - 2 * t); // latitude: arccosine for even spacing

// Spherical to cartesian (unit sphere)
var sinPhi = Math.sin(phi);
var sx = sinPhi * Math.cos(theta);
var sy = sinPhi * Math.sin(theta);
var sz = Math.cos(phi);

// ── Volumetric depth: scatter particles from surface inward ──
// Some on surface, some inside — creates solid crystal feel
var layerR = 1.0 - rand01 * rand01 * depth; // bias toward surface
var x = sx * scale * layerR;
var y = sy * scale * layerR;
var z = sz * scale * layerR;

// ── Kaleidoscope pattern via spherical UV ──
// Use phi (latitude) and theta (longitude) as 2D pattern coords
var u = phi / PI; // 0..1 (pole to pole)
var v = ((theta % TAU) + TAU) % TAU / TAU; // 0..1 (around equator)

// Sector folding on the azimuthal angle
var sectorAngle = 1.0 / sectors;
v = v % (sectorAngle * 2);
if (v > sectorAngle) v = sectorAngle * 2 - v;
v = v / sectorAngle; // normalize to 0..1 within sector

// ── Fibonacci interference pattern ──
var fu = (u * complexity) % 1;
var fv = (v * complexity) % 1;
var pattern = Math.sin(fu * TAU * 3) * Math.sin(fv * TAU * 5);
pattern += Math.sin(u * complexity * 4 + time * 0.5) * 0.4;
pattern += Math.cos(v * complexity * 3 - time * 0.3) * 0.3;

// Softer banding (not binary)
pattern = 0.3 + 0.7 / (1 + Math.exp(-pattern * 4));

// ── Wave modulation ──
var wave = Math.sin(u * 7 + time * 0.3) + Math.cos(v * 13 - time * 0.2);

// ── Color from palette ──
var palT = u * 0.5 + v * 0.3 + wave * 0.1 + layerR * 0.2 + time * colorSpeed;
var cr = palA0 + palB0 * Math.cos(TAU * (palT + palD0));
var cg = palA1 + palB1 * Math.cos(TAU * (palT + palD1));
var cb = palA2 + palB2 * Math.cos(TAU * (palT + palD2));

// ── Depth glow: inner particles slightly brighter (crystal core) ──
var depthGlow = 1.0 + (1.0 - layerR) * 0.5;
var brightness = pattern * depthGlow;

target.set(x, y, z);
color.setRGB(
  Math.max(0, cr * brightness),
  Math.max(0, cg * brightness),
  Math.max(0, cb * brightness)
);
`,
}
