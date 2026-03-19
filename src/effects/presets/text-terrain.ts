import type { Effect } from '../../engine/types'

export const textTerrain: Effect = {
  id: 'text-terrain',
  slug: 'text-terrain',
  name: 'Text Terrain',
  description: 'Forty thousand letters on a rolling landscape. They fall from the sky, tumbling and spinning, then settle into place like typographic snow. Try the Manifesto — it\'s unreasonably good.',
  author: 'PRTCL Team',
  category: 'text',
  tags: ['text', 'terrain', 'landscape', 'letters', 'instanced', 'rain'],
  particleCount: 20000,
  pointSize: 1.0,
  cameraDistance: 50,
  cameraPosition: [0, 15, 40],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  createdAt: '2026-03-19',
  renderer: 'custom',
  customRenderer: 'text-terrain',
  controls: { speed: 1.0, waveSpeed: 0.5, waveHeight: 1.0, skyHeight: 1.0, terrainPalette: 0 },
  code: `
addControl('speed', 'Speed', 0.1, 3, 1);
addControl('waveSpeed', 'Wave Speed', 0.0, 2.0, 0.5);
addControl('waveHeight', 'Wave Height', 0.0, 3.0, 1.0);
addControl('skyHeight', 'Sky Height', 0.2, 3.0, 1.0);
addControl('terrainPalette', 'Palette', 0, 3, 0);
target.set(0, 0, 0);
color.set(0, 0, 0);
`,
}
