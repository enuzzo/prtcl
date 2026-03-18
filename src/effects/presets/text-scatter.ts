import type { Effect } from '../../engine/types'

export const textScatter: Effect = {
  id: 'text-scatter',
  slug: 'text-scatter',
  name: 'Text Scatter',
  description: 'Your text disassembles in a cascade, orbits around pretending to be lost, then reassembles like it planned the whole thing. Dramatic.',
  category: 'text',
  tags: ['text', 'scatter', 'cascade', 'wled', 'aurora', 'organic'],
  author: 'PRTCL Team',
  particleCount: 14000,
  pointSize: 1.2,
  autoRotateSpeed: -0.3,
  cameraDistance: 6,
  cameraPosition: [4.5, -0.5, 5.0] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var cascade = addControl("cascade", "Cascade Width", 0.1, 1.0, 0.35);
var drift = addControl("drift", "Drift Radius", 1.0, 12.0, 5.0);
var orbitSpeed = addControl("orbitSpeed", "Orbit Speed", 0.0, 3.0, 1.2);
var sparkle = addControl("sparkle", "Sparkle", 0.0, 1.0, 0.6);
var palette = addControl("palette", "Palette", 0.0, 3.0, 0.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // ── Per-particle deterministic seeds ──
  var h1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  h1 = h1 - Math.floor(h1);
  var h2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
  h2 = h2 - Math.floor(h2);
  var h3 = Math.sin(i * 419.2 + 371.9) * 43758.5453;
  h3 = h3 - Math.floor(h3);

  // ── Staggered cascade timing ──
  // Each particle's phase is offset by its X position in the text
  // Creates a wave that rolls across the text, not a uniform explosion
  // Normalize tx to 0-1 range (text spans roughly -4 to 4)
  var posNorm = (tx + 4.0) / 8.0;
  if (posNorm < 0.0) posNorm = 0.0;
  if (posNorm > 1.0) posNorm = 1.0;

  // Add per-particle jitter to the cascade offset so it's not a perfect line
  var cascadeOffset = posNorm * cascade + h1 * cascade * 0.3;

  // Main cycle: ~6s total, but each particle enters at its own time
  var cycleLen = 6.0;
  var localTime = (time + cascadeOffset * cycleLen) % cycleLen;
  var cycleT = localTime / cycleLen; // 0-1

  // Smooth formation curve:
  // 0.0-0.3: drift in (scattered → forming)
  // 0.3-0.55: formed / near-formed (hold with gentle sway)
  // 0.55-0.85: drift out (dissolving cascade)
  // 0.85-1.0: fully scattered, orbiting
  var formT;
  if (cycleT < 0.3) {
    formT = cycleT / 0.3;
    formT = formT * formT * (3.0 - 2.0 * formT); // smoothstep in
  } else if (cycleT < 0.55) {
    formT = 1.0;
  } else if (cycleT < 0.85) {
    formT = 1.0 - (cycleT - 0.55) / 0.3;
    formT = formT * formT * (3.0 - 2.0 * formT); // smoothstep out
  } else {
    formT = 0.0;
  }

  // ── Orbital drift when scattered ──
  // Particles don't just fly straight — they curve and orbit
  var scatterT = 1.0 - formT;
  var orbitAngle = time * orbitSpeed * (0.5 + h2) + h1 * 6.28;
  var orbitR = drift * (0.3 + h3 * 0.7) * scatterT;

  // Spiral outward path (not uniform sphere)
  var driftX = Math.cos(orbitAngle) * orbitR * (0.8 + 0.4 * Math.sin(time * 0.7 + h1 * 3.0));
  var driftY = Math.sin(orbitAngle * 0.7 + 1.0) * orbitR * 0.6;
  var driftZ = Math.sin(orbitAngle * 0.5 + h2 * 6.28) * orbitR * 0.5;

  // Gentle sway even when formed (alive, not frozen)
  var swayAmt = 0.015 * formT;
  var swayX = Math.sin(time * 1.3 + i * 0.47) * swayAmt;
  var swayY = Math.cos(time * 0.9 + i * 0.31) * swayAmt;

  target.set(
    tx + driftX + swayX,
    ty + driftY + swayY,
    driftZ
  );

  // ── WLED-inspired progressive color ──
  var pal = Math.round(palette);

  // Color chase position — sweeps across text over time
  var chase = (time * 0.15 + posNorm) % 1.0;
  // Secondary wave for depth
  var wave2 = (time * 0.08 - posNorm * 0.5 + h1 * 0.2) % 1.0;
  if (wave2 < 0.0) wave2 = wave2 + 1.0;

  var hue = 0.0;
  var sat = 0.85;
  var lum = 0.0;

  if (pal <= 0) {
    // Aurora — bands of cyan, green, purple that sweep across
    hue = 0.45 + chase * 0.25 + wave2 * 0.15;
    if (hue > 1.0) hue = hue - 1.0;
    sat = 0.7 + scatterT * 0.2;
    lum = 0.35 + formT * 0.2 + wave2 * 0.1;
  } else if (pal <= 1) {
    // PRTCL chase — magenta/lime wipe that rolls across the text
    var blend = (chase + wave2 * 0.3) % 1.0;
    hue = blend < 0.5 ? 0.89 + blend * 0.44 : 0.24 + (blend - 0.5) * 1.3;
    if (hue > 1.0) hue = hue - 1.0;
    if (hue < 0.0) hue = hue + 1.0;
    sat = 0.9;
    lum = 0.35 + formT * 0.25;
  } else if (pal <= 2) {
    // Fire — warm flickering chase
    hue = 0.0 + chase * 0.1 + wave2 * 0.05;
    sat = 0.85 + wave2 * 0.15;
    lum = 0.25 + chase * 0.3 + formT * 0.15;
  } else {
    // Ocean — deep blue to teal progressive
    hue = 0.55 + chase * 0.12 - wave2 * 0.08;
    if (hue < 0.0) hue = hue + 1.0;
    sat = 0.75 + scatterT * 0.2;
    lum = 0.2 + formT * 0.3 + wave2 * 0.15;
  }

  // ── Sparkle overlay ──
  // Random particles flash white for a frame, like fairy lights
  if (sparkle > 0.01) {
    var sparkHash = Math.sin(i * 93.17 + Math.floor(time * 12.0) * 7.31) * 43758.5453;
    sparkHash = sparkHash - Math.floor(sparkHash);
    if (sparkHash > 1.0 - sparkle * 0.08) {
      hue = 0.0;
      sat = 0.0;
      lum = 0.85 + sparkHash * 0.15;
    }
  }

  // Dim scattered particles slightly for depth
  lum = lum * (0.6 + formT * 0.4);

  color.setHSL(hue, sat, lum);
} else {
  target.set(0, 0, 0);
  color.setHSL(0, 0, 0.05);
}
`,
}
