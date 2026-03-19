import type { Effect } from '../../engine/types'

export const anemone: Effect = {
  id: 'anemone',
  slug: 'anemone',
  name: 'Anemone',
  description: 'Thirty tendrils swaying in a current that doesn\'t exist. It sits there. That\'s it. That\'s the whole effect. And yet you\'ll watch it for ten minutes.',
  author: 'PRTCL Team',
  category: 'creature',
  tags: ['anemone', 'creature', 'ik', 'tentacles', 'meditative'],
  particleCount: 20000,
  pointSize: 0.6,
  cameraDistance: 16,
  cameraPosition: [3, 5, 14],
  cameraTarget: [0, 1, 0],
  autoRotateSpeed: 0.2,
  cameraZoom: 1,
  controls: { density: 30, sway: 1.0, current: 0.5, anemonePalette: 0 },
  createdAt: '2026-03-19',
  code: `
var nDensity = addControl('density',       'Density',       10, 50, 30);
var sway     = addControl('sway',          'Sway',          0.0, 3.0, 1.0);
var current  = addControl('current',       'Current Speed', 0.0, 2.0, 0.5);
var pal      = addControl('anemonePalette','Palette',       0,   3,   0);

setInfo('Anemone', 'Sea anemone with swaying tendrils');

// Audio
sway = sway * (1.0 + highs * 0.8);
current = current * (1.0 + mids * 0.6);
var breatheAudio = 1.0 + bass * 0.4;

// Dynamic arm count — analytical position, no inner loop
var ARMS = Math.max(10, Math.round(nDensity));
var JOINTS = Math.floor(20000 / ARMS);
var armIdx = Math.floor(i / JOINTS);
var jointIdx = i % JOINTS;

if (armIdx >= ARMS) { target.set(99999,99999,99999); color.setRGB(0,0,0); } else {

var h1 = Math.sin(armIdx * 127.1 + 311.7) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(armIdx * 269.5 + 183.3) * 43758.5453; h2 = h2 - Math.floor(h2);
var h3 = Math.sin(armIdx * 419.2 + 97.1) * 43758.5453; h3 = h3 - Math.floor(h3);

var armAngle = 2.0 * Math.PI * armIdx / ARMS + h1 * 0.3;
var jn = jointIdx / JOINTS;
var t = time * current;

// Base circle
var baseR = 2.0 + h2 * 1.5;
var baseX = baseR * Math.cos(armAngle);
var baseZ = baseR * Math.sin(armAngle);
var baseY = -3.0;

// Arm height varies per arm
var armHeight = (5.0 + h3 * 3.0) * breatheAudio;

// Breathing
var breathe = 1.0 + 0.08 * Math.sin(time * 0.3);

// Analytical position — grow upward with sway
var height = jn * armHeight * breathe;
var phase = h1 * 6.28 + h2 * 3.14;

// Sway — quadratic increase toward tip
var swayAmp = jn * jn * sway * 1.5;
var swayX = Math.sin(t * 0.7 + phase + jn * 4.0) * swayAmp;
var swayZ = Math.cos(t * 0.6 + phase * 1.3 + jn * 3.5) * swayAmp;

// Tip curl — cubic increase
var curlAmp = jn * jn * jn * 0.8 * sway;
swayX += Math.sin(t * 1.3 + phase * 2.0 + jn * 8.0 + h3 * 6.28) * curlAmp;
swayZ += Math.cos(t * 1.1 + phase * 2.5 + jn * 7.0) * curlAmp;

// Audio mids — traveling wave
var wavePhase = jn * 6.28 - t * 3.0;
swayX += Math.sin(wavePhase) * mids * 0.3 * jn;
swayZ += Math.cos(wavePhase) * mids * 0.3 * jn;

var px = baseX + swayX;
var py = baseY + height;
var pz = baseZ + swayZ;

target.set(px, py, pz);

// Color palettes
var paletteIdx = Math.round(pal);
var hue, sat, lit;
var armHueOff = h1 * 0.1;

if (paletteIdx === 1) {
  // Neon: electric pink/green/blue
  hue = (0.85 + 0.5 * jn + armHueOff) % 1.0;
  sat = 0.9;
  lit = 0.2 + 0.5 * (1.0 - jn * 0.3);
} else if (paletteIdx === 2) {
  // Deep Sea: dark blue/bioluminescent
  hue = 0.58 + 0.08 * jn + armHueOff * 0.5;
  sat = 0.5 + 0.4 * (1.0 - jn);
  lit = 0.08 + 0.35 * (1.0 - jn * 0.5);
} else if (paletteIdx === 3) {
  // Blossom: soft pink/white/lavender
  hue = (0.88 + 0.08 * jn + armHueOff) % 1.0;
  sat = 0.4 + 0.3 * (1.0 - jn);
  lit = 0.3 + 0.45 * (1.0 - jn * 0.3);
} else {
  // Reef: warm coral/turquoise/gold
  hue = (0.05 + 0.45 * jn + armHueOff) % 1.0;
  sat = 0.75 + 0.2 * Math.sin(jn * 3.14);
  lit = 0.15 + 0.5 * (1.0 - jn * 0.4);
}

lit = lit + beat * 0.2 * jn;
lit = lit * (0.9 + 0.1 * Math.sin(time * 0.3 + jn * 3.14));
color.setHSL(hue, sat, Math.min(lit, 1.0));

}
`,
  disturbMode: 'attract',
  disturbStrength: 0.6,
  disturbRadius: 5.0,
}
