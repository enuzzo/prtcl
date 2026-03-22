import type { Effect } from '../../engine/types'

/**
 * Fractal Frequency Field
 * A pulsing 3D harmonic structure inspired by sound waves,
 * interference patterns, and recursive fractal oscillations.
 * Golden-angle sunflower spiral base with layered wave distortion.
 *
 * Credit: Gabi (via particles.casberry.in community)
 * Refined and extended for PRTCL by PRTCL Team.
 */
export const frequency: Effect = {
  id: 'frequency',
  slug: 'frequency',
  name: 'Fractal Frequency',
  description: 'A recursive waveform that pulses whether you deserve it or not. Try the audio input. I dare you.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['frequency', 'fractal', 'waves', 'harmonic', 'audio', 'spiral', 'interference'],
  particleCount: 24000,
  pointSize: 0.43,
  cameraDistance: 5,
  cameraPosition: [1.944, 0, -1.447],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 1,
  cameraZoom: 1.4,
  createdAt: '2026-03-17',
  controls: { freq: 2.253, amp: 11.23, pulse: 0.455, fractal: 2.478, colorSpeed: 1 },
  code: `
// Scale factor: original runs at coords up to ~50, camera at z=100
// We need ±5 range, so S ≈ 0.06
var S = 0.06;

var freq = addControl("freq", "Frequency", 0.1, 10.0, 2.5);
var amp = addControl("amp", "Amplitude", 0.1, 50.0, 15.0);
var pulse = addControl("pulse", "Pulse Speed", 0.1, 5.0, 0.633);
var fractal = addControl("fractal", "Fractal Depth", 1.0, 6.0, 3.0);
var colorSpeed = addControl("colorSpeed", "Color Speed", 0.0, 5.0, 1.0);

// Audio modulation (values are 0 when mic is off — no effect)
// Bass → amplitude (shape breathes with kick/bass)
amp = amp * (1.0 + bass * 1.5);
// Highs → frequency (shimmer speeds up with hi-hats/cymbals)
freq = freq * (1.0 + highs * 0.8);
// Mids → pulse speed (vocals/guitar make it throb faster)
pulse = pulse * (1.0 + mids * 0.6);

var t = time * pulse;
var fi = i / count;

var golden = 2.399963229728653;
var r = Math.sqrt(fi);
var theta = i * golden;

// base spiral position (sunflower pattern)
var bx = r * Math.cos(theta);
var by = r * Math.sin(theta);
var bz = (fi - 0.5) * 2.0;

// fractal wave layering (recursive harmonic approximation)
var f1 = Math.sin(bx * freq + t) * Math.cos(by * freq - t);
var f2 = Math.sin(by * freq * 2.0 - t * 1.3) * Math.cos(bz * freq * 1.5 + t);
var f3 = Math.sin(bz * freq * 3.0 + t * 0.7) * Math.cos(bx * freq * 2.5 - t);

var wave = (f1 + f2 * 0.5 + f3 * 0.25) / (1.0 + fractal * 0.25);

// radial pulsing (audio-like oscillation)
var pulseWave = Math.sin(r * freq * 10.0 - t * 2.0) * amp * 0.2;

// interference distortion
var distortion = wave * amp;

// apply transformations
var nx = bx * (amp + distortion + pulseWave);
var ny = by * (amp + distortion + pulseWave);
var nz = bz * (amp + distortion) + wave * amp * 0.5;

// subtle spiral rotation over time
var ct = Math.cos(t * 0.2);
var st = Math.sin(t * 0.2);

var rx = nx * ct - ny * st;
var ry = nx * st + ny * ct;

target.set(rx * S, ry * S, nz * S);

// color based on frequency energy — colorSpeed controls cycling rate
var waveEnergy = Math.abs(wave);
var colorT = time * colorSpeed;
var hue = 0.6 + 0.4 * Math.sin(waveEnergy * 3.0 + colorT);
var sat = 0.8 + 0.2 * waveEnergy;
var light = 0.4 + 0.3 * waveEnergy;
// Audio color shift — hue wanders with energy
hue = hue + energy * 0.15;
// Beat flash — gentle brightness nudge on onset
light = light + beat * 0.25;
sat = sat - beat * 0.15;
color.setHSL(hue, sat, light);

if (i === 0) {
  setInfo(
    "Fractal Frequency Field",
    "A pulsing 3D harmonic structure inspired by sound waves and fractal oscillations."
  );
}
`,
}
