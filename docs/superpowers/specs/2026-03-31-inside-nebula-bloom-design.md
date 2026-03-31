# Inside Nebula + Engine Bloom — Design Spec

**Date**: 2026-03-31
**Status**: Approved
**Scope**: Engine-level bloom system + new "Inside Nebula" custom renderer effect + Nebula Organica params update

## Overview

Two changes shipped together:

1. **Engine-level bloom** — post-processing pipeline added to the R3F renderer. Any effect can opt in via `bloom: true` in its preset. Zero overhead when disabled.
2. **Inside Nebula** — volumetric raymarching nebula as a custom renderer effect (organic category). First effect to use bloom. Ported from `incoming/effects/inside-nebula/`.

Nebula Organica also gets updated baseline params and bloom activation.

---

## Part 1: Engine-Level Bloom System

### Effect Interface — New Fields

Add to `Effect` in `src/engine/types.ts`:

```typescript
bloom?: boolean           // enable bloom post-processing (default: false)
bloomStrength?: number    // glow intensity, 0–2 (default: 0.5)
bloomRadius?: number      // blur spread, 0–1 (default: 0.4)
bloomThreshold?: number   // brightness threshold, 0–1 (default: 0.4)
```

All optional. Effects without `bloom` render exactly as before — no overhead.

### Store — New Slice

Add to `PrtclState` interface and initial state in `src/store.ts`:

```typescript
// State fields
bloomEnabled: boolean        // default: false
bloomStrength: number        // default: 0.5
bloomRadius: number          // default: 0.4
bloomThreshold: number       // default: 0.4

// Actions
setBloomEnabled: (v: boolean) => void
setBloomStrength: (v: number) => void
setBloomRadius: (v: number) => void
setBloomThreshold: (v: number) => void
```

### handleSelectEffect Integration

In `src/editor/EditorLayout.tsx`, `handleSelectEffect` must apply bloom settings on every effect switch:

```typescript
store.setBloomEnabled(effect.bloom ?? false)
store.setBloomStrength(effect.bloomStrength ?? 0.5)
store.setBloomRadius(effect.bloomRadius ?? 0.4)
store.setBloomThreshold(effect.bloomThreshold ?? 0.4)
```

### Renderer Integration

**Package**: `@react-three/postprocessing` (wraps pmndrs/postprocessing — more performant than Three.js built-in EffectComposer, already R3F-native).

**Location**: `src/editor/Viewport.tsx` (or new `BloomEffect.tsx` component inside Viewport).

```tsx
import { EffectComposer, Bloom } from '@react-three/postprocessing'

function BloomPass() {
  // Read bloom params from store via selectors (granular to avoid re-renders)
  const enabled = useStore(s => s.bloomEnabled)
  const strength = useStore(s => s.bloomStrength)
  const threshold = useStore(s => s.bloomThreshold)
  const radius = useStore(s => s.bloomRadius)
  const isMobile = useIsMobile()

  if (!enabled || isMobile) return null

  return (
    <EffectComposer>
      <Bloom
        intensity={strength}
        luminanceThreshold={threshold}
        radius={radius}
        mipmapBlur
      />
    </EffectComposer>
  )
}

// Inside Canvas, after scene content:
<BloomPass />
```

When bloom is disabled (or on mobile), no EffectComposer mounts — zero GPU cost. The `BloomPass` component reads store values via granular selectors so bloom param changes don't trigger unrelated re-renders.

**Tone mapping**: The R3F Canvas should set `toneMapping={THREE.ACESFilmicToneMapping}` when bloom is active. ACES handles bright HDR colors without blowing out to white. This can be set as a Canvas `gl` prop or toggled in a `useFrame` based on `bloomEnabled`.

### Performance Guards

1. **Mobile cutoff**: Bloom disabled on `window.innerWidth < 768` (via `useIsMobile()` in `BloomPass`) regardless of effect preset. Mobile is showcase mode — particles already push budget.
2. **Adaptive quality**: The `AdaptiveQuality` class in `src/engine/adaptive-quality.ts` currently only manages particle count. For bloom: ParticleSystem's `useFrame` checks if adaptive quality has reduced count below threshold AND bloom is enabled → calls `store.setBloomEnabled(false)`. Recovery re-enables bloom when fps stabilizes. Simple boolean toggle, no class changes needed.
3. **Morph transitions**: Bloom settings are applied atomically on effect switch. When switching bloom→no-bloom, bloom disappears instantly (no fade). This is acceptable because: (a) the morph transition already dominates visual attention, (b) fading bloom requires tracking "previous bloom" state which adds complexity for minimal gain. If the pop is noticeable in practice, a simple `setTimeout` to delay bloom disable by 200ms is a trivial follow-up.

