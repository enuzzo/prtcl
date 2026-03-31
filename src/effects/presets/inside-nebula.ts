import type { Effect } from '../../engine/types'

export const insideNebula: Effect = {
  id: 'inside-nebula',
  slug: 'inside-nebula',
  name: 'Inside Nebula',
  description: 'You are inside a sentient gas cloud. It knows you are watching.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['nebula', 'volumetric', 'raymarching', 'glow', 'space', 'gas'],
  particleCount: 2600,
  pointSize: 0.5,
  cameraDistance: 3.6,
  cameraPosition: [2.836, 1.247, -2.416],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  backgroundPreset: 'ultraviolet',
  renderer: 'custom',
  customRenderer: 'inside-nebula',
  bloom: true,
  bloomStrength: 0.48,
  bloomRadius: 0.4,
  bloomThreshold: 0.4,
  controls: {
    nebPalette: 0,
    hueShift: 0.035,
    saturation: 1.071,
    brightness: 0.968,
    density: 0.367,
    structure: 0.27,
    gasSpeed: 0.468,
    plasmaSpeed: 1.16,
  },
  disturbMode: 'scatter',
  disturbRadius: 5.0,
  disturbStrength: 0.8,
  code: `
var p = addControl('nebPalette', 'Palette', 0, 5, 0);
var h = addControl('hueShift', 'Hue Shift', 0, 6.28, 0.035);
var s = addControl('saturation', 'Saturation', 0, 2.0, 1.071);
var b = addControl('brightness', 'Brightness', 0.5, 2.0, 0.968);
var d = addControl('density', 'Density', 0.3, 0.8, 0.367);
var st = addControl('structure', 'Structure', 0.1, 2.0, 0.27);
var gs = addControl('gasSpeed', 'Gas Speed', 0, 4.0, 0.468);
var ps = addControl('plasmaSpeed', 'Plasma Speed', 0, 4.0, 1.16);
target.set(0, 0, 0);
color.set(1, 1, 1);
`,
  createdAt: '2026-03-31',
}
