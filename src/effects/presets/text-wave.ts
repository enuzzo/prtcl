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
  defaultText: 'Netmilk\nStudio',
  defaultFont: 'Pacifico',
  createdAt: '2026-03-18',
  code: `
var waveAmp = addControl("waveAmp", "Wave Amplitude", 0.1, 3.0, 0.8);
var waveFreq = addControl("waveFreq", "Wave Frequency", 0.5, 5.0, 2.0);
var waveSpeed = addControl("waveSpeed", "Wave Speed", 0.1, 3.0, 1.0);
var colorShift = addControl("colorShift", "Color Shift", 0.0, 2.0, 1.0);
// 0=PRTCL, 1=Ocean, 2=Sunset, 3=Neon, 4=Spectrum
var palette = addControl("wavePalette", "Palette", 0.0, 4.0, 0.0);

if (textPoints && i * 6 + 5 < textPoints.length) {
  var tx = textPoints[i * 6];
  var ty = textPoints[i * 6 + 1];

  // Sine wave displacement in Z based on X position and time
  var phase = tx * waveFreq + time * waveSpeed;
  var zDisp = Math.sin(phase) * waveAmp;

  // Secondary wave for visual richness
  var phase2 = ty * waveFreq * 0.7 + time * waveSpeed * 1.3;
  var zDisp2 = Math.sin(phase2) * waveAmp * 0.3;

  target.set(tx, ty, zDisp + zDisp2);

  // Wave phase for color: -1 to 1 normalized
  var wavePhase = Math.sin(phase);
  var normalizedZ = (zDisp + waveAmp) / (waveAmp * 2);

  // Emoji color detection
  var eR = textPoints[i * 6 + 3];
  var eG = textPoints[i * 6 + 4];
  var eB = textPoints[i * 6 + 5];
  var isEmoji = (eR < 0.93 || eG < 0.93 || eB < 0.93);

  var mode = Math.round(palette);

  if (isEmoji) {
    // Native emoji color, modulated by wave height
    var bright = 0.8 + normalizedZ * 0.2;
    color.setRGB(eR * bright, eG * bright, eB * bright);
  } else if (mode <= 0) {
    // PRTCL — smooth magenta→lime gradient following the wave
    var t = normalizedZ;
    color.setRGB(
      1.0 - t * 0.51,   // 1.0 → 0.49
      0.17 + t * 0.83,   // 0.17 → 1.0
      0.84 - t * 0.84    // 0.84 → 0.0
    );
  } else if (mode <= 1) {
    // Ocean — deep blue troughs, white foam crests, cyan mid
    var foam = normalizedZ * normalizedZ;
    var r = foam * 0.9;
    var g = 0.2 + normalizedZ * 0.6 + foam * 0.2;
    var b = 0.4 + normalizedZ * 0.3 + (1.0 - normalizedZ) * 0.3;
    color.setRGB(r, g, b);
  } else if (mode <= 2) {
    // Sunset — deep red/orange troughs, golden/pink peaks
    var r = 0.9 + normalizedZ * 0.1;
    var g = 0.15 + normalizedZ * 0.55;
    var b = 0.05 + normalizedZ * 0.35;
    color.setRGB(r, g, b);
  } else if (mode <= 3) {
    // Neon — smooth cyan↔magenta gradient with wave motion
    var t = Math.sin(phase * 0.5 + time * 0.3) * 0.5 + 0.5;
    color.setRGB(
      t,                 // 0→1 (cyan→magenta)
      1.0 - t,           // 1→0
      1.0 - t * 0.4      // 1→0.6
    );
  } else {
    // Spectrum — full rainbow following the wave propagation
    var hue = (phase * 0.08 + time * 0.02) % 1.0;
    if (hue < 0.0) hue = hue + 1.0;
    color.setHSL(hue, 1.0, 0.5 + normalizedZ * 0.15);
  }
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
  disturbMode: 'repel',
  disturbStrength: 1.5,
}
