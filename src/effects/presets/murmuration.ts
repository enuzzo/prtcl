import type { Effect } from '../../engine/types'

export const murmuration: Effect = {
  id: 'murmuration',
  slug: 'murmuration',
  name: 'Murmuration',
  description: 'Ten thousand starlings with one shared braincell. Somehow, it works.',
  author: 'PRTCL Team',
  tags: ['organic', 'swarm', 'birds', 'flocking'],
  category: 'organic',
  particleCount: 18000,
  pointSize: 0.26,
  cameraDistance: 6,
  cameraPosition: [0, 1, 6],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  disturbMode: 'scatter',
  code: `
    var cohesion = addControl('cohesion', 'Cohesion', 0.5, 5, 2.5);
    var waveSpd = addControl('waveSpeed', 'Wave Speed', 0.1, 4, 1.2);
    var stretch = addControl('stretch', 'Stretch', 0.5, 4, 2);
    var chaos = addControl('chaos', 'Chaos', 0, 2, 0.4);
    var cSpd = addControl('colorSpeed', 'Color Speed', 0, 3, 0.8);

    var aCoh = cohesion + (bass || 0) * 2;
    var aWave = waveSpd + (energy || 0) * 2;
    var aChaos = chaos + (highs || 0) * 1.5 + (beat || 0) * 3;

    var fi = i / count;
    var t = time * 0.5;

    // Seed per particle — deterministic pseudo-random
    var seed = i * 1.6180339887;
    var h1 = Math.sin(seed * 127.1) * 43758.5453; h1 = h1 - Math.floor(h1);
    var h2 = Math.sin(seed * 269.5) * 43758.5453; h2 = h2 - Math.floor(h2);
    var h3 = Math.sin(seed * 419.2) * 43758.5453; h3 = h3 - Math.floor(h3);
    var h4 = Math.sin(seed * 631.7) * 43758.5453; h4 = h4 - Math.floor(h4);

    // Base position: elongated ellipsoid cloud
    var phi = Math.acos(2 * h1 - 1);
    var th = h2 * 6.28318;
    var rad = Math.pow(h3, 0.333) * aCoh;

    var bx = rad * Math.sin(phi) * Math.cos(th) * stretch;
    var by = rad * Math.sin(phi) * Math.sin(th) * 0.6;
    var bz = rad * Math.cos(phi);

    // === MURMURATION WAVES ===
    // Multiple traveling waves ripple through the flock
    // Each wave has a direction and propagates based on position dot direction

    // Wave 1: horizontal sweep
    var wave1 = Math.sin(bx * 2 + t * aWave * 3) * 0.8;
    // Wave 2: vertical ripple (delayed by x position)
    var wave2 = Math.sin(by * 3 + bx * 1.5 + t * aWave * 2.3) * 0.5;
    // Wave 3: depth pulse
    var wave3 = Math.sin(bz * 2.5 + t * aWave * 1.7 + by) * 0.4;

    // Combined wave displacement — particles ride the waves
    var wx = wave2 * 0.6 + wave3 * 0.3;
    var wy = wave1 * 0.8 + wave3 * 0.4;
    var wz = wave1 * 0.3 + wave2 * 0.5;

    // === FLOCK SHAPE MORPHING ===
    // The whole cloud rotates and stretches over time
    var morphAngle = t * 0.4;
    var cs = Math.cos(morphAngle);
    var sn = Math.sin(morphAngle);

    // Rotate the cloud around Y axis slowly
    var rx = (bx + wx) * cs - (bz + wz) * sn;
    var ry = by + wy;
    var rz = (bx + wx) * sn + (bz + wz) * cs;

    // Second rotation around X for 3D tumbling
    var morphAngle2 = t * 0.25;
    var cs2 = Math.cos(morphAngle2);
    var sn2 = Math.sin(morphAngle2);
    var fy = ry * cs2 - rz * sn2;
    var fz = ry * sn2 + rz * cs2;

    // === SPLITTING & REFORMING ===
    // Periodically the flock splits and merges
    var splitPhase = Math.sin(t * 0.3) * 0.5 + 0.5;
    var splitDir = (h4 > 0.5) ? 1 : -1;
    var splitOffset = splitDir * splitPhase * Math.sin(t * 0.7) * 1.5;

    // === INDIVIDUAL CHAOS ===
    // Each bird has slight individual jitter
    var jx = Math.sin(fi * 311.7 + t * 4 * aChaos) * aChaos * 0.3;
    var jy = Math.sin(fi * 523.1 + t * 3.7 * aChaos) * aChaos * 0.2;
    var jz = Math.sin(fi * 197.3 + t * 4.3 * aChaos) * aChaos * 0.25;

    var S = 0.35;
    target.set((rx + splitOffset + jx) * S, (fy + jy) * S, (fz + jz) * S);

    // Color: dark silhouette with subtle warm/cool shifts
    // Like starlings against sunset sky
    var waveEnergy = Math.abs(wave1) + Math.abs(wave2) * 0.5;
    var hue = 0.6 + waveEnergy * 0.15 + time * cSpd * 0.02;
    hue = hue - Math.floor(hue);
    var sat = 0.3 + waveEnergy * 0.4;
    var light = 0.15 + waveEnergy * 0.45 + (beat || 0) * 0.2;
    color.setHSL(hue, sat, light);
  `,
  controls: { cohesion: 2.5, waveSpeed: 1.2, stretch: 2, chaos: 0.4, colorSpeed: 0.8 },
  createdAt: '2026-03-22',
}
