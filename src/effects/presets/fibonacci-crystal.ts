import type { Effect } from '../../engine/types'

/**
 * Fibonacci Crystal
 * Multiple intersecting planes arranged like crystal facets, each
 * populated with particles colored by a Fibonacci-based kaleidoscope pattern.
 * Particles are distributed in polar coords with golden-angle spacing,
 * folded through sector symmetry, and colored via Quilez cosine palette.
 *
 * Adapted from Alexandr Korotaev's 2D Fibonacci shader (lekzd@mail.ru).
 * Palette function by Inigo Quilez (iquilezles.org/articles/palettes).
 * Original concept is a fullscreen 2D shader — reimagined here as
 * intersecting particle planes in 3D space.
 */
export const fibonacciCrystal: Effect = {
  id: 'fibonacci-crystal',
  slug: 'fibonacci-crystal',
  name: 'Fibonacci Crystal',
  description: 'Kaleidoscopic planes of Fibonacci particles intersecting like a crystal. Math is beautiful.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['fibonacci', 'crystal', 'kaleidoscope', 'fractal', 'symmetry', 'palette', 'planes'],
  particleCount: 25000,
  pointSize: 2.0,
  cameraDistance: 6,
  cameraPosition: [4, 3, 5],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1.5,
  cameraZoom: 1,
  createdAt: '2026-03-17',
  code: `
var sectors = addControl('sectors', 'Sectors', 2, 32, 16);
var planeCount = addControl('planeCount', 'Planes', 2, 8, 5);
var radius = addControl('radius', 'Radius', 0.5, 5, 3);
var colorSpeed = addControl('colorSpeed', 'Color Speed', 0, 2, 0.15);
var complexity = addControl('complexity', 'Complexity', 1, 20, 8);

// ── Constants ──
var PI = Math.PI;
var TAU = PI * 2;
var GOLDEN_ANGLE = PI * (3 - Math.sqrt(5)); // ~137.5 degrees

// ── Quilez cosine palette ──
// https://iquilezles.org/articles/palettes/
var palA0 = 0.8, palA1 = 0.5, palA2 = 0.4;
var palB0 = 1.0, palB1 = 1.0, palB2 = 0.2;
var palD0 = 0.80, palD1 = 0.90, palD2 = 0.30;

// ── Distribute particles across planes ──
var planesInt = Math.round(planeCount);
var perPlane = Math.floor(count / planesInt);
var planeIdx = Math.floor(i / perPlane);
var localI = i % perPlane;
if (planeIdx >= planesInt) { planeIdx = planesInt - 1; localI = i - planeIdx * perPlane; }

// ── Plane orientation: evenly rotated around Y axis ──
var planeAngle = (planeIdx / planesInt) * PI;

// ── 2D position: golden-angle sunflower distribution (organic, not grid) ──
var t = localI / perPlane; // 0..1
var r = Math.sqrt(t) * radius; // square root for even density
var theta = localI * GOLDEN_ANGLE; // golden angle spiral
var u = r * Math.cos(theta);
var v = r * Math.sin(theta);

// ── Kaleidoscope symmetry: fold into sector ──
var angle = Math.atan2(v, u);
var sectorAngle = PI / sectors;
// Fold angle into first sector
angle = angle < 0 ? angle + TAU : angle;
angle = angle % (sectorAngle * 2);
if (angle > sectorAngle) angle = sectorAngle * 2 - angle;
var len = Math.sqrt(u * u + v * v);
var ku = Math.cos(angle) * len;
var kv = Math.sin(angle) * len;

// ── Fibonacci-inspired pattern ──
// Use golden ratio modular arithmetic for pattern generation
var fibU = (ku * complexity) % 1;
var fibV = (kv * complexity) % 1;
if (fibU < 0) fibU += 1;
if (fibV < 0) fibV += 1;
// Create interference pattern via sin of fibonacci-scaled coords
var pattern = Math.sin(fibU * TAU * 3) * Math.sin(fibV * TAU * 5);
pattern += Math.sin(len * complexity * 2 + time * 0.5) * 0.5;
// Sharpen into bands
pattern = pattern > 0 ? 1.0 : 0.3;

// ── Wave modulation for color variation ──
var wave = Math.sin(ku * 7 + time * 0.3) + Math.cos(kv * 13 - time * 0.2);

// ── Color from cosine palette ──
var palT = len * 0.3 + wave * 0.15 + planeIdx * 0.12 + time * colorSpeed;
var cr = palA0 + palB0 * Math.cos(TAU * (palT + palD0));
var cg = palA1 + palB1 * Math.cos(TAU * (palT + palD1));
var cb = palA2 + palB2 * Math.cos(TAU * (palT + palD2));

// ── Brightness: pattern modulates, fade at edges ──
var edgeFade = 1.0 - Math.pow(t, 3); // fade outer particles
var brightness = pattern * edgeFade;

// ── 3D position: rotate 2D coords onto the plane ──
var cosP = Math.cos(planeAngle);
var sinP = Math.sin(planeAngle);
var x = u * cosP;
var y = v;
var z = u * sinP;

target.set(x, y, z);
color.setRGB(
  Math.max(0, cr * brightness),
  Math.max(0, cg * brightness),
  Math.max(0, cb * brightness)
);
`,
}
