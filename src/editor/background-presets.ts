export interface GradientStop {
  color: string
  position: number // 0–1
}

export interface BackgroundPreset {
  id: string
  name: string
  category: 'solid' | 'gradient' | 'pattern'
  /** Hex color (solid) or dominant color (gradient/pattern — used for WebGL setClearColor fallback) */
  baseColor: string
  /** Full CSS background value for HTML/CSS usage */
  css: string
  /** Gradient definition for Canvas2D rendering (only for gradients) */
  gradient?: {
    type: 'linear' | 'radial'
    /** Angle in degrees — 0 = bottom→top, 90 = left→right (linear only) */
    angle?: number
    /** Radial center as [x%, y%] — default [50, 50] */
    center?: [number, number]
    stops: GradientStop[]
  }
  /** Custom Canvas2D render function (patterns + complex backgrounds) */
  renderToCanvas?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ── Solids ─────────────────────────────────────────────
  {
    id: 'void',
    name: 'Void',
    category: 'solid',
    baseColor: '#08040E',
    css: '#08040E',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    category: 'solid',
    baseColor: '#000000',
    css: '#000000',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    category: 'solid',
    baseColor: '#0a0a1a',
    css: '#0a0a1a',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    category: 'solid',
    baseColor: '#1a1a2e',
    css: '#1a1a2e',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    category: 'solid',
    baseColor: '#120816',
    css: '#120816',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    category: 'solid',
    baseColor: '#0d1117',
    css: '#0d1117',
  },

  // ── Subtle gradients ───────────────────────────────────
  {
    id: 'nebula',
    name: 'Nebula',
    category: 'gradient',
    baseColor: '#08040E',
    css: 'radial-gradient(ellipse at center, #1a0533, #08040E)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#1a0533', position: 0 },
        { color: '#08040E', position: 1 },
      ],
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'gradient',
    baseColor: '#0a0a1a',
    css: 'linear-gradient(to top, #0a2e1a, #0a0a1a, #1a0533)',
    gradient: {
      type: 'linear',
      angle: 0,
      stops: [
        { color: '#0a2e1a', position: 0 },
        { color: '#0a0a1a', position: 0.5 },
        { color: '#1a0533', position: 1 },
      ],
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    category: 'gradient',
    baseColor: '#08040E',
    css: 'linear-gradient(to top, #2e1a0a, #1a0a0a 30%, #08040E)',
    gradient: {
      type: 'linear',
      angle: 0,
      stops: [
        { color: '#2e1a0a', position: 0 },
        { color: '#1a0a0a', position: 0.3 },
        { color: '#08040E', position: 1 },
      ],
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    category: 'gradient',
    baseColor: '#08040E',
    css: 'radial-gradient(ellipse at center, #0a1a2e, #08040E)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#0a1a2e', position: 0 },
        { color: '#08040E', position: 1 },
      ],
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    category: 'gradient',
    baseColor: '#08040E',
    css: 'radial-gradient(ellipse at 50% 80%, #2e0a0a, #08040E)',
    gradient: {
      type: 'radial',
      center: [50, 80],
      stops: [
        { color: '#2e0a0a', position: 0 },
        { color: '#08040E', position: 1 },
      ],
    },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    category: 'gradient',
    baseColor: '#000000',
    css: 'radial-gradient(ellipse at center, #0d0033, #000000)',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#0d0033', position: 0 },
        { color: '#000000', position: 1 },
      ],
    },
  },

  // ── Vivid gradients ────────────────────────────────────
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
    id: 'magma',
    name: 'Magma',
    category: 'gradient',
    baseColor: '#0a0000',
    css: 'radial-gradient(ellipse at 50% 90%, #4d1500, #1a0800 50%, #0a0000)',
    gradient: {
      type: 'radial',
      center: [50, 90],
      stops: [
        { color: '#4d1500', position: 0 },
        { color: '#1a0800', position: 0.5 },
        { color: '#0a0000', position: 1 },
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

  // ── Patterns ───────────────────────────────────────────
  {
    id: 'grid',
    name: 'Grid',
    category: 'pattern',
    baseColor: '#08040E',
    css: 'repeating-linear-gradient(0deg, rgba(255,43,214,0.07) 0px, rgba(255,43,214,0.07) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,43,214,0.07) 0px, rgba(255,43,214,0.07) 1px, transparent 1px, transparent 40px), #08040E',
    renderToCanvas(ctx, w, h) {
      ctx.fillStyle = '#08040E'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,43,214,0.07)'
      ctx.lineWidth = 1
      const step = Math.round(w / 12)
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    },
  },
  {
    id: 'dots',
    name: 'Dots',
    category: 'pattern',
    baseColor: '#08040E',
    css: 'radial-gradient(circle, rgba(255,43,214,0.1) 1px, transparent 1px), #08040E',
    renderToCanvas(ctx, w, h) {
      ctx.fillStyle = '#08040E'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,43,214,0.1)'
      const step = Math.round(w / 16)
      const r = Math.max(1, step * 0.06)
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
        }
      }
    },
  },
  {
    id: 'scanlines',
    name: 'Scanlines',
    category: 'pattern',
    baseColor: '#08040E',
    css: 'repeating-linear-gradient(0deg, rgba(255,43,214,0.04) 0px, rgba(255,43,214,0.04) 1px, transparent 1px, transparent 4px), #08040E',
    renderToCanvas(ctx, w, h) {
      ctx.fillStyle = '#08040E'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,43,214,0.04)'
      const gap = Math.max(3, Math.round(h / 128))
      for (let y = 0; y < h; y += gap) {
        ctx.fillRect(0, y, w, 1)
      }
    },
  },
  {
    id: 'circuit',
    name: 'Circuit',
    category: 'pattern',
    baseColor: '#08040E',
    css: 'repeating-linear-gradient(0deg, rgba(124,255,0,0.05) 0px, rgba(124,255,0,0.05) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(124,255,0,0.05) 0px, rgba(124,255,0,0.05) 1px, transparent 1px, transparent 40px), #08040E',
    renderToCanvas(ctx, w, h) {
      ctx.fillStyle = '#08040E'
      ctx.fillRect(0, 0, w, h)
      const step = Math.round(w / 12)
      // Grid lines
      ctx.strokeStyle = 'rgba(124,255,0,0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      // Dots at intersections
      ctx.fillStyle = 'rgba(124,255,0,0.12)'
      const r = Math.max(1.5, step * 0.05)
      for (let x = 0; x <= w; x += step) {
        for (let y = 0; y <= h; y += step) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
        }
      }
    },
  },
  {
    id: 'noise',
    name: 'Noise',
    category: 'pattern',
    baseColor: '#08040E',
    css: '#08040E',
    renderToCanvas(ctx, w, h) {
      ctx.fillStyle = '#08040E'
      ctx.fillRect(0, 0, w, h)
      // Pseudo-random noise — deterministic seed for consistent look
      let seed = 42
      const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff }
      const density = w * h * 0.008
      for (let i = 0; i < density; i++) {
        const x = rng() * w
        const y = rng() * h
        const a = 0.03 + rng() * 0.06
        ctx.fillStyle = `rgba(255,43,214,${a})`
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1)
      }
    },
  },
]

/** Look up a preset by ID */
export function getBackgroundPreset(id: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((p) => p.id === id)
}
