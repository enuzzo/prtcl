import type { Effect } from '../../engine/types'
import { SPIRIT_CAMERA_POSITION, SPIRIT_CAMERA_TARGET } from '../../engine/spirit/config'

export const theSpirit: Effect = {
  id: 'the-spirit',
  slug: 'the-spirit',
  name: 'The Spirit',
  description: 'Edan Kwan\'s original 65k smoky apparition, MIT licensed and deliberately isolated from the rest of the engine.',
  author: 'Edan Kwan',
  category: 'abstract',
  tags: ['gpgpu', 'smoke', 'curl-noise', 'legacy-three', 'shadow', 'mit'],
  particleCount: 0,
  pointSize: 0,
  cameraDistance: 1004.171,
  cameraPosition: SPIRIT_CAMERA_POSITION,
  cameraTarget: SPIRIT_CAMERA_TARGET,
  autoRotateSpeed: 0,
  cameraZoom: 1,
  backgroundPreset: 'electric',
  createdAt: '2026-04-01',
  renderer: 'custom',
  customRenderer: 'the-spirit',
  code: `
    // The Spirit runs in its own isolated legacy Three.js renderer.
  `,
}
