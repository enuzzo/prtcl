import type { Effect } from '../../engine/types'

/**
 * Paper Fleet
 * Thousands of paper-plane arrows orbiting a gravitational center.
 * Uses instanced 3D mesh geometry instead of point particles —
 * each arrow has its own velocity, orientation, and color.
 *
 * Original concept by Martin Schuhfuss (usefulthink.com).
 * Reimplemented as a custom R3F renderer for the PRTCL system.
 */
export const paperFleet: Effect = {
  id: 'paper-fleet',
  slug: 'paper-fleet',
  name: 'Paper Fleet',
  description: 'Newton\'s laws, 10k paper planes, zero air traffic control. They orbit because math said so.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['instanced', 'mesh', 'gravity', 'orbit', 'arrows', 'fleet', '3d'],
  particleCount: 10000,
  pointSize: 0.5,
  cameraDistance: 200,
  cameraPosition: [-80, 50, 20],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  createdAt: '2026-03-18',
  renderer: 'custom',
  customRenderer: 'paper-fleet',
  // The code runs but PaperFleet component handles rendering.
  // addControl declares the color scheme slider for Tweakpane.
  code: `
// Color scheme: 0=PRTCL, 1=Classic, 2=Ocean, 3=Ember, 4=Ghost
addControl('colorScheme', 'Color Scheme', 0, 4, 0);
// Speed: time scale multiplier for the simulation
addControl('speed', 'Speed', 0.1, 3, 1);
target.set(0, 0, 0);
color.set(0, 0, 0);
`,
}
