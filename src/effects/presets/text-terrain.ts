import type { Effect } from '../../engine/types'

export const textTerrain: Effect = {
  id: 'text-terrain',
  slug: 'text-terrain',
  name: 'Text Terrain',
  description: 'Your words become a landscape. Letters rise and fall on simplex hills while particles rain from the sky. Try the Manifesto preset — it\'s unreasonably good.',
  author: 'PRTCL Team',
  category: 'text',
  tags: ['text', 'terrain', 'landscape', 'rain', 'noise', 'grid'],
  particleCount: 20000,
  pointSize: 0.8,
  cameraDistance: 12,
  cameraPosition: [6, 8, 10],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  controls: { terrainText: 2, height: 1.0, waveSpeed: 0.5, fall: 0.5, terrainPalette: 0 },
  createdAt: '2026-03-19',
  code: `
var preset   = addControl('terrainText',    'Content',       0, 3, 2);
var height   = addControl('height',         'Terrain Height', 0.0, 3.0, 1.0);
var wSpeed   = addControl('waveSpeed',      'Wave Speed',     0.0, 2.0, 0.5);
var fall     = addControl('fall',           'Rain',           0.0, 2.0, 0.5);
var tPal     = addControl('terrainPalette', 'Palette',        0, 3, 0);

setInfo('Text Terrain', 'Text particles on a living landscape');

// Audio
height = height * (1.0 + bass * 0.8);
wSpeed = wSpeed * (1.0 + mids * 0.6);
fall = fall * (1.0 + highs * 0.5);

var t = time;
var u = i / count;

// Deterministic hash for per-particle variation
var h1 = Math.sin(i * 127.1 + 311.7) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(i * 269.5 + 183.3) * 43758.5453; h2 = h2 - Math.floor(h2);

var px, py, pz;

if (textPoints && i * 3 + 2 < textPoints.length) {
  // Use text points — spread on terrain
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Map text X/Y to terrain XZ plane
  px = tx;
  pz = ty * -0.6;

  // Simplex-like noise terrain height using layered sine
  var nx = px * 0.8;
  var nz = pz * 0.8;
  var noise1 = Math.sin(nx * 1.0 + t * wSpeed * 0.3) * Math.cos(nz * 0.8 + t * wSpeed * 0.2);
  var noise2 = Math.sin(nx * 2.3 + nz * 1.7 + t * wSpeed * 0.5) * 0.5;
  var noise3 = Math.sin(nx * 4.1 - nz * 3.2 + t * wSpeed * 0.7) * 0.25;
  var terrainY = (noise1 + noise2 + noise3) * height;

  // Rain effect — particles fall from above periodically
  var fallCycle = (t * fall * 0.3 + h1 * 10.0) % (4.0 + h2 * 6.0);
  var fallPhase = fallCycle < 1.0 ? fallCycle : 1.0;
  var fallHeight = (1.0 - fallPhase) * 8.0 * fall;

  py = terrainY + fallHeight;

  // Slight XZ drift during fall
  if (fallPhase < 1.0) {
    px += Math.sin(t * 2.0 + h1 * 6.28) * (1.0 - fallPhase) * 0.3;
    pz += Math.cos(t * 1.7 + h2 * 6.28) * (1.0 - fallPhase) * 0.3;
  }
} else {
  // Overflow particles — scatter as ambient rain
  var gridX = (h1 - 0.5) * 12.0;
  var gridZ = (h2 - 0.5) * 8.0;
  var rainY = ((t * fall * 0.5 + h1 * 20.0) % 10.0) - 2.0;
  px = gridX + Math.sin(t * 0.3 + h1 * 6.28) * 0.5;
  py = 8.0 - rainY;
  pz = gridZ + Math.cos(t * 0.25 + h2 * 6.28) * 0.5;
}

target.set(px, py, pz);

// Color palettes
var paletteIdx = Math.round(tPal);
var hue, sat, lit;
var depthFade = 1.0 - Math.max(0, Math.min(1, (py + 2.0) / 10.0)) * 0.3;

if (paletteIdx === 1) {
  // Typewriter: warm white on black, like printed paper
  hue = 0.1;
  sat = 0.05;
  lit = 0.5 + 0.4 * depthFade;
} else if (paletteIdx === 2) {
  // Vintage: sepia/amber, old manuscript feel
  hue = 0.08 + 0.03 * u;
  sat = 0.5 + 0.2 * depthFade;
  lit = 0.15 + 0.4 * depthFade;
} else if (paletteIdx === 3) {
  // Matrix: phosphor green monochrome
  hue = 0.33;
  sat = 0.8;
  lit = 0.1 + 0.5 * depthFade;
} else {
  // PRTCL: magenta + lime acid-pop (brand colors)
  var blend = Math.sin(u * 6.28 + t * 0.2 + px * 0.5) * 0.5 + 0.5;
  hue = blend < 0.5 ? 0.89 : 0.25;
  sat = 0.85 + 0.15 * depthFade;
  lit = 0.15 + 0.5 * depthFade;
}

// Beat flash
lit = lit + beat * 0.2;
// Falling particles glow brighter
if (textPoints && i * 3 + 2 < textPoints.length) {
  var fallCycle2 = (t * fall * 0.3 + h1 * 10.0) % (4.0 + h2 * 6.0);
  if (fallCycle2 < 1.0) lit = lit + (1.0 - fallCycle2) * 0.3;
}
color.setHSL(hue, sat, Math.min(lit, 1.0));
`,
}
