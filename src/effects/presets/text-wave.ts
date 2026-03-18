import type { Effect } from '../../engine/types'

export const textWave: Effect = {
  id: 'text-wave',
  slug: 'text-wave',
  name: 'Text Wave',
  description: 'Your words, surfing a sine wave. It\'s just trigonometry but I\'ve made it look like poetry. Someone had to.',
  category: 'text',
  tags: ['text', 'wave', 'sine', '3d'],
  author: 'PRTCL Team',
  particleCount: 15000,
  pointSize: 0.6,
  autoRotateSpeed: 0.3,
  cameraDistance: 7,
  cameraPosition: [0, 0, 7] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var waveAmp = addControl("waveAmp", "Wave Amplitude", 0.1, 3.0, 0.8);
var waveFreq = addControl("waveFreq", "Wave Frequency", 0.5, 5.0, 2.0);
var waveSpeed = addControl("waveSpeed", "Wave Speed", 0.1, 3.0, 1.0);
var colorShift = addControl("colorShift", "Color Shift", 0.0, 2.0, 1.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Sine wave displacement in Z based on X position and time
  var phase = tx * waveFreq + time * waveSpeed;
  var zDisp = Math.sin(phase) * waveAmp;

  // Secondary wave for visual richness
  var phase2 = ty * waveFreq * 0.7 + time * waveSpeed * 1.3;
  var zDisp2 = Math.sin(phase2) * waveAmp * 0.3;

  target.set(tx, ty, zDisp + zDisp2);

  // Color based on Z displacement — warm peaks, cool troughs
  var normalizedZ = (zDisp + waveAmp) / (waveAmp * 2);
  var hue = 0.85 - normalizedZ * colorShift * 0.4; // pink→cyan range
  color.setHSL(hue, 0.9, 0.55 + normalizedZ * 0.2);
} else {
  // Fallback: origin with dim color
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
