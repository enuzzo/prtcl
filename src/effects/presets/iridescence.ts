import type { Effect } from '../../engine/types'

export const iridescence: Effect = {
  id: 'iridescence',
  slug: 'iridescence',
  name: 'Iridescence',
  description: 'Liquid dimensions folding into themselves. Your screen isn\'t broken. Probably.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['fluid', 'holographic', 'iridescent', 'generative', 'shader', 'abstract'],
  particleCount: 0,
  pointSize: 0,
  cameraDistance: 6,
  cameraPosition: [-3.681, 1.03, 4.732],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  backgroundPreset: 'electric',
  renderer: 'custom',
  customRenderer: 'iridescence',
  bloom: true,
  bloomStrength: 0.3,
  bloomRadius: 0.3,
  bloomThreshold: 0.6,
  controls: {
    iriPalette: 4,
    iriSpeed: 0.217,
    iriZoom: 1.0,
    iriComplexity: 3.707,
    iriMorphSpeed: 0.803,
    iriMorphIntensity: 0.259,
    iriSaturation: 1.74,
    iriShadow: 0.758,
    iriShadowAngle: 0.91,
  },
  code: `
var p = addControl('iriPalette', 'Palette', 0, 5, 4);
var sp = addControl('iriSpeed', 'Speed', 0, 3.0, 0.217);
var z = addControl('iriZoom', 'Zoom', 0.4, 1.7, 1.0);
var cx = addControl('iriComplexity', 'Complexity', 0.1, 5.0, 3.707);
var ms = addControl('iriMorphSpeed', 'Morph Speed', 0, 2.0, 0.803);
var mi = addControl('iriMorphIntensity', 'Morph Intensity', 0, 1.5, 0.259);
var sat = addControl('iriSaturation', 'Saturation', 0, 2.0, 1.74);
var sh = addControl('iriShadow', 'Shadow', 0, 2.0, 0.758);
var sa = addControl('iriShadowAngle', 'Shadow Angle', 0, 6.28, 0.91);
target.set(0, 0, 0);
color.set(1, 1, 1);
`,
  createdAt: '2026-03-31',
}
