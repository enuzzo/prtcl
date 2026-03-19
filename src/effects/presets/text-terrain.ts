import type { Effect } from '../../engine/types'

export const textTerrain: Effect = {
  id: 'text-terrain',
  slug: 'text-terrain',
  name: 'Text Terrain',
  description: 'Forty thousand letters on a rolling landscape. They fall from the sky, tumbling and spinning, then settle into place like typographic snow. Try the Manifesto — it\'s unreasonably good.',
  author: 'PRTCL Team',
  category: 'text',
  tags: ['text', 'terrain', 'landscape', 'letters', 'instanced', 'rain'],
  particleCount: 27000,
  pointSize: 2.3,
  cameraDistance: 50,
  cameraPosition: [-35.079, 13.778, 32.593],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  createdAt: '2026-03-19',
  renderer: 'custom',
  customRenderer: 'text-terrain',
  controls: { speed: 0.666, waveSpeed: 0.468, waveHeight: 0.803, skyHeight: 1.543, terrainPalette: 0 },
  code: `
addControl('speed', 'Speed', 0.1, 3, 0.666);
addControl('waveSpeed', 'Wave Speed', 0.0, 2.0, 0.468);
addControl('waveHeight', 'Wave Height', 0.0, 3.0, 0.803);
addControl('skyHeight', 'Sky Height', 0.2, 3.0, 1.543);
addControl('terrainPalette', 'Palette', 0, 3, 0);
target.set(0, 0, 0);
color.set(0, 0, 0);
`,
}
