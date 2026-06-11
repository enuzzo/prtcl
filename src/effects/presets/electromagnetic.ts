import type { Effect } from '../../engine/types'

/**
 * Electromagnetic Field
 * Particles trace field lines of a magnetic dipole — the classic
 * bar-magnet pattern. Two poles along the x-axis, particles flow
 * along analytically computed field lines between them.
 * Revamp: charge packets sprint along the lines, poles glow with
 * aurora shimmer, and the whole dipole breathes on a slow tilt.
 */
export const electromagnetic: Effect = {
  id: 'electromagnetic',
  slug: 'electromagnetic',
  name: 'Electromagnetic Field',
  description: "Dipole field lines traced at 60fps, now with charge packets sprinting pole to pole and auroras where they land. Maxwell did all this in 1865 with a quill. Nothing you accomplish today will feel as productive.",
  author: 'PRTCL Team',
  category: 'math',
  tags: ['electromagnetic', 'field', 'dipole', 'magnet', 'physics', 'field-lines', 'aurora'],
  particleCount: 20000,
  pointSize: 0.83,
  cameraDistance: 7,
  cameraPosition: [1.801, 0.065, 1.494],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  createdAt: '2026-03-22',
  bloom: true,
  bloomStrength: 0.45,
  bloomRadius: 0.4,
  bloomThreshold: 0.5,
  controls: { poleDistance: 3.927, fieldStrength: 1.685, flowSpeed: 0.916, twist: 0.669, pulse: 0.65 },
  disturbMode: 'attract',
  disturbRadius: 4,
  disturbStrength: 1.0,
  code: `
// Scale factor
var S = 0.4;
var PI = Math.PI;
var TWO_PI = PI * 2.0;

var poleDist = addControl("poleDistance", "Pole Distance", 1.0, 6.0, 3.0);
var fieldStr = addControl("fieldStrength", "Field Strength", 0.5, 3.0, 1.5);
var flowSpd = addControl("flowSpeed", "Flow Speed", 0.1, 2.0, 0.5);
var twistAmt = addControl("twist", "Twist", 0.0, 3.0, 0.3);
var pulse = addControl("pulse", "Charge Packets", 0.0, 1.0, 0.6);

// Audio modulation
poleDist = poleDist * (1.0 + bass * 0.6);
flowSpd = flowSpd * (1.0 + energy * 0.8);
fieldStr = fieldStr * (1.0 + beat * 0.4);

var fi = i / count;

var numLines = 48;
var numRings = 8;

// Which field line and position along it
var lineIdx = Math.floor(fi * numLines);
var lineProgress = fi * numLines - lineIdx;

// Flow animation — particles slide along the field line
var flowProgress = (lineProgress + time * flowSpd) % 1.0;

// Start angle around the dipole axis (azimuthal)
var ringIdx = Math.floor(lineIdx / (numLines / numRings));
var withinRing = lineIdx % (numLines / numRings);
var startAngle = withinRing / (numLines / numRings) * TWO_PI;
var twistAngle = ringIdx / numRings * TWO_PI;

// Dipole field line in polar coordinates:
// r = R_max * sin^2(theta), theta from epsilon to PI-epsilon
var epsilon = 0.05;
var theta = epsilon + flowProgress * (PI - 2.0 * epsilon);

// Field line max radius scales with fieldStrength
var rMax = poleDist * fieldStr;
var sinTheta = Math.sin(theta);
var fieldR = rMax * sinTheta * sinTheta;

// Azimuth around the dipole axis
var azimuth = startAngle + twistAngle + twistAmt * Math.sin(time * 0.3 + lineIdx * 0.1);

// Polar to cartesian with x as the dipole axis
var px = fieldR * Math.cos(theta);
var py = fieldR * sinTheta * Math.cos(azimuth);
var pz = fieldR * sinTheta * Math.sin(azimuth);

// Slight time-based global twist
var twistRot = time * twistAmt * 0.1;
var ct = Math.cos(twistRot);
var st = Math.sin(twistRot);
var ry = py * ct - pz * st;
var rz = py * st + pz * ct;

// Slow breathing tilt — the dipole leans into its own field
var tilt = 0.3 * Math.sin(time * 0.13);
var ctt = Math.cos(tilt);
var stt = Math.sin(tilt);
var fx = px * ctt - ry * stt;
var fy = px * stt + ry * ctt;

target.set(fx * S, fy * S, rz * S);

// ── CHARGE PACKETS — bright pulses sprinting along each line ──
// Packets travel faster than the ambient flow, so they overtake particles
var packetPos = (time * flowSpd * 2.3 + lineIdx * 0.3719) % 1.0;
var pd = Math.abs(flowProgress - packetPos);
if (pd > 0.5) pd = 1.0 - pd;
var packet = pulse * Math.exp(-pd * pd * 700.0);

// ── POLE AURORAS — shimmer where the lines converge ──
var aur = 1.0 - sinTheta;
aur = aur * aur * aur;
var shimmer = 0.5 + 0.5 * Math.sin(time * 3.0 + azimuth * 4.0 + theta * 6.0);
var auroraGlow = aur * shimmer * 0.8;

// ── COLOR — crimson-gold north, azure-violet south, pearl equator ──
var tNorm = theta / PI; // 0 = north pole, 1 = south pole
var hue;
if (tNorm < 0.5) {
  hue = 0.0 + tNorm * 0.12;
} else {
  hue = 0.48 + (tNorm - 0.5) * 0.24;
}
// Aurora hue pull: green near the north pole, violet near the south
if (tNorm < 0.5) hue = hue + (0.36 - hue) * aur * 0.7;
else hue = hue + (0.78 - hue) * aur * 0.7;

var distFromEquator = Math.abs(tNorm - 0.5) * 2.0;
var sat = 0.4 + 0.5 * distFromEquator;
var light = 0.5 + 0.18 * (1.0 - distFromEquator) + auroraGlow * 0.25 + packet * 0.5;

// Packets burn white-hot
sat = sat * (1.0 - packet * 0.85);

// Audio color shift
hue = hue + energy * 0.1;
light = light + beat * 0.2;

color.setHSL(hue - Math.floor(hue), sat, light > 1 ? 1 : light);

if (i === 0) {
  setInfo(
    "Electromagnetic Field",
    "Magnetic dipole field lines — charge packets and pole auroras trace the invisible force."
  );
}
`,
}
