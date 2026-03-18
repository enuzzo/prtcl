import type { Effect } from '../../engine/types'

export const textScatter: Effect = {
  id: 'text-scatter',
  slug: 'text-scatter',
  name: 'Text Scatter',
  description: 'Chaos finds meaning. Particles swarm from noise into words, hold the shape, then explode again.',
  category: 'text',
  tags: ['text', 'scatter', 'converge', 'formation'],
  author: 'PRTCL Team',
  particleCount: 12000,
  pointSize: 0.8,
  autoRotateSpeed: 0,
  cameraDistance: 6,
  cameraPosition: [0, 0, 6] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var speed = addControl("speed", "Speed", 0.5, 5.0, 1.5);
var scatter = addControl("scatter", "Scatter Radius", 2.0, 20.0, 8.0);
var holdTime = addControl("holdTime", "Hold Time", 0.5, 3.0, 1.2);
var colorSpeed = addControl("colorSpeed", "Color Speed", 0.0, 3.0, 0.8);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Deterministic scatter position per particle (seeded by index)
  var seed1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  var seed2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
  var seed3 = Math.sin(i * 419.2 + 371.9) * 43758.5453;
  var sx = (seed1 - Math.floor(seed1) - 0.5) * scatter * 2;
  var sy = (seed2 - Math.floor(seed2) - 0.5) * scatter * 2;
  var sz = (seed3 - Math.floor(seed3) - 0.5) * scatter;

  // Phase cycle: converge → hold → scatter → hold-scattered
  var cycleLen = 2.0 / speed + holdTime + 2.0 / speed + 0.5;
  var phase = (time * speed) % cycleLen;
  var convergeEnd = 2.0 / speed;
  var holdEnd = convergeEnd + holdTime;
  var scatterEnd = holdEnd + 2.0 / speed;

  var t;
  if (phase < convergeEnd) {
    // Converging: scatter → text
    t = phase / convergeEnd;
    t = t * t * (3.0 - 2.0 * t); // smoothstep
  } else if (phase < holdEnd) {
    // Holding formed text
    t = 1.0;
  } else if (phase < scatterEnd) {
    // Scattering: text → scatter
    t = 1.0 - (phase - holdEnd) / (scatterEnd - holdEnd);
    t = t * t * (3.0 - 2.0 * t);
  } else {
    // Brief hold in scattered state
    t = 0.0;
  }

  target.set(
    sx + (tx - sx) * t,
    sy + (ty - sy) * t,
    sz * (1.0 - t)
  );

  // Color: shifts with time and formation state
  var hue = (i / count * 0.5 + time * colorSpeed * 0.1) % 1.0;
  var sat = 0.7 + t * 0.3;
  var lum = 0.3 + t * 0.35;
  color.setHSL(hue, sat, lum);
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
