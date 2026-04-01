import type { Effect } from '../../engine/types'

/**
 * The Spirit — GPGPU curl noise particle simulation
 * Original by Edan Kwan — MIT License
 * https://github.com/edankwan/The-Spirit
 *
 * Camera: original starts at (300, 60, 300).normalize() * 1000, then lerps
 * maxDistance to 450. We set cameraPosition to the ~450-distance orbit.
 */
export const spirit: Effect = {
  id: 'spirit',
  slug: 'spirit',
  name: 'The Spirit',
  description: 'Sixty-five thousand particles chasing a point they can never reach. Edan Kwan\'s GPU curl noise masterpiece — ported without changing a comma.',
  author: 'Edan Kwan',
  category: 'abstract',
  tags: ['curl', 'noise', 'smoke', 'ghost', 'spirit', 'flow', 'gpgpu'],
  particleCount: 0, // GPGPU handles count internally (65k = 256x256)
  pointSize: 0,
  cameraDistance: 8,
  cameraPosition: [315, 63, 315],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  cameraZoom: 1,
  bloom: false,
  createdAt: '2026-03-31',
  renderer: 'custom',
  customRenderer: 'spirit',
  controls: {
    speed: 1,
    dieSpeed: 0.015,
    radius: 0.6,
    attraction: 1,
    useTriangles: 1,
    followMouse: 1,
    shadowDarkness: 0.45,
  },
  code: `
var sp = addControl('speed', 'Speed', 0, 3, 1);
var ds = addControl('dieSpeed', 'Die Speed', 0.0005, 0.05, 0.015);
var rd = addControl('radius', 'Radius', 0.2, 3, 0.6);
var at = addControl('attraction', 'Attraction', -2, 2, 1);
var ut = addControl('useTriangles', 'Triangles', 0, 1, 1);
var fm = addControl('followMouse', 'Follow Mouse', 0, 1, 1);
var sd = addControl('shadowDarkness', 'Shadow', 0, 1, 0.45);
target.set(0, 0, 0);
color.set(1, 1, 1);
`,
}
