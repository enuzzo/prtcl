import type { Effect } from '../../engine/types'

export const textDissolve: Effect = {
  id: 'text-dissolve',
  slug: 'text-dissolve',
  name: 'Text Dissolve',
  description: 'Particles with abandonment issues. They drift into the void, panic, and rush back into formation. Every. Single. Time.',
  category: 'text',
  tags: ['text', 'dissolve', 'noise', 'reform'],
  author: 'PRTCL Team',
  particleCount: 12000,
  pointSize: 1.7,
  autoRotateSpeed: -0.5,
  cameraDistance: 6,
  cameraPosition: [5.247, -0.682, 4.658] as [number, number, number],
  cameraZoom: 1.1,
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var dissolveSpeed = addControl("dissolveSpeed", "Dissolve Speed", 0.1, 3.0, 0.472);
var noiseScale = addControl("noiseScale", "Noise Scale", 0.5, 5.0, 2.231);
var reformSpeed = addControl("reformSpeed", "Reform Speed", 0.5, 5.0, 2.783);
var intensity = addControl("intensity", "Intensity", 0.5, 5.0, 3.31);
// Color mode: 0=PRTCL (magenta↔lime), 1=Spectrum (full rainbow), 2=Noir (black/grey shadows)
var colorMode = addControl("colorMode", "Color Mode", 0.0, 2.0, 0.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Phase: dissolve out → reform back (sawtooth with smoothstep)
  var cycle = 4.0 / dissolveSpeed;
  var phase = (time * dissolveSpeed) % cycle;
  var halfCycle = cycle * 0.5;
  var drift;
  if (phase < halfCycle) {
    drift = phase / halfCycle;
    drift = drift * drift;
  } else {
    drift = 1.0 - (phase - halfCycle) / halfCycle;
    drift = drift * drift;
  }

  // Pseudo-noise displacement (layered trig, no library)
  var nx = Math.sin(tx * noiseScale + time * 0.7) * Math.cos(ty * noiseScale * 0.8 + time * 0.5);
  var ny = Math.cos(tx * noiseScale * 0.9 + time * 0.6) * Math.sin(ty * noiseScale + time * 0.8);
  var nz = Math.sin(tx * noiseScale * 0.5 + time * 1.3) * Math.cos(ty * noiseScale * 1.1 + time * 0.4);

  // Per-particle variation using index as seed
  var pSeed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  var pVar = pSeed - Math.floor(pSeed);
  var driftScale = drift * intensity * (0.5 + pVar);

  target.set(
    tx + nx * driftScale,
    ty + ny * driftScale,
    nz * driftScale
  );

  var driftDist = Math.sqrt(nx * nx + ny * ny + nz * nz) * driftScale;

  // Round colorMode to nearest int for clean switching
  var mode = Math.round(colorMode);

  if (mode <= 0) {
    // PRTCL — magenta (#FF2BD6) ↔ lime (#7CFF00) signature palette
    // Particles shimmer between the two brand colors based on drift + position
    var blend = Math.sin(i * 0.37 + time * 0.5 + driftDist * 2.0) * 0.5 + 0.5;
    // Magenta: HSL ~0.89, 1.0, 0.59 | Lime: HSL ~0.24, 1.0, 0.50
    var hue = 0.89 + blend * (-0.65); // 0.89 → 0.24 (wraps via negative)
    if (hue < 0.0) hue = hue + 1.0;
    var sat = 0.85 + drift * 0.15;
    var lum = 0.45 + blend * 0.15 + (1.0 - drift) * 0.1;
    color.setHSL(hue, sat, lum);
  } else if (mode <= 1) {
    // Spectrum — full rainbow cycling through position + time
    var hue = (i / count + time * 0.08 + driftDist * 0.15) % 1.0;
    var sat = 0.9 - drift * 0.2;
    var lum = 0.5 + drift * 0.15;
    color.setHSL(hue, sat, lum);
  } else {
    // Noir — monochrome dark, shadows that breathe
    // Particles flicker between near-black and grey, ghostly appearance
    var flicker = Math.sin(i * 7.31 + time * 1.7) * Math.cos(i * 3.17 + time * 0.9);
    var shadow = flicker * 0.5 + 0.5; // 0-1
    // When formed (drift~0): dim but visible. When dissolved: darker, more contrast
    var baseLum = 0.08 + shadow * 0.25;
    var lum = baseLum * (1.0 - drift * 0.6) + drift * shadow * 0.15;
    // Very slight warm tint when bright, cool when dark
    var hue = shadow > 0.5 ? 0.08 : 0.6;
    var sat = 0.05 + shadow * 0.08;
    color.setHSL(hue, sat, lum);
  }
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
