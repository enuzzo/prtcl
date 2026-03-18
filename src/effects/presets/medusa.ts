import type { Effect } from '../../engine/types'

export const medusa: Effect = {
  id: 'medusa',
  slug: 'medusa',
  name: 'Medusa',
  description: 'A translucent bell of light drifting through the void, trailing filaments that serve no biological purpose whatsoever. It\'s beautiful and completely pointless \u2014 like most of the ocean.',
  author: 'PRTCL Team',
  category: 'creature',
  tags: ['jellyfish', 'creature', 'ik', 'tentacles', 'bioluminescent'],
  particleCount: 15000,
  pointSize: 1.2,
  cameraDistance: 18,
  cameraPosition: [2, -6, 16],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  controls: { pulse: 0.8, tentLen: 1.0, flow: 1.2, colorShift: 0.0 },
  createdAt: '2026-03-19',
  code: `
var pulse    = addControl('pulse',    'Pulse',           0.1, 3.0, 0.8);
var tentLen  = addControl('tentLen',  'Tentacle Length',  0.3, 2.0, 1.0);
var flow     = addControl('flow',     'Flow',             0.0, 3.0, 1.2);
var hShift   = addControl('colorShift','Color Shift',     0.0, 1.0, 0.0);

setInfo('Medusa', 'Bioluminescent jellyfish with IK tentacles');

// Audio
pulse = pulse * (1.0 + beat * 2.0);
tentLen = tentLen * (1.0 + bass * 0.5);
flow = flow * (1.0 + highs * 0.8);

// 150 arms x 100 joints = 15000 — O(1) per particle, no inner loop
var ARMS = 150;
var JOINTS = 100;
var armIdx = Math.floor(i / JOINTS);
var jointIdx = i % JOINTS;

if (armIdx >= ARMS) { target.set(99999,99999,99999); color.setRGB(0,0,0); } else {

// Per-arm hash
var h1 = Math.sin(armIdx * 127.1 + 311.7) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(armIdx * 269.5 + 183.3) * 43758.5453; h2 = h2 - Math.floor(h2);
var h3 = Math.sin(armIdx * 419.2 + 97.1) * 43758.5453; h3 = h3 - Math.floor(h3);

var armAngle = 2.0 * Math.PI * armIdx / ARMS;
var jn = jointIdx / JOINTS;
var t = time;

// Bell vs tentacle
var isBell = h1 < 0.3 ? 1.0 : 0.0;

// Center drift
var cx = 1.5 * Math.sin(t * 0.15);
var cy = 2.0 * Math.sin(t * 0.1 + 0.5);
var cz = 1.0 * Math.sin(t * 0.12 + 1.0);

// Bell pulse
var bellPhase = Math.sin(t * pulse * 2.0);
var bellScale = 1.0 + 0.15 * bellPhase;

// Root on bell perimeter
var rootR = 2.5 * bellScale;
var rootX = cx + rootR * Math.cos(armAngle);
var rootY = cy;
var rootZ = cz + rootR * Math.sin(armAngle);

var px, py, pz;

if (isBell > 0.5) {
  // Bell particle: dome shape, spread outward + upward
  var spread = 1.0 + jn * 2.0;
  var domeY = jn * 3.0 * (1.0 - jn * 0.5);
  px = rootX + jn * 2.0 * Math.cos(armAngle) * spread * bellScale;
  py = rootY + domeY * bellScale + 0.3 * Math.sin(t * pulse + jn * 3.14);
  pz = rootZ + jn * 2.0 * Math.sin(armAngle) * spread * bellScale;
} else {
  // Tentacle: hang down with flowing sway — analytical position
  var armLen = tentLen * (3.0 + h2 * 2.0);
  var depth = jn * armLen;
  var phase = h3 * 6.28;

  // Sway increases quadratically toward tip
  var swayAmp = jn * jn * flow * 1.5;
  var swayX = Math.sin(t * flow * 0.5 + phase + jn * 4.0) * swayAmp;
  var swayZ = Math.cos(t * flow * 0.4 + phase + jn * 3.5) * swayAmp;

  // Secondary curl at tips
  var curl = jn * jn * jn * 0.8;
  swayX += Math.sin(t * 1.2 + phase * 2.0 + jn * 8.0) * curl;
  swayZ += Math.cos(t * 1.0 + phase * 2.0 + jn * 7.0) * curl;

  px = rootX + swayX;
  py = rootY - depth - 0.5;
  pz = rootZ + swayZ;
}

target.set(px, py, pz);

// Color: bioluminescent cyan to purple
var hue = (0.52 + 0.23 * jn + hShift) % 1.0;
var sat = 0.7 + 0.3 * (1.0 - jn);
var lit = 0.15 + 0.55 * (1.0 - jn * 0.6);
lit = lit + 0.15 * Math.max(0, bellPhase) * (1.0 - jn);
lit = lit + beat * 0.2;
color.setHSL(hue, sat, Math.min(lit, 1.0));

}
`,
}
