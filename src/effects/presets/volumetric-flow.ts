import type { Effect } from '../../engine/types'

export const volumetricFlow: Effect = {
  id: 'volumetric-flow',
  slug: 'volumetric-flow',
  name: 'Volumetric Flow',
  description: 'David Li\'s original volumetric plume, running in its own temperamental WebGL terrarium. The polite thing here is to leave it alone and stare.',
  author: 'David Li',
  category: 'abstract',
  tags: ['flow', 'volumetric', 'curl-noise', 'original', 'webgl', 'mit'],
  particleCount: 0,
  pointSize: 0,
  cameraDistance: 2.2,
  cameraPosition: [0.056, 0.557, 1.672],
  cameraTarget: [1.2, -0.3, 0],
  autoRotateSpeed: 0,
  cameraZoom: 1,
  backgroundPreset: 'plasma',
  createdAt: '2026-04-02',
  renderer: 'custom',
  customRenderer: 'flow-master',
  code: `
    // Volumetric Flow runs in its own isolated WebGL environment.
  `,
}
