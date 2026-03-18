import type { Effect } from '../../engine/types'

export const textDissolve: Effect = {
  id: 'text-dissolve',
  slug: 'text-dissolve',
  name: 'Text Dissolve',
  description: 'Sand that remembers its shape. Particles drift away into noise, then snap back. Ethereal.',
  category: 'text',
  tags: ['text', 'dissolve', 'noise', 'reform'],
  author: 'PRTCL Team',
  particleCount: 12000,
  pointSize: 0.7,
  autoRotateSpeed: 0,
  cameraDistance: 6,
  cameraPosition: [0, 0, 6] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var dissolveSpeed = addControl("dissolveSpeed", "Dissolve Speed", 0.1, 3.0, 0.8);
var noiseScale = addControl("noiseScale", "Noise Scale", 0.5, 5.0, 2.0);
var reformSpeed = addControl("reformSpeed", "Reform Speed", 0.5, 5.0, 2.0);
var intensity = addControl("intensity", "Intensity", 0.5, 5.0, 2.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Phase: dissolve out → reform back (sawtooth with smoothstep)
  var cycle = 4.0 / dissolveSpeed;
  var phase = (time * dissolveSpeed) % cycle;
  var halfCycle = cycle * 0.5;
  var drift;
  if (phase < halfCycle) {
    drift = phase / halfCycle; // 0→1 dissolve
    drift = drift * drift; // ease in
  } else {
    drift = 1.0 - (phase - halfCycle) / halfCycle; // 1→0 reform
    drift = drift * drift;
  }

  // Pseudo-noise displacement (layered trig, no library)
  var nx = Math.sin(tx * noiseScale + time * 0.7) * Math.cos(ty * noiseScale * 0.8 + time * 0.5);
  var ny = Math.cos(tx * noiseScale * 0.9 + time * 0.6) * Math.sin(ty * noiseScale + time * 0.8);
  var nz = Math.sin(tx * noiseScale * 0.5 + time * 1.3) * Math.cos(ty * noiseScale * 1.1 + time * 0.4);

  // Per-particle variation using index as seed
  var pSeed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  var pVar = pSeed - Math.floor(pSeed); // 0-1
  var driftScale = drift * intensity * (0.5 + pVar);

  target.set(
    tx + nx * driftScale,
    ty + ny * driftScale,
    nz * driftScale
  );

  // Color: hue shifts with drift distance, desaturates as it dissolves
  var driftDist = Math.sqrt(nx * nx + ny * ny + nz * nz) * driftScale;
  var hue = (0.8 + driftDist * 0.1) % 1.0;
  var sat = 0.9 - drift * 0.4;
  var lum = 0.5 + drift * 0.15;
  color.setHSL(hue, sat, lum);
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
