import type { Effect } from '../../engine/types'

export const nebula: Effect = {
  id: 'nebula-organica',
  slug: 'nebula-organica',
  name: 'Nebula Organica',
  description: 'A gas cloud that breathes. Perfectly calm. Until you inevitably touch the amplitude slider and ruin everything. Go ahead.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['nebula', 'gas', 'organic', 'volumetric'],
  particleCount: 15000,
  cameraDistance: 5,
  createdAt: '2026-03-01',
  code: `
var speed = addControl('speed', 'Speed', 0.1, 3, 0.8);
var scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
var turbulence = addControl('turbulence', 'Turbulence', 0, 2, 0.8);

// Audio modulation — each band drives a different dimension
// Mids → turbulence (vocals/guitars churn the gas)
turbulence = turbulence + mids * 1.2;
// Bass → scale (kick drum inflates the nebula)
scale = scale * (1.0 + bass * 0.6);
// Highs → speed (hi-hats make the cloud breathe faster)
speed = speed * (1.0 + highs * 0.8);

setInfo('Nebula Organica', 'Volumetric gas cloud with breathing animation');

// Deterministic seed from particle index
var seed = i * 1.618033988749;
var phi = (seed % 1) * Math.PI * 2;
var cosTheta = ((seed * 0.7071) % 1) * 2 - 1;
var sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
var r = Math.pow((seed * 0.3183) % 1, 0.333) * scale;

// Base spherical position
var x = r * sinTheta * Math.cos(phi);
var y = r * sinTheta * Math.sin(phi);
var z = r * cosTheta;

// Breathing animation
var breathe = 1 + 0.15 * Math.sin(time * speed + r * 2);

// Turbulence displacement
var tx = Math.sin(x * 3 + time * speed * 0.7) * turbulence * 0.3;
var ty = Math.cos(y * 3 + time * speed * 0.5) * turbulence * 0.3;
var tz = Math.sin(z * 3 + time * speed * 0.6) * turbulence * 0.3;

target.set(
  (x + tx) * breathe,
  (y + ty) * breathe,
  (z + tz) * breathe
);

// HSL coloring around blue (hue ~0.6)
var hue = 0.55 + 0.1 * Math.sin(r * 2 + time * speed * 0.3);
var sat = 0.6 + 0.3 * Math.sin(phi + time * 0.2);
var lum = 0.4 + 0.3 * (1 - r / scale);
// Energy shifts hue toward warmer tones (blue → purple → pink)
hue = hue - energy * 0.1;
// Beat flash — gentle nudge toward white
lum = lum + beat * 0.25;
sat = sat - beat * 0.15;
color.setHSL(hue, sat, lum);
`,
}
