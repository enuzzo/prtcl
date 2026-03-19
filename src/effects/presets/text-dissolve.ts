import type { Effect } from '../../engine/types'

export const textDissolve: Effect = {
  id: 'text-dissolve',
  slug: 'text-dissolve',
  name: 'Text Dissolve',
  description: 'Particles with separation anxiety. They dissolve into noise, regret it immediately, and rush back. Every. Single. Time.',
  category: 'text',
  tags: ['text', 'dissolve', 'noise', 'reform'],
  author: 'PRTCL Team',
  particleCount: 16000,
  pointSize: 2.2,
  autoRotateSpeed: 1,
  cameraDistance: 6,
  cameraPosition: [-3.218, 2.426, -15.501] as [number, number, number],
  cameraZoom: 1,
  cameraTarget: [0, 0, 0] as [number, number, number],
  defaultText: '★ Netmilk ★',
  createdAt: '2026-03-18',
  code: `
var dissolveSpeed = addControl("dissolveSpeed", "Dissolve Speed", 0.1, 3.0, 0.828);
var noiseScale = addControl("noiseScale", "Noise Scale", 0.5, 5.0, 2.658);
var reformSpeed = addControl("reformSpeed", "Reform Speed", 0.5, 5.0, 3.637);
var intensity = addControl("intensity", "Intensity", 0.5, 5.0, 3.762);
// Color mode: 0=PRTCL (magenta↔lime), 1=Spectrum (full rainbow), 2=Noir (black/grey shadows)
var colorMode = addControl("colorMode", "Color Mode", 0.0, 2.0, 2.0);

if (textPoints && i * 6 + 5 < textPoints.length) {
  var tx = textPoints[i * 6];
  var ty = textPoints[i * 6 + 1];

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

  // Emoji color detection: use sampled RGB if not white
  var eR = textPoints[i * 6 + 3];
  var eG = textPoints[i * 6 + 4];
  var eB = textPoints[i * 6 + 5];
  var isEmoji = (eR < 0.93 || eG < 0.93 || eB < 0.93);

  // Round colorMode to nearest int for clean switching
  var mode = Math.round(colorMode);

  if (isEmoji) {
    // Use native emoji colors, modulated by drift for dissolve effect
    var lumMod = 0.7 + (1.0 - drift) * 0.3;
    color.setRGB(eR * lumMod, eG * lumMod, eB * lumMod);
  } else if (mode <= 0) {
    // PRTCL — smooth magenta↔lime gradient based on drift + position
    var t = Math.sin(i * 0.37 + time * 0.5 + driftDist * 2.0) * 0.5 + 0.5;
    color.setRGB(
      1.0 - t * 0.51,   // 1.0 → 0.49
      0.17 + t * 0.83,   // 0.17 → 1.0
      0.84 - t * 0.84    // 0.84 → 0.0
    );
  } else if (mode <= 1) {
    // Spectrum — vivid rainbow, smooth hue rotation across particles
    var hue = (i * 1.0 / count + time * 0.05) % 1.0;
    color.setHSL(hue, 1.0, 0.55);
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
