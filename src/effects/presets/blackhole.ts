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
  particleCount: 100000,
  pointSize: 0.98,
  cameraDistance: 5,
  cameraPosition: [1.252, 1.89, -3.181],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  backgroundPreset: 'onyx',
  cameraZoom: 0.8,
  bloom: true,
  bloomStrength: 0.65,
  bloomRadius: 0.65,
  bloomThreshold: 0.35,
  createdAt: '2026-03-16',
  code: `
// Gargantua-inspired black hole. Physics-adjacent. Borrows tricks from the
// WebGPU raytracer at github.com/dgreenheck/webgpu-galaxy:
//   • Anisotropic FBM turbulence (tangentially stretched) produces arc-shaped
//     striations instead of blob noise.
//   • Temperature profile T(r) = T_peak * (r_inner/r)^0.75 (thin-disk model).
//   • Blackbody-style piecewise color mapping — cool reds outside, white-hot
//     core, blue-white at the ISCO.
//   • Soft Doppler beaming (D^2) brightens the approaching side.
//   • Fog/fabric density: luminance floor at 65% so every particle is visible.
//   • Bloom (threshold 0.35) merges overlapping particles into continuous glow.

var S = 0.06;

var RS    = addControl('radius',    'Event Horizon',  0.2, 1.2, 0.36);
var MAX_R = addControl('max_r',     'Disk Radius',    1.5, 7,   3.234);
var THICK = addControl('thickness', 'Disk Thickness',   0, 1,   0.2);
var SPEED = addControl('speed',     'Orbit Speed',      0, 3,   0.3);
var TURB  = addControl('turbulence','Turbulence',       0, 1,   0.55);
var TEMP  = addControl('temp',      'Color Temp',       0, 1,   0.35);
var GLOW  = addControl('glow',      'Core Glow',        0, 2,   1.1);

if (i === 0) setInfo('Black Hole', 'Supermassive black hole with accretion disk');

var iRS  = RS / S;
var iMAX = MAX_R / S;
var INCL = 0.22; // ~13 deg disk tilt — oblique viewing angle

// Per-particle deterministic randoms + group id
var r1 = (i * 13.579) % 1.0;
var r2 = (i * 97.531) % 1.0;
var r3 = (i * 24.680) % 1.0;
var group = (i * 73.197) % 100.0;

var localTime = time * SPEED;

var x = 0, y = 0, z = 0;
var r = 0, theta = 0;
var turbOpacity = 1.0, doppler = 1.0;
var hue = 0.1, sat = 1.0, light = 0.0;

if (group < 85) {
  // ── ACCRETION DISK — 85% of particles for dense nebular fog ──
  // Inverse-weighted radius: more particles near the inner edge (hotter)
  r = iRS * 1.05 + Math.pow(r1, 0.45) * (iMAX - iRS * 1.05);

  // Keplerian rotation — omega ~ r^(-3/2)
  var angVel = Math.pow(iRS / r, 1.5) * 2.0;
  theta = r2 * 6.28318530718 + localTime * angVel;

  x = r * Math.cos(theta);
  z = r * Math.sin(theta);

  // Volumetric puff — 3x thicker than before for fabric/fog look
  var thickY = iRS * (0.06 + THICK * 0.35) * (0.4 + 0.6 * (r / iMAX));
  y = (r3 - 0.5) * thickY * 2.0;

  // ── ANISOTROPIC FBM TURBULENCE ───────────────────────────────
  // Continuous time — no crossfade, no periodic glitches
  var turbScale = 0.55;
  var stretch = 0.28;
  var rot = theta + localTime * angVel * 0.45;
  var nxC = r * turbScale;
  var cosR = Math.cos(rot) / stretch;
  var sinR = Math.sin(rot) / stretch;

  var t1 = Math.sin(nxC        + cosR * 1.13 + sinR * 2.27) * 0.5
         + Math.sin(nxC * 2.13 - cosR * 3.11 + sinR * 1.97) * 0.25
         + Math.sin(nxC * 4.27 + cosR * 5.31 - sinR * 4.17) * 0.125
         + Math.sin(nxC * 8.71 - cosR * 2.73 + sinR * 6.91) * 0.0625;

  var turb = t1 * 0.5 + 0.5;
  if (turb < 0) turb = 0; else if (turb > 1) turb = 1;
  // High floor: darkest arc still at 65% — no dead pixels in the fog
  turbOpacity = 0.65 + turb * 0.35;

  // ── SOFT DOPPLER BEAMING ─────────────────────────────────────
  // D^2 (not D^3), beta 0.25 — moderate asymmetry, no extreme dimming
  var velocityFactor = 1.0 / Math.sqrt(r / iRS);
  var beta = 0.25 * velocityFactor;
  var cosViewVel = Math.sin(theta);
  var D = 1.0 / (1.0 - beta * cosViewVel);
  doppler = D * D;
  if (doppler < 0.5) doppler = 0.5;
  if (doppler > 2.0) doppler = 2.0;

} else if (group < 93) {
  // ── LENSED HALO — compound rotation: spins on itself + precesses ──
  r = iRS * 1.22 + Math.pow(r1, 0.5) * (iMAX * 0.55 - iRS * 1.22);
  var haloPhi = r2 * 6.28318530718 + time * 0.6; // spins on own axis
  x = r * Math.cos(haloPhi);
  y = r * Math.sin(haloPhi);
  z = (r3 - 0.5) * iRS * 0.05;

  var prec = time * 0.35; // axis precession, independent of orbit speed
  var px = x * Math.cos(prec) - z * Math.sin(prec);
  var pz = x * Math.sin(prec) + z * Math.cos(prec);
  x = px; z = pz;

} else if (group < 97) {
  // ── PHOTON RING — razor-thin shell hugging the horizon ───────
  r = iRS * 1.008 + r1 * iRS * 0.015;
  var sPhi = r2 * 6.28318530718;
  var cth = r3 * 2.0 - 1.0;
  var sth = Math.sqrt(1.0 - cth * cth);
  x = r * sth * Math.cos(sPhi);
  y = r * sth * Math.sin(sPhi);
  z = r * cth;

} else {
  // ── BACKGROUND STARS ─────────────────────────────────────────
  r = iMAX * 1.5 + r1 * iMAX * 3.0;
  var bgPhi = r2 * 6.28318530718;
  var bgCth = r3 * 2.0 - 1.0;
  var bgSth = Math.sqrt(1.0 - bgCth * bgCth);
  x = r * bgSth * Math.cos(bgPhi);
  y = r * bgSth * Math.sin(bgPhi);
  z = r * bgCth;
}

// Tilt the composition around X axis (exclude background stars)
if (group < 97) {
  var ct_i = Math.cos(INCL), st_i = Math.sin(INCL);
  var ty = y * ct_i - z * st_i;
  var tz = y * st_i + z * ct_i;
  y = ty; z = tz;
}

x *= S; y *= S; z *= S;

// ─── COLOR ──────────────────────────────────────────────────────
// Blackbody-ish piecewise mapping — cool reds outside, white-hot core
function bbColor(tempK) {
  if (tempK < 3500)  return [0.02, 0.95, 0.34 * (tempK / 3500)];
  if (tempK < 5500)  { var a = (tempK - 3500) / 2000;
    return [0.02 + a * 0.09, 0.95 - a * 0.25, 0.34 + a * 0.32]; }
  if (tempK < 7500)  { var b = (tempK - 5500) / 2000;
    return [0.11 + b * 0.03, 0.70 - b * 0.55, 0.66 + b * 0.16]; }
  var c = Math.min(1, (tempK - 7500) / 4500);
  return [0.14 + c * 0.44, 0.18 + c * 0.22, 0.82 + c * 0.10];
}

if (group < 85) {
  var peakT = 8500 + TEMP * 4500; // 8500-13000 K at ISCO
  var tempK = peakT * Math.pow(iRS / r, 0.75);
  var bb = bbColor(tempK);
  hue = bb[0]; sat = bb[1];

  // Power-law radial decay — no harsh smoothstep cutoff zones
  var normR = (r - iRS * 1.05) / (iMAX - iRS * 1.05);
  if (normR < 0) normR = 0; else if (normR > 1) normR = 1;
  var radialFade = Math.pow(1.0 - normR * 0.75, 0.6); // [1.0 -> 0.44]

  // Brightness: temperature-boosted floor ensures all particles contribute
  var bbBoosted = 0.3 + bb[2] * 0.7; // lift cold outer disk above zero
  light = bbBoosted * (0.72 + GLOW * 0.28) * doppler * turbOpacity * radialFade;

} else if (group < 93) {
  // Lensed halo — warm gold, fading outward
  var hTempK = 7500 * Math.pow(iRS / r, 0.5);
  var hb = bbColor(hTempK);
  hue = hb[0]; sat = hb[1] * 0.55;
  var normH = (r - iRS) / (iMAX - iRS);
  if (normH < 0) normH = 0; else if (normH > 1) normH = 1;
  light = hb[2] * (0.6 + GLOW * 0.2) * Math.pow(1 - normH * 0.6, 1.2);

} else if (group < 97) {
  // Photon ring — white-hot, the brightest feature
  hue = 0.13; sat = 0.12;
  light = 0.92 + GLOW * 0.08;

} else {
  // Stars: mostly dim, few twinkle
  hue = 0.58 + r1 * 0.2;
  sat = 0.15;
  light = r2 > 0.972 ? 0.88 : 0.02;
}

target.set(x, y, z);
var clampedL = light < 0.0 ? 0.0 : (light > 1.0 ? 1.0 : light);
color.setHSL(hue, sat, clampedL);
`,
  disturbMode: 'vortex',
  disturbRadius: 5.0,
  disturbStrength: 1.8,
  controls: {
    radius: 0.283,
    max_r: 2.48,
    thickness: 0.278,
    speed: 0.887,
    turbulence: 0.383,
    temp: 0.357,
    glow: 0.922,
  },
}
