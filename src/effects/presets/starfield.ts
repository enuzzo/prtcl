import type { Effect } from '../../engine/types'

/**
 * Starfield — warp tunnel rewrite.
 * Stars are streaks now: each star owns a 6-point trail whose length scales
 * with velocity. A smooth hyperdrive surge modulates travel (closed-form
 * integral, so no position discontinuities), and a sparse violet dust layer
 * drifts behind everything for parallax depth.
 */
export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Stars at warp, now leaving skid marks. Same 1984 demoscene trick, retrofitted with a hyperdrive that surges whenever it feels dramatic. Your cortex falls for it anyway. Every single time.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['starfield', 'warp', 'space', 'hyperdrive', 'streaks', 'abstract'],
  particleCount: 18000,
  pointSize: 1.45,
  cameraDistance: 1,
  cameraPosition: [-3.927, -0.094, -8.913],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  backgroundPreset: 'onyx',
  cameraZoom: 1,
  bloom: true,
  bloomStrength: 0.5,
  bloomRadius: 0.45,
  bloomThreshold: 0.55,
  controls: {
    speed: 1.6,
    spread: 26,
    streak: 0.65,
    surge: 0.5,
    tint: 0.65,
  },
  createdAt: '2026-03-01',
  code: `
var speed  = addControl('speed',  'Warp Speed', 0.1, 5, 1.5);
var spread = addControl('spread', 'Spread', 5, 60, 25);
var streak = addControl('streak', 'Streak Length', 0, 1, 0.55);
var surge  = addControl('surge',  'Hyperdrive Surge', 0, 1, 0.45);
var tint   = addControl('tint',   'Star Tint', 0, 1, 0.6);

if (i === 0) setInfo('Starfield', 'Warp tunnel — streaking stars, hyperdrive surges, parallax dust');

var TRAIL = 6;
var depth = spread * 2;

// Hyperdrive surge: travel has a closed-form integral so velocity changes
// never teleport stars. Boost is a separate, purely visual pulse.
var w = 0.55;
var travel = speed * (time - (surge * 0.85) * Math.cos(w * time) / w);
var vNow   = speed * (1 + surge * 0.85 * Math.sin(w * time));
var boost  = Math.max(0, Math.sin(w * time));
boost = boost * boost * boost;

var s = Math.floor(i / TRAIL);
var k = i % TRAIL;

// Deterministic hashes per star
var h = s * 2654435761;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = ((h >>> 16) ^ h) * 0x45d9f3b;
h = (h >>> 16) ^ h;
var hash1 = (h & 0xffff) / 65535;
h = (h * 1103515245 + 12345) & 0x7fffffff;
var hash2 = ((h >>> 8) & 0xffff) / 65535;
h = (h * 1103515245 + 12345) & 0x7fffffff;
var hash3 = ((h >>> 8) & 0xffff) / 65535;

if (s % 9 === 8) {
  // ── DUST LAYER — slow violet haze, far parallax ──
  var di = i * 1.6180339887;
  var d1 = Math.sin(di * 127.1) * 43758.5453; d1 = d1 - Math.floor(d1);
  var d2 = Math.sin(di * 269.5) * 43758.5453; d2 = d2 - Math.floor(d2);
  var d3 = Math.sin(di * 419.2) * 43758.5453; d3 = d3 - Math.floor(d3);
  var dx = (d1 - 0.5) * spread * 1.6;
  var dy = (d2 - 0.5) * spread * 1.6;
  var dzBase = d3 * depth;
  var dz = ((dzBase - travel * 0.35) % depth + depth) % depth - depth * 0.5;
  // gentle swirl so the haze feels alive
  dx = dx + Math.sin(time * 0.2 + d2 * 6.28) * 0.8;
  dy = dy + Math.cos(time * 0.16 + d1 * 6.28) * 0.8;
  target.set(dx, dy, dz);

  var dProx = 1 - (dz + depth * 0.5) / depth;
  var dHue = 0.74 - d1 * 0.18;
  color.setHSL(dHue, 0.55 * tint + 0.1, 0.035 + dProx * 0.05);
} else {
  // ── STAR STREAKS ──
  // Annulus placement — keeps a flight corridor clear in the middle
  var ang = hash2 * 6.28318530718;
  var rr = (0.16 + 0.84 * Math.sqrt(hash1)) * spread * 0.5;
  var x = Math.cos(ang) * rr;
  var y = Math.sin(ang) * rr;

  var zBase = hash3 * depth;
  var zHead = ((zBase - travel * 2) % depth + depth) % depth - depth * 0.5;

  // Trail length grows with instantaneous velocity and surge boost.
  // Kept short enough that the 6 points read as a streak, not dashes.
  var trailLen = (0.25 + streak * 1.0) * (0.3 + vNow * 0.35) * (1 + boost * surge * 2.0);
  if (trailLen > spread * 0.4) trailLen = spread * 0.4;

  var zk = zHead + (k / (TRAIL - 1)) * trailLen;
  zk = ((zk + depth * 0.5) % depth + depth) % depth - depth * 0.5;

  target.set(x, y, zk);

  // Proximity brightness — closer to camera (negative z) = brighter
  var prox = 1 - (zk + depth * 0.5) / depth;
  var b = Math.pow(prox, 1.6);

  // Trail decay: head bright, tail dims but never vanishes
  var fade = 1 - k / TRAIL;
  fade = 0.3 + 0.7 * fade * fade;

  // Distant stars twinkle; near streaks burn steady
  var tw = 0.82 + 0.18 * Math.sin(time * 7.0 + s * 1.7);
  var steady = tw + (1 - tw) * b;

  // Stellar classes by temperature
  var hue, sat;
  if (hash2 < 0.55)      { hue = 0.60; sat = 0.45 * tint; }        // blue-white
  else if (hash2 < 0.80) { hue = 0.13; sat = 0.50 * tint; }        // warm yellow
  else if (hash2 < 0.93) { hue = 0.07; sat = 0.75 * tint; }        // orange dwarf
  else                   { hue = 0.62; sat = 0.15; }               // brilliant rare

  var hero = hash1 > 0.965 ? 0.3 : 0;
  var lum = (0.34 + b * (0.66 + boost * surge * 0.3) + hero) * fade * steady;
  if (lum > 1) lum = 1;
  color.setHSL(hue, sat, lum);
}
`,
  disturbMode: 'scatter',
  disturbRadius: 5.0,
  disturbStrength: 1.5,
}
