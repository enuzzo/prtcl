import type { Effect } from '../../engine/types'

/**
 * Electromagnetic Field
 * Particles trace field lines of a magnetic dipole — the classic
 * bar-magnet pattern. Two poles along the x-axis, particles flow
 * along analytically computed field lines between them.
 */
export const electromagnetic: Effect = {
  id: 'electromagnetic',
  slug: 'electromagnetic',
  name: 'Electromagnetic Field',
  description: "Maxwell's equations made visible. Still more elegant than your CSS grid.",
  author: 'PRTCL Team',
  category: 'math',
  tags: ['electromagnetic', 'field', 'dipole', 'magnet', 'physics', 'field-lines'],
  particleCount: 20000,
  pointSize: 0.83,
  cameraDistance: 7,
  cameraPosition: [1.801, 0.065, 1.494],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  cameraZoom: 1,
  createdAt: '2026-03-22',
  controls: { poleDistance: 3.927, fieldStrength: 1.685, flowSpeed: 0.916, twist: 0.669 },
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
// theta maps the position along the field line (pole to pole)
var epsilon = 0.05;
var theta = epsilon + flowProgress * (PI - 2.0 * epsilon);

// Field line max radius scales with fieldStrength
var rMax = poleDist * fieldStr;
var sinTheta = Math.sin(theta);
var fieldR = rMax * sinTheta * sinTheta;

// Convert from polar (r, theta) around the dipole axis to 3D
// The dipole axis is along x. theta is the polar angle from +x.
// startAngle + twistAngle rotate around the x-axis.
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

target.set(px * S, ry * S, rz * S);

// Color: red near north pole, blue near south pole, white at equator
var tNorm = theta / PI; // 0 = north pole, 1 = south pole
var hue;
if (tNorm < 0.5) {
  // North half: red (0.0) → white-ish transition
  hue = 0.0 + tNorm * 0.12;
} else {
  // South half: white-ish transition → blue (0.6)
  hue = 0.48 + (tNorm - 0.5) * 0.24;
}
// Equator region gets desaturated (whiter)
var distFromEquator = Math.abs(tNorm - 0.5) * 2.0; // 0 at equator, 1 at poles
var sat = 0.4 + 0.5 * distFromEquator;
var light = 0.55 + 0.2 * (1.0 - distFromEquator);

// Audio color shift
hue = hue + energy * 0.1;
light = light + beat * 0.2;
sat = sat - beat * 0.1;

color.setHSL(hue, sat, light);

if (i === 0) {
  setInfo(
    "Electromagnetic Field",
    "Magnetic dipole field lines — particles trace the invisible force between two poles."
  );
}
`,
}
