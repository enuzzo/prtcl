import type { Effect } from '../../engine/types'

/**
 * Hopf Fibration Matrix
 * Stereographic projection of a 4D hypersphere (S³) into 3D space.
 * 1D fibers map to mathematically perfect interlocking tori.
 * Revamp: comet heads race along each fiber, the base sphere drifts so the
 * fibration slowly turns itself inside out, and palettes are selectable.
 *
 * Original concept from particles.casberry.in community.
 * Refined and extended for PRTCL by PRTCL Team.
 */
export const hopf: Effect = {
  id: 'hopf-fibration',
  slug: 'hopf-fibration',
  name: 'Hopf Fibration',
  description: 'A 4D hypersphere forced through your 3D monitor, with comets running the fibers like couriers. The topology is perfect. Your understanding of it is... optional.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['hopf', 'fibration', '4D', 'hypersphere', 'topology', 'math', 'comets'],
  particleCount: 17000,
  pointSize: 0.96,
  cameraDistance: 5,
  cameraPosition: [-3.74, 0, -5.34],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1,
  cameraZoom: 1,
  createdAt: '2026-03-16',
  bloom: true,
  bloomStrength: 0.4,
  bloomRadius: 0.4,
  bloomThreshold: 0.5,
  controls: { speed: 0.446, scale: 40.724, wobble: 0.4, glow: 0.9, complexity: 3.638, revolve: 0.3, hopfPalette: 0 },
  code: `
// Scale: original coords go up to ~80, we need ±5
var S = 0.06;

// ── Dynamics ─────────────────────────────────────────────
var pSpeed      = addControl('speed',      'Flow Dilation',      0, 5,   0.6);
var pScale      = addControl('scale',      'Projection Scale',  10, 200, 80);
var pWobble     = addControl('wobble',     'Quantum Wobble',     0, 2,   0.4);
var pRevolve    = addControl('revolve',    'Sphere Drift',       0, 1,   0.4);

// ── Appearance ───────────────────────────────────────────
var pGlow       = addControl('glow',       'Fiber Luminescence', 0, 1,   0.9);
var pComplexity = addControl('complexity', 'Harmonic Twist',     1, 12,  4);
// 0=Rainbow, 1=PRTCL, 2=Plasma, 3=Aurum
var pPalette    = addControl('hopfPalette', 'Palette', 0, 3, 0);

if (i === 0) setInfo('Hopf Fibration', '4D hypersphere projected into 3D — interlocking tori with fiber comets');

var t = time * pSpeed;
var pointsPerStrand = 250.0;
var strandId = Math.floor(i / pointsPerStrand);
var pointId = i % pointsPerStrand;
var totalStrands = Math.max(1.0, Math.floor(count / pointsPerStrand));

// Golden ratio distribution for even strand placement on S²
var goldenRatio = 1.618033988749895;
var strandTheta = 2.0 * Math.PI * strandId / goldenRatio;
var sThetaClamp = Math.max(0.0001, Math.min(0.9999, (strandId + 0.5) / totalStrands));
var strandPhi = Math.acos(1.0 - 2.0 * sThetaClamp);

// Sphere drift — the base point wanders, so tori exchange places and the
// whole fibration slowly turns itself inside out
strandTheta = strandTheta + t * 0.15 * pRevolve;
strandPhi = strandPhi + 0.18 * pRevolve * Math.sin(t * 0.21 + strandTheta * 0.5);

// Hopf coordinates on S³
var baseAlpha = strandPhi * 0.5;
var baseBeta = strandTheta;
var baseGamma = (pointId / pointsPerStrand) * Math.PI * 2.0;

// Animated S³ coordinates with wobble
var animGamma = baseGamma + t;
var animBeta = baseBeta + Math.cos(baseGamma * pComplexity + t) * 0.1 * pWobble;
var animAlpha = baseAlpha + Math.sin(baseGamma * (pComplexity + 1.0) - t) * 0.05 * pWobble;

// S³ → quaternion components
var xi1 = Math.cos(animAlpha) * Math.cos(animBeta);
var xi2 = Math.cos(animAlpha) * Math.sin(animBeta);
var xi3 = Math.sin(animAlpha) * Math.cos(animGamma);
var xi4 = Math.sin(animAlpha) * Math.sin(animGamma);

// Stereographic projection from south pole
var distFromPole = 1.0 - xi4;
var dSafe = Math.max(0.08, distFromPole);

var px = (xi1 / dSafe) * pScale * S;
var py = (xi2 / dSafe) * pScale * S;
var pz = (xi3 / dSafe) * pScale * S;

target.set(px, py, pz);

// ── COMETS — a bright head races each fiber, towing a decaying tail ──
var fiberPos = pointId / pointsPerStrand;
var headPos = (t * 0.22 + strandId * 0.61803) % 1.0;
var cd = (headPos - fiberPos + 1.0) % 1.0; // tail trails behind the motion
var comet = Math.exp(-cd * 9.0);

// Ambient fiber pulse (dimmer than before — comets carry the drama now)
var ambient = Math.pow(Math.sin(baseGamma * 16.0 - t * 6.0) * 0.5 + 0.5, 4.0) * 0.4;

// Brighter near projection singularity
var depthShadow = Math.max(0.0, 1.5 - dSafe) * 0.4;

// ── PALETTES ─────────────────────────────────────────────
var pal = Math.round(pPalette);
var hue, sat;
var phiN = strandPhi / Math.PI;
if (pal <= 0) {
  // Rainbow — hue by sphere latitude, slow drift
  hue = Math.abs(phiN + (t * 0.15)) % 1.0;
  sat = 0.9;
} else if (pal <= 1) {
  // PRTCL — magenta and lime fibers interleaved
  var band = Math.sin(strandTheta * 2.0 + phiN * 6.0);
  hue = band > 0 ? 0.89 : 0.24;
  sat = 0.95;
} else if (pal <= 2) {
  // Plasma — indigo to hot pink along latitude
  hue = 0.62 + phiN * 0.3;
  sat = 0.85;
} else {
  // Aurum — white-gold engraving on black
  hue = 0.11;
  sat = 0.55 - comet * 0.4;
}

// Floor keeps the full torus body readable; comets ride on it
var lum = 0.07 + pGlow * (0.18 + 0.4 * ambient + 0.8 * comet) + depthShadow * 0.45;
color.setHSL(hue - Math.floor(hue), sat, Math.max(0.01, Math.min(1.0, lum)));
`,
  disturbMode: 'vortex',
  disturbStrength: 1.5,
}
