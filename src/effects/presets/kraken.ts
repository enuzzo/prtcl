import type { Effect } from '../../engine/types'

export const kraken: Effect = {
  id: 'kraken',
  slug: 'kraken',
  name: 'Kraken',
  description: 'Eighteen arms of pure aggression, coiling and striking at nothing. It has the temperament of a cornered octopus and the attention span of a caffeinated squirrel.',
  author: 'PRTCL Team',
  category: 'creature',
  tags: ['kraken', 'creature', 'ik', 'tentacles', 'aggressive'],
  particleCount: 18000,
  pointSize: 0.8,
  cameraDistance: 20,
  cameraPosition: [0, 2, 18],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.8,
  cameraZoom: 1,
  controls: { aggression: 1.0, coil: 1.0, arms: 18, krakenColor: 0 },
  createdAt: '2026-03-19',
  code: `
var aggro    = addControl('aggression','Aggression',  0.1, 3.0, 1.0);
var coil     = addControl('coil',      'Coil',        0.0, 2.0, 1.0);
var nArms    = addControl('arms',      'Arms',        6,  30,  18);
var cMode    = addControl('krakenColor','Color Mode',  0,   2,   0);

setInfo('Kraken', 'Aggressive IK tentacle creature');

// Audio
coil = coil * (1.0 + bass * 0.8);
aggro = aggro * (1.0 + energy * 0.6);

// Dynamic arm count — analytical position, no inner loop
var ARMS = Math.max(6, Math.round(nArms));
var JOINTS = Math.floor(18000 / ARMS);
var armIdx = Math.floor(i / JOINTS);
var jointIdx = i % JOINTS;

if (armIdx >= ARMS) { target.set(99999,99999,99999); color.setRGB(0,0,0); } else {

var h1 = Math.sin(armIdx * 127.1 + 311.7) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(armIdx * 269.5 + 183.3) * 43758.5453; h2 = h2 - Math.floor(h2);
var h3 = Math.sin(armIdx * 419.2 + 97.1) * 43758.5453; h3 = h3 - Math.floor(h3);

var armAngle = 2.0 * Math.PI * armIdx / ARMS;
var jn = jointIdx / JOINTS;
var t = time * aggro;

// Center — aggressive Lissajous
var cx = 3.0 * Math.sin(t * 0.31) * Math.cos(t * 0.17);
var cy = 2.0 * Math.sin(t * 0.23 + 1.0);
var cz = 3.0 * Math.cos(t * 0.29) * Math.sin(t * 0.13);

// Root on sphere
var rootR = 1.5;
var rootPhi = armAngle + 0.3 * Math.sin(t * 0.4 + h1 * 6.28);
var rootTheta = Math.PI * 0.5 + (h2 - 0.5) * Math.PI * 0.6;
var rootX = cx + rootR * Math.sin(rootTheta) * Math.cos(rootPhi);
var rootY = cy + rootR * Math.cos(rootTheta);
var rootZ = cz + rootR * Math.sin(rootTheta) * Math.sin(rootPhi);

// Beat snap — one arm extends on beat
var snapArm = Math.floor(t * 7.0) % ARMS;
var isSnap = (armIdx === snapArm && beat > 0.3) ? 1.0 : 0.0;
var snapMul = 1.0 + isSnap * 3.0 * jn;

// Analytical coiling spiral position
var armLen = 4.0 * (0.8 + h3 * 0.4);
var reach = jn * armLen * snapMul;
var spiralAngle = armAngle + jn * coil * 4.0 * Math.PI + t * 0.5;
var spiralR = reach * (1.0 + 0.2 * Math.sin(t * 0.7 + h3 * 6.28 + jn * 5.0));

// Vertical undulation
var dy = Math.sin(jn * 3.14 + t * 1.2 + h1 * 6.28) * reach * 0.15;

// Aggressive twitch
var twitchX = Math.sin(t * 3.0 + jn * 8.0 + h1 * 20.0) * jn * aggro * 0.3;
var twitchZ = Math.cos(t * 2.7 + jn * 7.0 + h2 * 20.0) * jn * aggro * 0.3;

var px = rootX + Math.cos(spiralAngle) * spiralR + twitchX;
var py = rootY + dy;
var pz = rootZ + Math.sin(spiralAngle) * spiralR + twitchZ;

target.set(px, py, pz);

// Color modes
var mode = Math.round(cMode);
var hue, sat, lit;

if (mode === 1) {
  // Venom: green/purple
  hue = 0.3 + 0.4 * jn + 0.05 * Math.sin(t * 0.5 + armAngle);
  sat = 0.8 + 0.2 * (1.0 - jn);
  lit = 0.12 + 0.5 * (1.0 - jn * 0.5);
} else if (mode === 2) {
  // Abyss: deep blue/cyan
  hue = 0.55 + 0.12 * jn + 0.03 * Math.sin(t * 0.3);
  sat = 0.6 + 0.4 * (1.0 - jn);
  lit = 0.1 + 0.55 * (1.0 - jn * 0.4);
} else {
  // Lava: red/orange/magenta
  hue = (0.98 + 0.12 * jn + 0.03 * Math.sin(t * 0.5 + armAngle)) % 1.0;
  sat = 0.85 + 0.15 * Math.sin(jn * 3.14);
  lit = 0.15 + 0.55 * (1.0 - jn * 0.4);
}

lit = lit + beat * 0.25;
lit = lit + isSnap * 0.3 * jn;
color.setHSL(hue, sat, Math.min(lit, 1.0));

}
`,
  disturbMode: 'repel',
  disturbStrength: 2.5,
  disturbRadius: 5.0,
}
