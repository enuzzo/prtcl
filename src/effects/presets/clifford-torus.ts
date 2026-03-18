import type { Effect } from '../../engine/types'

export const cliffordTorus: Effect = {
  id: 'clifford-torus',
  slug: 'clifford-torus',
  name: '4D Clifford Torus',
  description: 'A torus living in 4D, rotating through six orthogonal planes and projected into 3D. Hypnotic.',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['4d', 'clifford', 'torus', 'geometry', 'math'],
  particleCount: 23000,
  pointSize: 2.5,
  cameraDistance: 43,
  cameraPosition: [11.649, 0, -41.581],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  controls: { scale: 38.494, speed: 0.686, wdist: 3.186, morph: 0.407, pulse: 2.314, brightness: 1.038, hueBase: 0.513, hueRange: 0.357 },
  createdAt: '2026-03-17',
  code: `
var scale  = addControl("scale",  "Scale",          10, 80,  38.494);
var speed  = addControl("speed",  "Rotation Speed",  0,  3,  0.686);
var wDist  = addControl("wdist",  "W Distance",      1,  8,  3.186);
var morph  = addControl("morph",  "Stereo Strength", 0,  1,  0.407);
var pulse  = addControl("pulse",  "Pulse Depth",     0,  5,  2.314);
var bright = addControl("brightness", "Brightness",  0.1, 3, 1.038);
var hBase  = addControl("hueBase",  "Color Base",    0, 1, 0.513);
var hRange = addControl("hueRange", "Color Range",   0, 1, 0.357);

setInfo("4D Clifford Torus", "Stereographic projection from 4D");

var u  = i / count;
var ga = 2.399963229728653;
var th = ga * i;
var ph = u * Math.PI * 14.0;

var r1 = 1.0 + 0.28 * Math.sin(th * 3.0 + time * pulse * 0.18);
var r2 = 1.0 + 0.28 * Math.cos(ph * 1.5 - time * pulse * 0.14);

var x4 = r1 * Math.cos(th);
var y4 = r1 * Math.sin(th);
var z4 = r2 * Math.cos(ph);
var w4 = r2 * Math.sin(ph);

// XW rotation
var a1 = time * speed * 0.31;
var c1 = Math.cos(a1), s1 = Math.sin(a1);
var tx1 = x4 * c1 - w4 * s1;
w4 = x4 * s1 + w4 * c1;
x4 = tx1;

// YZ rotation
var a2 = time * speed * 0.22;
var c2 = Math.cos(a2), s2 = Math.sin(a2);
var ty2 = y4 * c2 - z4 * s2;
z4 = y4 * s2 + z4 * c2;
y4 = ty2;

// XY rotation
var a3 = time * speed * 0.17;
var c3 = Math.cos(a3), s3 = Math.sin(a3);
var tx3 = x4 * c3 - y4 * s3;
y4 = x4 * s3 + y4 * c3;
x4 = tx3;

// ZW rotation
var a4 = time * speed * 0.13;
var c4 = Math.cos(a4), s4 = Math.sin(a4);
var tz4 = z4 * c4 - w4 * s4;
w4 = z4 * s4 + w4 * c4;
z4 = tz4;

// Stereographic projection
var wInv   = 1.0 / (wDist - w4 * morph);
var wOrtho = 1.0 / wDist;
var proj   = wInv * morph + wOrtho * (1.0 - morph);

var breathe = 1.0 + 0.06 * Math.sin(time * 1.1 + u * Math.PI * 2.0);

var px = x4 * proj * scale * breathe;
var py = y4 * proj * scale * breathe;
var pz = z4 * proj * scale * breathe;

target.set(px, py, pz);

// Color: W-coordinate drives hue, energy drives brightness
var wNorm  = 0.5 + 0.5 * Math.sin(w4 * Math.PI);
var phase  = Math.atan2(y4, x4) / (2.0 * Math.PI);
var hue    = ((hBase + hRange * wNorm + 0.12 * phase) % 1.0 + 1.0) % 1.0;
var energy = Math.max(0.0, Math.sin(w4 * Math.PI + time * 0.7));
var sat    = 0.55 + 0.45 * wNorm;
var lit    = (0.04 + 0.72 * energy * energy) * bright;

color.setHSL(hue, sat, Math.min(lit, 1.0));
`,
}
