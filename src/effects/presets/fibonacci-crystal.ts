import type { Effect } from '../../engine/types'

/**
 * Fibonacci Crystal
 * Particles mapped onto a crystalline form — each point on a Fibonacci
 * sphere is "snapped" toward the nearest icosahedral face, creating
 * flat facets with sharp edges. The crystal breathes with asymmetric
 * spasms, and the kaleidoscope pattern wraps across its geometry.
 *
 * Technique: project Fibonacci sphere points onto icosahedron faces
 * by finding the nearest vertex cluster and flattening radially.
 * This creates a gem-like shape with visible facets.
 *
 * Palette function by Inigo Quilez (iquilezles.org/articles/palettes).
 * Adapted from Alexandr Korotaev's 2D Fibonacci shader (lekzd@mail.ru).
 */
export const fibonacciCrystal: Effect = {
  id: 'fibonacci-crystal',
  slug: 'fibonacci-crystal',
  name: 'Fibonacci Crystal',
  description: 'A breathing gemstone made of 25,000 particles. Sharp facets, kaleidoscope colors, asymmetric spasms.',
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
var depth = addControl('depth', 'Depth', 0.1, 2, 0.4);
var scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
var colorSpeed = addControl('colorSpeed', 'Color Speed', 0, 2, 0.15);
var complexity = addControl('complexity', 'Complexity', 1, 20, 8);
var spasm = addControl('spasm', 'Spasm', 0, 3, 1.0);

var PI = Math.PI;
var TAU = PI * 2;
var GOLDEN_ANGLE = TAU / (1 + (1 + Math.sqrt(5)) / 2);

// ── Quilez palette ──
var palA0 = 0.8, palA1 = 0.5, palA2 = 0.4;
var palB0 = 1.0, palB1 = 1.0, palB2 = 0.2;
var palD0 = 0.80, palD1 = 0.90, palD2 = 0.30;

// ── Per-particle random ──
var hash = (i * 2654435761) >>> 0;
var rand01 = ((hash & 0xFFFF) / 65535.0);

// ── Fibonacci sphere ──
var ft = i / count;
var ftheta = i * GOLDEN_ANGLE;
var fphi = Math.acos(1 - 2 * ft);
var sinPhi = Math.sin(fphi);
var sx = sinPhi * Math.cos(ftheta);
var sy = sinPhi * Math.sin(ftheta);
var sz = Math.cos(fphi);

// ── Icosahedron snapping: project sphere points onto crystal facets ──
// Use the "rounding" trick: quantize the direction vector to create
// flat faces. More quantization levels = more facets.
// We use a combination of angular quantization for crystal geometry.
var nFaces = 20; // icosahedron face count
var angStep = TAU / 5; // 5 vertices around equator (icosahedron)

// Quantize theta into 5 sectors (pentagonal symmetry)
var qTheta = Math.round(ftheta / angStep) * angStep;
// Quantize phi into 4 bands (creates rows of faces)
var phiBands = 4;
var phiStep = PI / phiBands;
var qPhi = Math.round(fphi / phiStep) * phiStep;

// Snapped direction (the facet normal)
var qSinPhi = Math.sin(qPhi);
var qx = qSinPhi * Math.cos(qTheta);
var qy = qSinPhi * Math.sin(qTheta);
var qz = Math.cos(qPhi);

// Blend between smooth sphere and faceted crystal
var fx = sx + (qx - sx) * faceting;
var fy = sy + (qy - sy) * faceting;
var fz = sz + (qz - sz) * faceting;

// Renormalize to keep on unit sphere surface (then scale)
var fLen = Math.sqrt(fx * fx + fy * fy + fz * fz);
if (fLen > 0.001) { fx /= fLen; fy /= fLen; fz /= fLen; }

// ── Volumetric depth ──
var layerR = 1.0 - rand01 * rand01 * depth;

// ── Asymmetric spasms ──
var bump = 0;
// Bump 1: fast from below-right
var b1dir = fx * 0.3 + fy * -0.8 + fz * 0.5;
var b1wave = Math.sin(time * 3.7) * Math.sin(time * 1.1 + 0.5);
b1wave = b1wave > 0.3 ? (b1wave - 0.3) * 2.5 : 0;
bump += b1wave * Math.max(0, b1dir) * 0.6;
// Bump 2: slow from left
var b2dir = fx * -0.9 + fy * 0.2 + fz * 0.1;
var b2wave = Math.pow(Math.max(0, Math.sin(time * 1.3 + 2.0)), 3);
bump += b2wave * Math.max(0, b2dir) * 0.8;
// Bump 3: from above, breathing
var b3dir = fx * 0.1 + fy * 0.95 + fz * 0.2;
var b3wave = Math.pow(Math.max(0, Math.sin(time * 2.1 + 4.0)), 2);
bump += b3wave * Math.max(0, b3dir) * 0.5;
// Bump 4: erratic diagonal
var b4dir = fx * 0.6 + fy * 0.4 + fz * -0.7;
var b4t = time * 5.3;
var b4wave = Math.sin(b4t) * Math.sin(b4t * 0.7) * Math.sin(b4t * 0.3);
b4wave = b4wave > 0.2 ? (b4wave - 0.2) * 3 : 0;
bump += b4wave * Math.max(0, b4dir) * 0.4;

var bumpR = 1.0 + bump * spasm;

var x = fx * scale * layerR * bumpR;
var y = fy * scale * layerR * bumpR;
var z = fz * scale * layerR * bumpR;

// ── Kaleidoscope coloring ──
var u = fphi / PI;
var v = ((ftheta % TAU) + TAU) % TAU / TAU;

// Which facet am I on? Use for color variation per face
var faceId = Math.round(qTheta / angStep) + Math.round(qPhi / phiStep) * 5;

var fu = (u * complexity) % 1;
var fv = (v * complexity) % 1;
var pattern = Math.sin(fu * TAU * 3) * Math.sin(fv * TAU * 5);
pattern += Math.sin(u * complexity * 4 + time * 0.5) * 0.4;
pattern += Math.cos(v * complexity * 3 - time * 0.3) * 0.3;
pattern = 0.3 + 0.7 / (1 + Math.exp(-pattern * 4));

// Edge glow: particles near facet edges are brighter
var edgeDist = Math.sqrt(
  (sx - qx) * (sx - qx) + (sy - qy) * (sy - qy) + (sz - qz) * (sz - qz)
);
var edgeGlow = 1.0 + Math.pow(Math.min(edgeDist * 8, 1), 0.5) * 0.8;

var wave = Math.sin(u * 7 + time * 0.3) + Math.cos(v * 13 - time * 0.2);
var palT = faceId * 0.07 + wave * 0.1 + layerR * 0.2 + time * colorSpeed;
var cr = palA0 + palB0 * Math.cos(TAU * (palT + palD0));
var cg = palA1 + palB1 * Math.cos(TAU * (palT + palD1));
var cb = palA2 + palB2 * Math.cos(TAU * (palT + palD2));

var depthGlow = 1.0 + (1.0 - layerR) * 0.5;
var spasmGlow = 1.0 + bump * 1.5;
var brightness = pattern * depthGlow * spasmGlow * edgeGlow;

target.set(x, y, z);
color.setRGB(
  Math.max(0, cr * brightness),
  Math.max(0, cg * brightness),
  Math.max(0, cb * brightness)
);
`,
}
