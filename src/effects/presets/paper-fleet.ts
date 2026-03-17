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
  description: '10,000 paper planes orbiting gravity. Instanced mesh, not particles. A different kind of beautiful.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['instanced', 'mesh', 'gravity', 'orbit', 'arrows', 'fleet', '3d'],
  particleCount: 10000,
  pointSize: 1,
  cameraDistance: 200,
  cameraPosition: [-80, 50, 20],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  createdAt: '2026-03-18',
  // Custom renderer — bypasses ParticleSystem entirely
  renderer: 'custom',
  customRenderer: 'paper-fleet',
  // Empty code — the PaperFleet component handles everything
  code: `
target.set(0, 0, 0);
color.set(0, 0, 0);
`,
}