### Vite Config — Code Splitting

`@react-three/postprocessing` lazy-loaded via the existing R3F chunk or a new `postprocessing` manual chunk. Must NOT land in the landing page bundle.

---

## Part 2: Inside Nebula — Custom Renderer Effect

### Metadata

| Field | Value |
|-------|-------|
| id | `inside-nebula` |
| slug | `inside-nebula` |
| name | Inside Nebula |
| category | `organic` |
| author | PRTCL Team |
| renderer | `custom` |
| customRenderer | `inside-nebula` |
| description | GLaDOS-style witty description TBD |
| bloom | `true` |
| bloomStrength | `0.48` |
| bloomRadius | `0.4` |
| bloomThreshold | `0.4` |

### Architecture

Custom R3F component: `src/engine/InsideNebula.tsx` (follows existing convention — all custom renderers live in `src/engine/`: `PaperFleet.tsx`, `TextTerrain.tsx`, `PerlinNoise.tsx`)

**Two meshes in a Group:**

1. **Volumetric nebula** — `BoxGeometry(10,10,10)` with `BackSide` ShaderMaterial. Fragment shader raymarches through the volume using 3 noise functions:
   - `fbm()` — base gas clouds (4 octaves)
   - `ridge()` — sharp plasma tendrils (4 octaves)
   - `veinNoise()` — thin luminous filaments (3 octaves)
   - Spherical falloff at radius 4.5 for seamless edges
   - AABB box intersection for ray entry/exit
   - 32 march steps, step size 0.3

2. **Star particles** — 600 points in spherical distribution (r = 0.5–8.5), additive blending, soft circle fragment shader with min size clamp. Colors sampled from current palette.

### Shader Uniforms

```glsl
uniform float uTime;         // gas animation time (accumulated)
uniform float uRidgeTime;    // plasma animation time (accumulated)
uniform float uVeinTime;     // vein animation time (accumulated)
uniform float uDensityMult;  // gas density multiplier
uniform float uStructure;    // noise scale
uniform vec3  uColorCore;    // brightest inner color
uniform vec3  uColorMid;     // plasma/mid-range color
uniform vec3  uColorOuter;   // fringe/edge color
uniform float uHueShift;     // post-palette hue rotation (Rodrigues rotation in GLSL)
uniform float uSaturation;   // saturation multiplier (mix with luminance)
uniform float uBrightness;   // brightness multiplier
```

**HSL post-processing in shader**: After computing the base `col` from the 3-color palette, apply in the fragment shader:
1. **Saturation**: `float lum = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(lum), col, uSaturation);`
2. **Hue rotation**: Rodrigues formula — `vec3 k = vec3(0.57735); col = col * cos(uHueShift) + cross(k, col) * sin(uHueShift) + k * dot(k, col) * (1.0 - cos(uHueShift));`
3. **Brightness**: `col *= uBrightness;`

This is new shader code not in the source — added to enable per-palette tweaking.

### Controls (8 total: 1 dropdown + 7 sliders)

| id | label | type | min | max | default | notes |
|----|-------|------|-----|-----|---------|-------|
| `nebPalette` | Palette | dropdown | — | — | `0` (PRTCL) | DROPDOWN_CONTROLS map (unique ID avoids collision with Axiom's `palette`) |
| `hueShift` | Hue Shift | slider | 0 | 6.28 | 0 | radians, full rotation |
| `saturation` | Saturation | slider | 0 | 2.0 | 1.0 | 1.0 = neutral |
| `brightness` | Brightness | slider | 0.5 | 2.0 | 1.0 | 1.0 = neutral |
| `density` | Density | slider | 0.3 | 0.8 | 0.5 | gas opacity |
| `structure` | Structure | slider | 0.1 | 2.0 | 0.14 | noise frequency scale |
| `gasSpeed` | Gas Speed | slider | 0 | 4.0 | 1.0 | fbm animation rate |
| `plasmaSpeed` | Plasma Speed | slider | 0 | 4.0 | 0.3 | ridge animation rate |

### Color Palettes

Palette dropdown maps index to `[core, mid, outer]` hex triplets:

| Index | Name | Core | Mid | Outer |
|-------|------|------|-----|-------|
| 0 | PRTCL | `#FFFFFF` | `#FF2BD6` | `#7CFF00` |
| 1 | Classic | `#FFE6F2` | `#2A70B2` | `#FFFFFF` |
| 2 | Inferno | `#FFFF80` | `#FF4400` | `#880000` |
| 3 | Arctic | `#FFFFFF` | `#00DDFF` | `#0044AA` |
| 4 | Toxic | `#7CFF00` | `#AA00FF` | `#110022` |
| 5 | Void | `#8844CC` | `#330066` | `#0A0014` |

When palette changes via dropdown, the 3 color uniforms update. HSL sliders apply as post-processing on top of palette base colors.

### Camera Defaults

```typescript
cameraPosition: [0, 0, 3.2]
cameraTarget: [0, 0, 0]
cameraDistance: 3.2
autoRotateSpeed: 0.5
cameraZoom: 1
```

### Disturb Mode

```typescript
disturbMode: 'scatter'    // hand tracking disperses gas visually
disturbRadius: 5.0
disturbStrength: 0.8
```

Note: hand disturb affects the star particles only (the raymarched volume is shader-only and not influenced by hand position in v1).

### Background

```typescript
backgroundPreset: 'void'  // deep black complements the nebula glow
```

### Audio Reactivity

The raymarching shader doesn't receive audio params directly (it's a custom renderer, not the particle system loop). Audio reactivity deferred to v2 — could modulate density/speed uniforms from the store's audio slice.

