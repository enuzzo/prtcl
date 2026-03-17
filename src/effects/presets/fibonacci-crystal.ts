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
  description: 'A breathing gemstone made of 25,000 particles. Sharp facets, kaleidoscope colors, organic pulsation.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['fibonacci', 'crystal', 'kaleidoscope', 'fractal', 'symmetry', 'palette', 'gem'],
  particleCount: 25000,
  pointSize: 2.5,
  cameraDistance: 6,
  cameraPosition: [4, 3, 5],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1.5,
  cameraZoom: 1,
  createdAt: '2026-03-18',
  code: `
var faceting = addControl('faceting', 'Faceting', 0, 1, 0.45);
var scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
var colorSpeed = addControl('colorSpeed', 'Color Speed', 0, 2, 0.2);
var breath = addControl('breath', 'Breath', 0, 3, 1.2);
var complexity = addControl('complexity', 'Complexity', 1, 20, 8);

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

// ── Rich chromatic coloring ──
// Two palettes that shift and blend for richer color variety

// Which facet? Used to give each face a distinct hue
var faceId = Math.round(qTheta / angStep) + Math.round(qPhi / phiStep) * 5;
var faceHue = faceId * 0.15; // strong hue separation per face

// Edge proximity (particles near facet edges)
var edgeDist = Math.sqrt(
  (sx - qx) * (sx - qx) + (sy - qy) * (sy - qy) + (sz - qz) * (sz - qz)
);
var edgeFactor = Math.min(edgeDist * 6, 1);

// Palette A: warm (pink → gold → teal)
var palTA = faceHue + time * colorSpeed + edgeFactor * 0.3;
var crA = 0.5 + 0.5 * Math.cos(TAU * (palTA + 0.0));
var cgA = 0.5 + 0.5 * Math.cos(TAU * (palTA + 0.33));
var cbA = 0.5 + 0.5 * Math.cos(TAU * (palTA + 0.67));

// Palette B: cool (violet → cyan → lime)
var palTB = faceHue * 0.7 + time * colorSpeed * 1.3 + layerR * 0.5;
var crB = 0.5 + 0.5 * Math.cos(TAU * (palTB + 0.1));
var cgB = 0.5 + 0.5 * Math.cos(TAU * (palTB + 0.5));
var cbB = 0.5 + 0.5 * Math.cos(TAU * (palTB + 0.8));

// Blend: inner particles use palette B (cool core), outer use A (warm surface)
var blendAB = layerR; // 0=core, 1=surface
var cr = crA * blendAB + crB * (1 - blendAB);
var cg = cgA * blendAB + cgB * (1 - blendAB);
var cb = cbA * blendAB + cbB * (1 - blendAB);

// ── Kaleidoscope pattern ──
var u = fphi / PI;
var v = ((ftheta % TAU) + TAU) % TAU / TAU;
var fu = (u * complexity) % 1;
var fv = (v * complexity) % 1;
var pattern = Math.sin(fu * TAU * 3) * Math.sin(fv * TAU * 5);
pattern += Math.sin(u * complexity * 4 + time * 0.5) * 0.4;
pattern = 0.4 + 0.6 / (1 + Math.exp(-pattern * 3));

// ── Brightness: core glow + edge shimmer + wave flash ──
var coreGlow = 1.0 + (1.0 - layerR) * 1.2; // inner particles glow hot
var edgeGlow = 1.0 + edgeFactor * 0.6; // edges shimmer
var waveFlash = 1.0 + Math.max(0, w1 + w3) * 2.0; // waves brighten
var brightness = pattern * coreGlow * edgeGlow * waveFlash;

target.set(x, y, z);
color.setRGB(
  Math.max(0, cr * brightness),
  Math.max(0, cg * brightness),
  Math.max(0, cb * brightness)
);
`,
}
