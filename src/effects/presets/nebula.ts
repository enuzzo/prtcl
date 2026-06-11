import type { Effect } from '../../engine/types'

/**
 * Nebula Organica — filamentary rewrite.
 * Uniform ellipsoid particles are pushed through two octaves of trig domain
 * warping, which clumps them into sheets and filaments (density from
 * displacement, not randomness). Embedded star clusters twinkle inside the
 * gas, and the whole structure rotates differentially — core faster than rim.
 */
export const nebula: Effect = {
  id: 'nebula-organica',
  slug: 'nebula-organica',
  name: 'Nebula Organica',
  description: 'A slow-breathing organism made of interstellar dust, now with actual anatomy: filaments, star nurseries, the lot. Still patient. Still profoundly uninterested in your cursor.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['nebula', 'gas', 'organic', 'volumetric', 'filaments', 'clusters'],
  particleCount: 26000,
  pointSize: 1.05,
  cameraDistance: 5,
  cameraPosition: [4.698, 1.552, -0.719],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: -0.5,
  cameraZoom: 1,
  backgroundPreset: 'plasma',
  createdAt: '2026-03-01',
  controls: {
    speed: 0.9,
    scale: 2.3,
    filaments: 1.05,
    clusters: 0.55,
    gasPalette: 0,
  },
  bloom: true,
  bloomStrength: 0.45,
  bloomRadius: 0.35,
  bloomThreshold: 0.4,
  code: `
var speed     = addControl('speed', 'Speed', 0.1, 3, 0.8);
var scale     = addControl('scale', 'Scale', 0.5, 5, 2.4);
var filaments = addControl('filaments', 'Filaments', 0, 2, 1.0);
var clusters  = addControl('clusters', 'Star Clusters', 0, 1, 0.5);
// 0=Orion, 1=Carina, 2=Lagoon, 3=Ghost, 4=PRTCL
var palette   = addControl('gasPalette', 'Palette', 0, 4, 0);

setInfo('Nebula Organica', 'Filamentary gas cloud with embedded star clusters');

var t = time * speed;

// Deterministic per-particle hashes
var seed = i * 1.6180339887;
var h1 = Math.sin(seed * 127.1) * 43758.5453; h1 = h1 - Math.floor(h1);
var h2 = Math.sin(seed * 269.5) * 43758.5453; h2 = h2 - Math.floor(h2);
var h3 = Math.sin(seed * 419.2) * 43758.5453; h3 = h3 - Math.floor(h3);
var h4 = Math.sin(seed * 631.7) * 43758.5453; h4 = h4 - Math.floor(h4);

if (h4 > 0.93 && clusters > 0.02) {
  // ── STAR CLUSTERS — bright knots buried in the gas ──
  var cid = Math.floor(h1 * 12);
  var cSeed = cid * 37.719;
  var c1 = Math.sin(cSeed * 113.5) * 43758.5453; c1 = c1 - Math.floor(c1);
  var c2 = Math.sin(cSeed * 271.9) * 43758.5453; c2 = c2 - Math.floor(c2);
  var c3 = Math.sin(cSeed * 419.2) * 43758.5453; c3 = c3 - Math.floor(c3);

  // Cluster center inside the ellipsoid
  var cphi = c1 * 6.28318;
  var cct = c2 * 2 - 1;
  var cst = Math.sqrt(1 - cct * cct);
  var crad = (0.25 + 0.6 * c3) * scale;
  var ccx = crad * cst * Math.cos(cphi);
  var ccy = crad * cst * Math.sin(cphi) * 0.55;
  var ccz = crad * cct;

  // Tight gaussian-ish puff around the center
  var off = Math.pow(h2, 2.0) * scale * 0.22;
  var ophi = h3 * 6.28318;
  var oct = h1 * 2 - 1;
  var ost = Math.sqrt(1 - oct * oct);

  // Differential rotation follows the gas
  var crr = crad / scale;
  var cang = t * 0.12 * (1.35 - crr);
  var cca = Math.cos(cang), csa = Math.sin(cang);
  var rx = ccx * cca - ccz * csa;
  var rz = ccx * csa + ccz * cca;

  target.set(
    rx + off * ost * Math.cos(ophi),
    ccy + off * oct,
    rz + off * ost * Math.sin(ophi)
  );

  // Twinkling white-gold newborn stars
  var twk = Math.sin(time * (2.5 + h2 * 3.0) + h3 * 6.28) * 0.5 + 0.5;
  var cl = (0.45 + twk * 0.5) * clusters;
  color.setHSL(0.12 + h3 * 0.05, 0.35, cl > 1 ? 1 : cl);
} else {
  // ── GAS — flattened ellipsoid, domain-warped into filaments ──
  var phi = h1 * 6.28318;
  var cosTheta = h2 * 2 - 1;
  var sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
  var r = Math.pow(h3, 0.45) * scale;

  var x = r * sinTheta * Math.cos(phi);
  var y = r * sinTheta * Math.sin(phi) * 0.55;
  var z = r * cosTheta;

  // Two octaves of trig domain warp — low spatial frequency so particles
  // gather into broad coherent filaments instead of per-particle noise
  var k1 = 1.9 / scale;
  var f1 = filaments * 0.62 * scale * 0.45;
  var wx = x + f1 * Math.sin(y * k1 + t * 0.31);
  var wy = y + f1 * Math.sin(z * k1 * 0.9 - t * 0.27);
  var wz = z + f1 * Math.sin(x * k1 * 1.1 + t * 0.22);

  var k2 = 3.8 / scale;
  var f2 = f1 * 0.45;
  var vx = wx + f2 * Math.sin(wz * k2 - t * 0.41);
  var vy = wy + f2 * Math.sin(wx * k2 * 0.85 + t * 0.36);
  var vz = wz + f2 * Math.sin(wy * k2 * 1.15 + t * 0.29);

  // Warp displacement magnitude → local density proxy for shading
  var dwx = vx - x, dwy = vy - y, dwz = vz - z;
  var warpMag = Math.sqrt(dwx * dwx + dwy * dwy + dwz * dwz) / (scale * 0.8 + 0.001);

  // Differential rotation — core spins faster than rim
  var rr = r / scale;
  var angY = t * 0.12 * (1.35 - rr);
  var ca = Math.cos(angY), sa = Math.sin(angY);
  var fx = vx * ca - vz * sa;
  var fz = vx * sa + vz * ca;

  // Subtle breathing
  var breathe = 1 + 0.06 * Math.sin(t * 0.8 + r * 2);

  target.set(fx * breathe, vy * breathe, fz * breathe);

  // ── PALETTES — core hue, rim hue, accent for ionization fronts ──
  var pal = Math.round(palette);
  var coreH, rimH, accH, satBase;
  if (pal <= 0)      { coreH = 0.88; rimH = 0.55; accH = 0.48; satBase = 0.7; }  // Orion: magenta core, teal rim
  else if (pal <= 1) { coreH = 0.09; rimH = 0.58; accH = 0.13; satBase = 0.75; } // Carina: rust gold vs deep blue
  else if (pal <= 2) { coreH = 0.95; rimH = 0.62; accH = 0.78; satBase = 0.65; } // Lagoon: rose and indigo
  else if (pal <= 3) { coreH = 0.55; rimH = 0.60; accH = 0.50; satBase = 0.18; } // Ghost: spectral mono ice
  else               { coreH = 0.89; rimH = 0.24; accH = 0.32; satBase = 0.85; } // PRTCL: magenta to lime

  var mixT = rr;
  var hue = coreH + (rimH - coreH) * mixT;

  // Ionization front: a thin shell where warp magnitude crosses a band
  var front = Math.abs(warpMag - 0.55);
  var ion = front < 0.12 ? 1 - front / 0.12 : 0;
  hue = hue + (accH - hue) * ion * 0.7;

  var sat = satBase + 0.2 * warpMag;
  if (sat > 1) sat = 1;
  // Soft fog base with gentle filament glow — low variance, no speckle
  var lum = 0.13 + warpMag * 0.28 + ion * 0.16 + (1 - rr) * 0.14;
  color.setHSL(hue - Math.floor(hue), sat, lum > 1 ? 1 : lum);
}
`,
  disturbMode: 'attract',
  disturbRadius: 5.0,
  disturbStrength: 0.8,
}
