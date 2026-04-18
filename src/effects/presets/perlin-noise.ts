import type { Effect } from '../../engine/types'

/**
 * Perlin Noise
 * Icosahedron point cloud with GLSL Perlin noise vertex displacement.
 * Original by Victor Vergara (https://codepen.io/vcomics/pen/djqNrm), MIT License.
 * Perlin noise GLSL by Stefan Gustavson, turbulence by Jaume Sanchez (spite).
 */
export const perlinNoise: Effect = {
  id: 'perlin-noise',
  slug: 'perlin-noise',
  name: 'Perlin Noise',
  description: 'A sphere possessed by Perlin turbulence. Ken Perlin won an Academy Award for this noise function in 1997. You can ruin it in about eight seconds.',
  author: 'Victor Vergara',
  category: 'math',
  tags: ['perlin', 'noise', 'shader', 'icosahedron', 'displacement', 'turbulence'],
  particleCount: 12000,
  pointSize: 0.15,
  cameraDistance: 8,
  cameraPosition: [-5.501, 6.601, -2.277],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 0.9,
  createdAt: '2026-03-19',
  renderer: 'custom',
  customRenderer: 'perlin-noise',
  // Code is a no-op — the PerlinNoise component handles everything via custom shaders.
  code: `
    // Perlin Noise — custom renderer (shader-based displacement on IcosahedronGeometry)
    const vel = addControl('velocity', 'Velocity', 0.0, 0.02, 0.001);
    const speed = addControl('speed', 'Speed', 0.0, 0.0005, 0.0);
    const sine = addControl('sine', 'Sine', 0.0, 0.50, 0.195);
    const amplitude = addControl('amplitude', 'Amplitude', 0.0, 90.0, 45.167);
    const size = addControl('size', 'Point Scale', 0.5, 6.0, 3.138);
    const decay = addControl('decay', 'Decay', 0.0, 1.0, 0.151);
    const waves = addControl('waves', 'Waves', 0.0, 20.0, 7.249);
    const complex = addControl('complex', 'Complex', 0.1, 1.0, 0.21);
    const hue = addControl('hue', 'Hue', 0.0, 15.0, 9.201);
    const fragment = addControl('fragment', 'Fragment', 0, 1, 0.664);
    const electroflow = addControl('electroflow', 'Electroflow', 0, 1, 0.73);
    target.set(0, 0, 0);
    color.set(1, 1, 1);
  `,
}
