import type { Effect } from '../../engine/types'

/**
 * Fibonacci Crystal
 * A living gemstone — particles on a faceted icosahedral form with a
 * glowing core, organic breathing deformations, and rich chromatic
 * kaleidoscope coloring per facet.
 *
 * Palette function by Inigo Quilez (iquilezles.org/articles/palettes).
 * Adapted from Alexandr Korotaev's 2D Fibonacci shader (lekzd@mail.ru).
 */
export const fibonacciCrystal: Effect = {
  id: 'fibonacci-crystal',
  slug: 'fibonacci-crystal',
  name: 'Fibonacci Crystal',
  description: 'Spherical harmonics walked into a bar and ordered a kaleidoscope. The bartender said no. They did it anyway.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['fibonacci', 'crystal', 'kaleidoscope', 'fractal', 'symmetry', 'palette', 'gem'],
  particleCount: 18000,
  pointSize: 2,
  cameraDistance: 6,
  cameraPosition: [0.673, 4.252, -5.609],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1.5,
  cameraZoom: 1,
  createdAt: '2026-03-18',
  code: `
var faceting = addControl('faceting', 'Faceting', 0, 1, 0.652);
var scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
var colorSpeed = addControl('colorSpeed', 'Color Speed', 0, 2, 0.625);
var breath = addControl('breath', 'Breath', 0, 3, 1.639);
var complexity = addControl('complexity', 'Complexity', 1, 20, 15.727);

// Audio modulation — each band drives a different dimension
// Bass → breathing (crystal expands/contracts with kick drum)
breath = breath * (1.0 + bass * 4.0);
// Beat → faceting sharpens momentarily (geometric snap on transients)
faceting = Math.min(1.0, faceting + beat * 0.35);
// Energy → scale (overall loudness swells the crystal)
scale = scale * (1.0 + energy * 1.5);
// Highs → color cycling (hi-hats make the kaleidoscope spin faster)
colorSpeed = colorSpeed * (1.0 + highs * 3.0);
// Mids → complexity (vocals add fractal detail)
complexity = complexity * (1.0 + mids * 0.5);

var PI = Math.PI;
var TAU = PI * 2;
var GOLDEN_ANGLE = TAU / (1 + (1 + Math.sqrt(5)) / 2);

// ── Per-particle pseudo-random (3 independent channels) ──
var hash = (i * 2654435761) >>> 0;
var r1 = ((hash & 0xFFFF) / 65535.0);
var r2 = (((hash >> 8) & 0xFFFF) / 65535.0);
var r3 = (((hash >> 16) & 0xFFFF) / 65535.0);

// ── Fibonacci sphere distribution ──
var ft = i / count;
var ftheta = i * GOLDEN_ANGLE;
var fphi = Math.acos(1 - 2 * ft);
var sinPhi = Math.sin(fphi);
var sx = sinPhi * Math.cos(ftheta);
var sy = sinPhi * Math.sin(ftheta);
var sz = Math.cos(fphi);

// ── Icosahedron facet snapping ──
var angStep = TAU / 5;
var phiBands = 4;
var phiStep = PI / phiBands;
var qTheta = Math.round(ftheta / angStep) * angStep;
var qPhi = Math.round(fphi / phiStep) * phiStep;
var qSinPhi = Math.sin(qPhi);
var qx = qSinPhi * Math.cos(qTheta);
var qy = qSinPhi * Math.sin(qTheta);
var qz = Math.cos(qPhi);

// Blend sphere → crystal
var fx = sx + (qx - sx) * faceting;
var fy = sy + (qy - sy) * faceting;
var fz = sz + (qz - sz) * faceting;
var fLen = Math.sqrt(fx * fx + fy * fy + fz * fz);
if (fLen > 0.001) { fx /= fLen; fy /= fLen; fz /= fLen; }

// ── Volumetric: fill the core, not just surface ──
// r1 cubed biases toward surface but fills center too
var layerR = 0.2 + 0.8 * Math.pow(r1, 0.6);

// ── Organic breathing: smooth multi-frequency deformation ──
// Instead of harsh on/off bumps, use layered sine waves at
// different speeds and directions for fluid, living movement

// Slow global breathing (entire crystal expands/contracts gently)
var globalBreath = 1.0 + Math.sin(time * 0.8) * 0.06 * breath;

// Directional waves: smooth sine traveling across the surface
// Wave 1: slow undulation rolling upward
var w1 = Math.sin(fy * 3 + time * 1.2) * 0.08;
// Wave 2: lateral ripple
var w2 = Math.sin(fx * 4 - time * 0.9 + 1.5) * 0.06;
// Wave 3: diagonal organic pulse (slower, deeper)
var w3dot = fx * 0.5 + fy * 0.7 + fz * 0.5;
var w3 = Math.sin(w3dot * 5 + time * 1.6) * 0.07;
// Wave 4: per-facet flutter (each face breathes independently)
var facePhase = qTheta * 3 + qPhi * 7; // unique phase per facet
var w4 = Math.sin(time * 2.3 + facePhase) * 0.05;

var organicR = globalBreath + (w1 + w2 + w3 + w4) * breath;

var x = fx * scale * layerR * organicR;
var y = fy * scale * layerR * organicR;
var z = fz * scale * layerR * organicR;

// ── Saturated chromatic coloring ──
// Key: use wider phase offsets between RGB channels to prevent white

// Which facet? Each face gets a distinct hue
var faceId = Math.round(qTheta / angStep) + Math.round(qPhi / phiStep) * 5;
var faceHue = faceId * 0.18;

// Edge proximity
var edgeDist = Math.sqrt(
  (sx - qx) * (sx - qx) + (sy - qy) * (sy - qy) + (sz - qz) * (sz - qz)
);
var edgeFactor = Math.min(edgeDist * 6, 1);

// Quilez palette with WIDE channel separation (avoids white)
// a + b * cos(TAU * (c*t + d)) — the d offsets determine hue spread
// Wider d separation = more saturated, less white
var palT = faceHue + time * colorSpeed + edgeFactor * 0.2 + layerR * 0.3;

// Surface palette: vibrant (magenta → teal → amber)
var cr = 0.55 + 0.45 * Math.cos(TAU * (palT + 0.00));
var cg = 0.45 + 0.45 * Math.cos(TAU * (palT + 0.40));
var cb = 0.55 + 0.45 * Math.cos(TAU * (palT + 0.75));

// Core tint: shift inner particles toward complementary hue
var coreShift = (1.0 - layerR) * 0.35;
cr = cr * (1 - coreShift) + (1 - cr) * coreShift;
cg = cg * (1 - coreShift * 0.5);
cb = cb * (1 - coreShift) + (1 - cb) * coreShift * 0.7;

// ── Kaleidoscope pattern ──
var u = fphi / PI;
var v = ((ftheta % TAU) + TAU) % TAU / TAU;
var fu = (u * complexity) % 1;
var fv = (v * complexity) % 1;
var pattern = Math.sin(fu * TAU * 3) * Math.sin(fv * TAU * 5);
pattern += Math.sin(u * complexity * 4 + time * 0.5) * 0.4;
pattern = 0.35 + 0.65 / (1 + Math.exp(-pattern * 3));

// ── Brightness: gentle, clamped to prevent white-out ──
var coreGlow = 1.0 + (1.0 - layerR) * 0.4;
var edgeGlow = 1.0 + edgeFactor * 0.3;
var waveFlash = 1.0 + Math.max(0, w1 + w3) * 0.8;
// Clamp brightness to preserve color saturation
var brightness = Math.min(pattern * coreGlow * edgeGlow * waveFlash, 1.4);

target.set(x, y, z);
color.setRGB(
  Math.max(0, cr * brightness),
  Math.max(0, cg * brightness),
  Math.max(0, cb * brightness)
);
`,
}
