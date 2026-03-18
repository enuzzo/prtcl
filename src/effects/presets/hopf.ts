import type { Effect } from '../../engine/types'

/**
 * Hopf Fibration Matrix
 * Stereographic projection of a 4D hypersphere (S³) into 3D space.
 * 1D fibers map to mathematically perfect interlocking tori.
 *
 * Original concept from particles.casberry.in community.
 * Refined and extended for PRTCL by PRTCL Team.
 */
export const hopf: Effect = {
  id: 'hopf-fibration',
  slug: 'hopf-fibration',
  name: 'Hopf Fibration',
  description: 'A 4D hypersphere projected into 3D. The math checks out. The visuals are unreasonable.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['hopf', 'fibration', '4D', 'hypersphere', 'topology', 'math'],
  particleCount: 20000,
  pointSize: 2,
  cameraDistance: 5,
  autoRotateSpeed: 2,
  createdAt: '2026-03-16',
  code: `
// Scale: original coords go up to ~80, we need ±5
var S = 0.06;

// ── Dynamics ─────────────────────────────────────────────
var pSpeed      = addControl('speed',      'Flow Dilation',      0, 5,   0.6);
var pScale      = addControl('scale',      'Projection Scale',  10, 200, 80);
var pWobble     = addControl('wobble',     'Quantum Wobble',     0, 2,   0.4);

// ── Appearance ───────────────────────────────────────────
var pGlow       = addControl('glow',       'Fiber Luminescence', 0, 1,   0.9);
var pComplexity = addControl('complexity', 'Harmonic Twist',     1, 12,  4);

if (i === 0) setInfo('Hopf Fibration', '4D hypersphere projected into 3D — interlocking tori');

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

// ── Coloring ─────────────────────────────────────────────
// Hue cycles by strand position on sphere + slow time drift
var hue = Math.abs((strandPhi / Math.PI) + (t * 0.15)) % 1.0;

// Pulsing glow along each fiber
var intensity = Math.pow(Math.sin(baseGamma * 16.0 - t * 6.0) * 0.5 + 0.5, 4.0);

// Brighter near projection singularity
var depthShadow = Math.max(0.0, 1.5 - dSafe) * 0.4;

var lum = 0.15 + pGlow * 0.65 * intensity + depthShadow;
color.setHSL(hue, 0.9, Math.max(0.01, Math.min(1.0, lum)));
`,
}
