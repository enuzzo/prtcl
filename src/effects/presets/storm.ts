import type { Effect } from '../../engine/types'

/**
 * Cumulonimbus Storm
 * Full storm system: ocean surface with waves, rain curtain,
 * lightning bolts, and volumetric cloud layer with internal flashes.
 *
 * Original concept from particles.casberry.in community.
 * Refined and extended for PRTCL by PRTCL Team.
 */
export const storm: Effect = {
  id: 'storm',
  slug: 'storm',
  name: 'Cumulonimbus Storm',
  description: 'An entire meteorological event made of dots. Ocean, lightning, the works. You\'re welcome for not making it rain inside your laptop.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['storm', 'ocean', 'lightning', 'rain', 'clouds', 'weather', 'nature'],
  particleCount: 16000,
  pointSize: 1.5,
  cameraDistance: 5,
  cameraPosition: [-3.96, 0.124, -3.05],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  createdAt: '2026-03-17',
  code: `
// Scale: original coords go up to ~144, camera at z=100
// We need ±5 range, so S ≈ 0.05
var S = 0.05;

// ── Storm Controls ────────────────────────────────────────
var speed       = addControl('speed',   'Storm Speed',          0.1,  3,    0.321);
var spread      = addControl('spread',  'Storm Width',          20,   80,   44.13);
var churn       = addControl('churn',   'Turbulence',           0,    3,    0.554);
var rainDensity = addControl('rain',    'Rain Intensity',       0,    1,    0.185);
var rainSpeed   = addControl('rainSpd', 'Rain Speed',           0.1,  3,    0.667);
var waveHeight  = addControl('waveH',   'Wave Height',          0,    5,    1.087);
var waveFreq    = addControl('waveF',   'Wave Frequency',       0.02, 0.5,  0.18);
var ceilHeight  = addControl('ceil',    'Cloud Ceiling',       -10,   20,  -0.543);
var lightFreq   = addControl('lfreq',   'Lightning Frequency',  1,    80,   6.152);
var lightBright = addControl('lbright', 'Lightning Brightness', 0.2,  1,    0.461);
var lumpScale   = addControl('lump',    'Cloud Lumpiness',      0.5,  4,    1.793);
var tearRagged  = addControl('tear',    'Edge Raggedness',      0,    1,    0.446);

if (i === 0) setInfo('Cumulonimbus Storm', 'Ocean, rain curtain, lightning bolts, and volumetric clouds');

// ── Particle group boundaries ─────────────────────────────
var oceanCount  = Math.floor(count * 0.28);
var rainCount   = Math.floor(count * 0.14);
var boltCount   = Math.floor(count * 0.05);
var stormCount  = count - oceanCount - rainCount - boltCount;
var boltParts   = Math.floor(boltCount / 4);

// ── Lightning bolt timing ─────────────────────────────────
var b0ph = (time / 1.1) % 1.0;
var b1ph = ((time + 0.6) / 1.7) % 1.0;
var b2ph = ((time + 1.3) / 2.3) % 1.0;
var b3ph = ((time + 0.9) / 1.4) % 1.0;
var ss   = 0.12;
var b0br = b0ph < ss ? (1.0 - b0ph / ss) * lightBright : 0.0;
var b1br = b1ph < ss ? (1.0 - b1ph / ss) * lightBright : 0.0;
var b2br = b2ph < ss ? (1.0 - b2ph / ss) * lightBright : 0.0;
var b3br = b3ph < ss ? (1.0 - b3ph / ss) * lightBright : 0.0;

// Bolt positions
var b0x =  spread * 0.35; var b0z =  spread * 0.20;
var b1x = -spread * 0.40; var b1z =  spread * 0.15;
var b2x =  spread * 0.10; var b2z = -spread * 0.38;
var b3x = -spread * 0.25; var b3z = -spread * 0.30;

// ── Cloud flash timing ────────────────────────────────────
var fs   = 0.08;
var c0fl = ((time + 0.2) / 0.9) % 1.0;
var c1fl = ((time + 0.7) / 1.3) % 1.0;
var c2fl = ((time + 1.1) / 1.8) % 1.0;
var c3fl = ((time + 1.6) / 0.7) % 1.0;
var c4fl = ((time + 0.4) / 2.1) % 1.0;
var c5fl = ((time + 1.9) / 1.5) % 1.0;
var cf0 = c0fl < fs ? (1.0 - c0fl / fs) : 0.0;
var cf1 = c1fl < fs ? (1.0 - c1fl / fs) : 0.0;
var cf2 = c2fl < fs ? (1.0 - c2fl / fs) : 0.0;
var cf3 = c3fl < fs ? (1.0 - c3fl / fs) : 0.0;
var cf4 = c4fl < fs ? (1.0 - c4fl / fs) : 0.0;
var cf5 = c5fl < fs ? (1.0 - c5fl / fs) : 0.0;

// Cloud flash positions
var c0x =  spread * 0.25; var c0z =  spread * 0.10;
var c1x = -spread * 0.30; var c1z = -spread * 0.20;
var c2x =  spread * 0.05; var c2z =  spread * 0.35;
var c3x = -spread * 0.15; var c3z =  spread * 0.28;
var c4x =  spread * 0.42; var c4z = -spread * 0.12;
var c5x = -spread * 0.38; var c5z = -spread * 0.35;

// ── Output vars ───────────────────────────────────────────
var px = 0, py = 0, pz = 0;
var hue = 0.6, sat = 0.5, lit = 0.1;

// ===================== OCEAN =====================
if (i < oceanCount) {
  var gs    = Math.ceil(Math.sqrt(oceanCount));
  var ox    = (i % gs / gs - 0.5) * spread * 3.2;
  var oz    = (Math.floor(i / gs) / gs - 0.5) * spread * 3.2;
  var oDist = Math.sqrt(ox*ox + oz*oz);
  var oMask = oDist < spread * 1.6 ? 1.0 : 0.0;
  var wh    = waveHeight;
  var w1    = Math.sin(ox * waveFreq            + time * speed * 0.7) * wh * 1.1;
  var w2    = Math.cos(oz * waveFreq * 1.2      + time * speed * 0.5) * wh * 0.8;
  var w3    = Math.sin((ox+oz) * waveFreq * 0.7 + time * speed * 0.9) * wh * 0.6;
  var peak  = (w1+w2+w3 + wh*2.5) / (wh*5.0 + 0.001);
  var foam  = Math.pow(Math.max(0.0, Math.sin(ox*0.4 + oz*0.3 + time*2.0)), 8.0);
  var sg    = Math.min(1.0,
    Math.max(0.0, 1.0 - Math.sqrt((ox-b0x)*(ox-b0x)+(oz-b0z)*(oz-b0z)) / 18.0) * b0br +
    Math.max(0.0, 1.0 - Math.sqrt((ox-b1x)*(ox-b1x)+(oz-b1z)*(oz-b1z)) / 18.0) * b1br +
    Math.max(0.0, 1.0 - Math.sqrt((ox-b2x)*(ox-b2x)+(oz-b2z)*(oz-b2z)) / 18.0) * b2br +
    Math.max(0.0, 1.0 - Math.sqrt((ox-b3x)*(ox-b3x)+(oz-b3z)*(oz-b3z)) / 18.0) * b3br
  );
  px = ox * S; py = (-18.0 + w1+w2+w3) * oMask * S + (1.0 - oMask) * 999.0; pz = oz * S;
  hue = 0.58 + peak*0.04; sat = 0.85; lit = (0.06 + peak*0.12 + foam*0.3 + sg*0.5) * oMask;

// ===================== RAIN =====================
} else if (i < oceanCount + rainCount) {
  var ri      = i - oceanCount;
  var rt      = ri / rainCount;
  var rphi    = rt * 2.399963;
  var rSheetR = Math.sqrt(rt) * spread * 1.8;
  var rx      = Math.cos(rphi * 37.0) * rSheetR;
  var rz      = Math.sin(rphi * 37.0) * rSheetR;
  var rainBt  = -17.0;
  var rainTp  = -3.0;
  var rainSpan = rainTp - rainBt;
  var rate     = rainSpeed * (0.8 + Math.sin(ri * 7.3) * 0.2);
  var descent  = (rt + time * rate * (0.5 + rainDensity * 0.5)) % 1.0;
  var ry       = rainTp - descent * rainSpan;
  var alpha    = Math.min((rainTp - ry) / (rainSpan * 0.06), 1.0) *
                 Math.min((ry - rainBt) / (rainSpan * 0.06), 1.0);
  px = rx * S; py = ry * S; pz = rz * S;
  hue = 0.60; sat = 0.55; lit = 0.10 + Math.max(0.0, alpha) * 0.25;

// ===================== BOLTS =====================
} else if (i < oceanCount + rainCount + boltCount) {
  var bi  = i - oceanCount - rainCount;
  var idx = Math.floor(bi / boltParts);
  var bt  = (bi % boltParts) / boltParts;
  var bx  = idx === 0 ? b0x : idx === 1 ? b1x : idx === 2 ? b2x : b3x;
  var bz  = idx === 0 ? b0z : idx === 1 ? b1z : idx === 2 ? b2z : b3z;
  var bbr = idx === 0 ? b0br : idx === 1 ? b1br : idx === 2 ? b2br : b3br;
  var by  = (ceilHeight - 2.0) + (-17.5 - (ceilHeight - 2.0)) * bt;
  var env = Math.sin(bt * Math.PI) * 0.3;
  var tx  = Math.sin(bt*22.0 + time*18.0 + idx*5.3) * env;
  var tz  = Math.cos(bt*31.0 + time*14.0 + idx*3.7) * env;
  var brT = Math.max(0.0, bt - 0.70) / 0.30;
  var bx2 = Math.sin(bt*71.0 + time*9.0  + idx*7.1) * brT * 0.9;
  var bz2 = Math.cos(bt*53.0 + time*11.0 + idx*4.9) * brT * 0.6;
  px = (bx+tx+bx2) * S; py = by * S; pz = (bz+tz+bz2) * S;
  hue = 0.62 - bt*0.08; sat = bbr > 0.0 ? 0.15 + bt*0.15 : 0.0; lit = bbr * 0.95;

// ===================== CLOUD =====================
} else {
  var si    = i - oceanCount - rainCount - boltCount;
  var st    = si / stormCount;
  var phi   = st * 2.399963;
  var sR    = Math.sqrt(st) * spread * 1.8;
  var sx    = Math.cos(phi * 37.0) * sR;
  var sz    = Math.sin(phi * 37.0) * sR;
  var ls    = lumpScale;
  var sr1   = Math.sin(sx*0.07 + time*speed*0.30)     * Math.cos(sz*0.06 + time*speed*0.20) * 4.5*ls;
  var sr2   = Math.cos(sx*0.05 - time*speed*0.25+1.3) * Math.sin(sz*0.08 + time*speed*0.35) * 3.5*ls;
  var ml1   = Math.sin(sx*0.18 + sz*0.14 + time*churn*0.70) * 2.2*ls;
  var ml2   = Math.cos(sx*0.22 - sz*0.16 + time*churn*0.55+2.1) * 1.8*ls;
  var sd1   = Math.sin(sx*0.41 + sz*0.37 + time*churn*1.10) * 0.9*ls;
  var sd2   = Math.cos(sx*0.53 - sz*0.44 + time*churn*0.90+1.7) * 0.7*ls;
  var md1   = Math.sin(sx*0.89 + sz*0.71 + time*churn*1.60) * 0.4*ls;
  var md2   = Math.cos(sx*1.13 - sz*0.97 + time*churn*1.30+0.9) * 0.3*ls;
  var md3   = Math.sin(sx*1.47 + sz*1.21 + time*churn*1.80+2.4) * 0.2*ls;
  var belly = sr1+sr2+ml1+ml2+sd1+sd2+md1+md2+md3;
  var thick = Math.sin(st*127.3 + sx*0.3) * 0.5 + 0.5;
  var cpy   = ceilHeight + thick * 3.0;
  var eFade = Math.max(0.0, 1.0 - sR / (spread * 1.8));
  var eMask = Math.min(1.0, eFade*(3.0 - tearRagged*2.5) + (Math.sin(st*311.7+phi*53.0)*0.5+0.5)*tearRagged);

  // Lightning glow on clouds
  var lp    = Math.pow(Math.max(0.0, Math.sin(st*lightFreq + time*7.0 + sx*0.1)), 14.0) * lightBright;
  var shim  = Math.pow(Math.max(0.0, Math.sin(st*lightFreq*0.3 + time*3.0 + sz*0.08)), 6.0) * lightBright*0.25;

  // Ground strike glow on cloud base
  var gsHit = Math.min(1.0,
    Math.max(0.0, 1.0 - Math.sqrt((sx-b0x)*(sx-b0x)+(sz-b0z)*(sz-b0z)) / 12.0) * b0br +
    Math.max(0.0, 1.0 - Math.sqrt((sx-b1x)*(sx-b1x)+(sz-b1z)*(sz-b1z)) / 12.0) * b1br +
    Math.max(0.0, 1.0 - Math.sqrt((sx-b2x)*(sx-b2x)+(sz-b2z)*(sz-b2z)) / 12.0) * b2br +
    Math.max(0.0, 1.0 - Math.sqrt((sx-b3x)*(sx-b3x)+(sz-b3z)*(sz-b3z)) / 12.0) * b3br
  );

  // Cloud-to-cloud flash glow (inlined cloudGlow)
  var cgR = 30.0;
  var cg0 = Math.max(0.0, 1.0 - Math.sqrt((sx-c0x)*(sx-c0x)+(sz-c0z)*(sz-c0z)) / cgR) * cf0;
  var cg1 = Math.max(0.0, 1.0 - Math.sqrt((sx-c1x)*(sx-c1x)+(sz-c1z)*(sz-c1z)) / cgR) * cf1;
  var cg2 = Math.max(0.0, 1.0 - Math.sqrt((sx-c2x)*(sx-c2x)+(sz-c2z)*(sz-c2z)) / cgR) * cf2;
  var cg3 = Math.max(0.0, 1.0 - Math.sqrt((sx-c3x)*(sx-c3x)+(sz-c3z)*(sz-c3z)) / cgR) * cf3;
  var cg4 = Math.max(0.0, 1.0 - Math.sqrt((sx-c4x)*(sx-c4x)+(sz-c4z)*(sz-c4z)) / cgR) * cf4;
  var cg5 = Math.max(0.0, 1.0 - Math.sqrt((sx-c5x)*(sx-c5x)+(sz-c5z)*(sz-c5z)) / cgR) * cf5;
  var cglow = Math.min(1.0, cg0+cg1+cg2+cg3+cg4+cg5);

  lit = Math.min(1.0, 0.05 + thick*0.14 + eFade*0.10 + lp + shim + gsHit*0.6 + cglow*lightBright*1.8) * eMask;
  px = sx * S; py = (cpy*eMask + (1.0-eMask)*(cpy+8.0)) * S; pz = sz * S;
  hue = 0.60 - cglow*0.10 + belly*0.003 + lp*0.05;
  sat = Math.max(0.0, 0.50 - cglow*0.45) + lp*0.4 + shim*0.2;
}

target.set(px, py, pz);
color.setHSL(hue, sat, Math.min(1.0, Math.max(0.0, lit)));
`,
  disturbMode: 'scatter',
  disturbStrength: 1.8,
}
