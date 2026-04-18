import type { Effect } from '../../engine/types'

export const murmuration: Effect = {
  id: 'murmuration',
  slug: 'murmuration',
  name: 'Murmuration',
  description: 'Ten thousand starlings obeying three simple rules, producing waves no single bird agreed to. Reynolds wrote this algorithm in 1986. The birds never signed off.',
  author: 'PRTCL Team',
  tags: ['organic', 'swarm', 'birds', 'flocking'],
  category: 'organic',
  particleCount: 16000,
  pointSize: 0.57,
  cameraDistance: 6,
  cameraPosition: [0, -3.38, 0],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  cameraZoom: 1.8,
  backgroundPreset: 'crimson',
  bloom: true,
  bloomStrength: 0.35,
  bloomRadius: 0.6,
  bloomThreshold: 0.5,
  disturbMode: 'scatter',
  code: `
    var cohesion = addControl('cohesion', 'Cohesion', 0.5, 5, 2.5);
    var waveSpd = addControl('waveSpeed', 'Wave Speed', 0.1, 4, 1.2);
    var stretch = addControl('stretch', 'Stretch', 0.5, 4, 2);
    var chaos = addControl('chaos', 'Chaos', 0, 2, 0.4);
    var cHue = addControl('colorHue', 'Color Hue', 0, 1, 0.58);

    var fi = i / count;
    var t = time * 0.5;

    // Seed per particle — deterministic pseudo-random
    var seed = i * 1.6180339887;
    var h1 = Math.sin(seed * 127.1) * 43758.5453; h1 = h1 - Math.floor(h1);
    var h2 = Math.sin(seed * 269.5) * 43758.5453; h2 = h2 - Math.floor(h2);
    var h3 = Math.sin(seed * 419.2) * 43758.5453; h3 = h3 - Math.floor(h3);
    var h4 = Math.sin(seed * 631.7) * 43758.5453; h4 = h4 - Math.floor(h4);

    // === CIGAR-SHAPED FLOCK ===
    // Elongated along X (the spit axis), compressed on Y/Z. pow(h3, 0.4)
    // concentrates birds near the core with feathered edges — softer than
    // a hard ellipsoid boundary.
    var phi = Math.acos(2 * h1 - 1);
    var th = h2 * 6.28318;
    var rad = Math.pow(h3, 0.4) * cohesion;

    var bx = rad * Math.sin(phi) * Math.cos(th) * stretch;
    var by = rad * Math.sin(phi) * Math.sin(th) * 0.55;
    var bz = rad * Math.cos(phi) * 0.65;

    // === MURMURATION WAVES ===
    // Traveling sinusoids give the flock its signature undulation
    var wave1 = Math.sin(bx * 2 + t * waveSpd * 3) * 0.8;
    var wave2 = Math.sin(by * 3 + bx * 1.5 + t * waveSpd * 2.3) * 0.5;
    var wave3 = Math.sin(bz * 2.5 + t * waveSpd * 1.7 + by) * 0.4;

    var wx = wave2 * 0.6 + wave3 * 0.3;
    var wy = wave1 * 0.8 + wave3 * 0.4;
    var wz = wave1 * 0.3 + wave2 * 0.5;

    // === KEBAB ROTATION ===
    // One rotation axis only: horizontal X (the spit). The flock turns on
    // its own length — no yaw drift, no tumbling. Like meat on a rotisserie.
    var spin = t * 0.4;
    var cs = Math.cos(spin);
    var sn = Math.sin(spin);
    var fx = bx + wx;
    var fy = (by + wy) * cs - (bz + wz) * sn;
    var fz = (by + wy) * sn + (bz + wz) * cs;

    // === BREATHING ===
    // Slow global pulse — whole flock inhales and exhales subtly
    var breath = 1 + Math.sin(t * 0.6) * 0.06;
    fx *= breath;
    fy *= breath;
    fz *= breath;

    // === SPLIT & REFORM ===
    // The flock occasionally tears along its length and zips back
    var splitPhase = Math.sin(t * 0.3) * 0.5 + 0.5;
    var splitDir = (h4 > 0.5) ? 1 : -1;
    var splitOffset = splitDir * splitPhase * Math.sin(t * 0.7) * 0.9;

    // === INDIVIDUAL CHAOS ===
    var jx = Math.sin(fi * 311.7 + t * 4 * chaos) * chaos * 0.3;
    var jy = Math.sin(fi * 523.1 + t * 3.7 * chaos) * chaos * 0.2;
    var jz = Math.sin(fi * 197.3 + t * 4.3 * chaos) * chaos * 0.25;

    var S = 0.35;
    target.set((fx + splitOffset + jx) * S, (fy + jy) * S, (fz + jz) * S);

    // === COLOR ===
    // User picks a static hue; the waves carve highlights into it.
    // Dark silhouettes dominate, crests catch the light like wings
    // turned into the sun.
    var waveEnergy = Math.abs(wave1) + Math.abs(wave2) * 0.5;
    var hue = cHue + waveEnergy * 0.04;
    hue = hue - Math.floor(hue);
    var sat = 0.6 + waveEnergy * 0.3;
    var light = 0.1 + Math.pow(waveEnergy, 1.4) * 0.55;
    color.setHSL(hue, sat, light);
  `,
  controls: {
    cohesion: 2.065,
    waveSpeed: 0.575,
    stretch: 4,
    chaos: 0.035,
    colorHue: 0,
  },
  createdAt: '2026-03-22',
}
