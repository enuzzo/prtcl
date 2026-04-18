export interface GradientStop {
  color: string
  position: number // 0–1
}

export interface BackgroundPreset {
  id: string
  name: string
  category: 'gradient'
  /** Hex color — dominant color, used for WebGL setClearColor fallback */
  baseColor: string
  /** Full CSS background value for HTML/CSS usage */
  css: string
  /** Gradient definition for Canvas2D rendering */
  gradient: {
    type: 'linear' | 'radial'
    /** Angle in degrees — 0 = bottom→top, 90 = left→right (linear only) */
    angle?: number
    /** Radial center as [x%, y%] — default [50, 50] */
    center?: [number, number]
    stops: GradientStop[]
  }
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'electric',
    name: 'Electric',
    category: 'gradient',
    baseColor: '#020a18',
    css: 'radial-gradient(ellipse at 40% 40%, #003366, #001133 55%, #020a18)',
    gradient: {
      type: 'radial',
      center: [40, 40],
      stops: [
        { color: '#003366', position: 0 },
        { color: '#001133', position: 0.55 },
        { color: '#020a18', position: 1 },
      ],
    },
  },
  {
    id: 'plasma',
    name: 'Plasma',
    category: 'gradient',
    baseColor: '#0a0010',
    css: 'radial-gradient(ellipse at center, #3d0066, #1a0033 50%, #0a0010)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#3d0066', position: 0 },
        { color: '#1a0033', position: 0.5 },
        { color: '#0a0010', position: 1 },
      ],
    },
  },
  {
    id: 'toxic',
    name: 'Toxic',
    category: 'gradient',
    baseColor: '#020a00',
    css: 'radial-gradient(ellipse at 50% 50%, #0a3300, #041a00 55%, #020a00)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#0a3300', position: 0 },
        { color: '#041a00', position: 0.55 },
        { color: '#020a00', position: 1 },
      ],
    },
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    category: 'gradient',
    baseColor: '#06000f',
    css: 'linear-gradient(135deg, #1a004d, #0d0033 40%, #06000f 70%, #0a001a)',
    gradient: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#1a004d', position: 0 },
        { color: '#0d0033', position: 0.4 },
        { color: '#06000f', position: 0.7 },
        { color: '#0a001a', position: 1 },
      ],
    },
  },
  {
    id: 'magenta',
    name: 'Magenta',
    category: 'gradient',
    baseColor: '#0f0010',
    css: 'radial-gradient(ellipse at 45% 45%, #4d0040, #260020 50%, #0f0010)',
    gradient: {
      type: 'radial',
      center: [45, 45],
      stops: [
        { color: '#4d0040', position: 0 },
        { color: '#260020', position: 0.5 },
        { color: '#0f0010', position: 1 },
      ],
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    category: 'gradient',
    baseColor: '#0a0200',
    css: 'radial-gradient(ellipse at 50% 70%, #4d1a00, #1a0800 55%, #0a0200)',
    gradient: {
      type: 'radial',
      center: [50, 70],
      stops: [
        { color: '#4d1a00', position: 0 },
        { color: '#1a0800', position: 0.55 },
        { color: '#0a0200', position: 1 },
      ],
    },
  },
  {
    id: 'cyan',
    name: 'Cyan',
    category: 'gradient',
    baseColor: '#000a0f',
    css: 'radial-gradient(ellipse at 55% 40%, #004d55, #001a22 50%, #000a0f)',
    gradient: {
      type: 'radial',
      center: [55, 40],
      stops: [
        { color: '#004d55', position: 0 },
        { color: '#001a22', position: 0.5 },
        { color: '#000a0f', position: 1 },
      ],
    },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    category: 'gradient',
    baseColor: '#0a0004',
    css: 'radial-gradient(ellipse at 40% 55%, #4d0015, #1a000a 55%, #0a0004)',
    gradient: {
      type: 'radial',
      center: [40, 55],
      stops: [
        { color: '#4d0015', position: 0 },
        { color: '#1a000a', position: 0.55 },
        { color: '#0a0004', position: 1 },
      ],
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    category: 'gradient',
    baseColor: '#0a0a0a',
    css: 'radial-gradient(ellipse at 50% 50%, #3a3a3a, #151515 55%, #0a0a0a)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#3a3a3a', position: 0 },
        { color: '#151515', position: 0.55 },
        { color: '#0a0a0a', position: 1 },
      ],
    },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    category: 'gradient',
    baseColor: '#030108',
    css: 'linear-gradient(160deg, #33133a, #1a0f3a 40%, #070316 75%, #030108)',
    gradient: {
      type: 'linear',
      angle: 160,
      stops: [
        { color: '#33133a', position: 0 },
        { color: '#1a0f3a', position: 0.4 },
        { color: '#070316', position: 0.75 },
        { color: '#030108', position: 1 },
      ],
    },
  },
  {
    id: 'onyx',
    name: 'Onyx',
    category: 'gradient',
    baseColor: '#010101',
    css: 'radial-gradient(ellipse at 50% 50%, #161616, #070707 55%, #010101)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#161616', position: 0 },
        { color: '#070707', position: 0.55 },
        { color: '#010101', position: 1 },
      ],
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    category: 'gradient',
    baseColor: '#0a0603',
    css: 'radial-gradient(ellipse at 45% 50%, #4d3319, #1a0f07 55%, #0a0603)',
    gradient: {
      type: 'radial',
      center: [45, 50],
      stops: [
        { color: '#4d3319', position: 0 },
        { color: '#1a0f07', position: 0.55 },
        { color: '#0a0603', position: 1 },
      ],
    },
  },
]

/** Look up a preset by ID */
export function getBackgroundPreset(id: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((p) => p.id === id)
}