---

## Part 3: Nebula Organica — Params Update

Update `src/effects/presets/nebula.ts` with new baseline:

```typescript
particleCount: 24000
pointSize: 0.83
backgroundPreset: 'plasma'
cameraPosition: [4.698, 1.552, -0.719]
cameraTarget: [0, 0, 0]
autoRotateSpeed: -0.5
cameraZoom: 1
controls: {
  speed: 0.941,
  scale: 2.256,
  turbulence: 0.892
}
bloom: true
bloomStrength: 0.3
bloomRadius: 0.3
bloomThreshold: 0.5
```

---

## Part 4: Future Bloom Activations (Not This PR)

Effects that would benefit from bloom in a follow-up:
- Fireflies (`bloomStrength: 0.6` — bioluminescence)
- Black Hole (`bloomStrength: 0.5` — accretion disk)
- Electromagnetic (`bloomStrength: 0.4` — field line glow)
- Fractal Frequency (`bloomStrength: 0.3` — subtle halo)
- Starfield (`bloomStrength: 0.3` — star bleed)

---

## Files Changed/Created

### New Files
- `src/engine/InsideNebula.tsx` — custom R3F component (follows convention: all custom renderers in `src/engine/`)
- `src/effects/presets/inside-nebula.ts` — effect preset

### Modified Files
- `src/engine/types.ts` — add bloom fields to Effect interface
- `src/store.ts` — add bloom state fields (`bloomEnabled`, `bloomStrength`, `bloomRadius`, `bloomThreshold`) + setter actions
- `src/editor/EditorLayout.tsx` — apply bloom settings in `handleSelectEffect` on every effect switch
- `src/editor/Viewport.tsx` — new `BloomPass` component (EffectComposer + Bloom), register `'inside-nebula'` in `CUSTOM_RENDERERS` map, import InsideNebula
- `src/effects/presets/index.ts` — register Inside Nebula in ALL_PRESETS
- `src/effects/presets/nebula.ts` — update Nebula Organica defaults + bloom
- `src/editor/ControlPanel.tsx` — add `nebPalette` to DROPDOWN_CONTROLS map for inside-nebula
- `vite.config.ts` — add `postprocessing` (pmndrs) to manual chunks to prevent it landing in default bundle
- `package.json` — add `@react-three/postprocessing` dependency (version compatible with Three.js 0.183.x + React 19)

### Not Changed
- `src/engine/compiler.ts` — no changes (custom renderer, not compiled)
- `src/engine/validator.ts` — no changes
- `src/engine/ParticleSystem.tsx` — no changes (bloom is at Viewport level)
- Landing page — no changes (bloom lazy-loaded with editor)

---

## Export Compatibility

Inside Nebula uses `renderer: 'custom'` — **not exportable**. Export button shows existing tooltip "Custom renderers cannot be exported." No changes needed to export system.

## Known Limitations (v1)

- **Embed route**: `/embed` does not support bloom. Effects shared via iframe render without glow. Acceptable for v1.
- **Bloom snap**: Switching from bloom→no-bloom effect causes instant bloom disappearance. Morph transition masks this in practice.
- **Audio**: Inside Nebula has no audio reactivity in v1. Custom renderers bypass the compiled function signature. Could wire audio store values to shader uniforms in v2.
- **Hand tracking**: Disturb only affects the 600 star particles, not the raymarched volume.

## Performance Budget

- Bloom adds ~2–3ms GPU on desktop (mipmapBlur is efficient)
- Raymarching: 32 steps × per-pixel — heavier than particles but bounded by box intersection
- Star particles: 600 points — negligible
- Total: should maintain 60fps on mid-range desktop GPU
- Mobile: bloom disabled, custom renderer still runs (raymarching is fragment-bound, not particle-count-bound)
