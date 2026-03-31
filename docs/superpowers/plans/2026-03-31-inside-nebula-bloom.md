# Inside Nebula + Engine Bloom — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add engine-level bloom post-processing and a new volumetric raymarching "Inside Nebula" custom renderer effect.

**Architecture:** Bloom via `@react-three/postprocessing` (EffectComposer + Bloom) mounted conditionally in Viewport based on per-effect `bloom` flag in store. Inside Nebula is a custom R3F component with raymarching ShaderMaterial + star particles, following the existing PerlinNoise.tsx pattern.

**Tech Stack:** @react-three/postprocessing, Three.js ShaderMaterial (raymarching GLSL), Zustand store, Tweakpane controls

**Spec:** `docs/superpowers/specs/2026-03-31-inside-nebula-bloom-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/engine/InsideNebula.tsx` | Custom R3F component: raymarching volume + star particles, reads controls from store |
| `src/effects/presets/inside-nebula.ts` | Effect preset metadata, controls, camera, bloom settings |

### Modified Files
| File | Change |
|------|--------|
| `package.json` | Add `@react-three/postprocessing` |
| `src/engine/types.ts:48-81` | Add 4 bloom fields to Effect interface |
| `src/store.ts:7-100,120-180` | Add `bloomStrength/bloomRadius/bloomThreshold` state + setters |
| `src/editor/EditorLayout.tsx:72-102` | Apply bloom settings in `handleSelectEffect` |
| `src/editor/Viewport.tsx:1-10,140-165` | Import + mount BloomPass, register InsideNebula in CUSTOM_RENDERERS |
| `src/effects/presets/index.ts:1-23` | Import + register inside-nebula in ALL_PRESETS |
| `src/effects/presets/nebula.ts:3-69` | Update Nebula Organica params + add bloom |
| `src/editor/ControlPanel.tsx:94-103` | Add `nebPalette` to DROPDOWN_CONTROLS |
| `vite.config.ts:19-45` | Add postprocessing to manualChunks |

---

### Task 1: Install dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @react-three/postprocessing**

```bash
npm install @react-three/postprocessing
```

- [ ] **Step 2: Verify build still works**

```bash
npx tsc -b --noEmit
```

Expected: no errors (postprocessing types resolve against existing three/r3f)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @react-three/postprocessing for bloom support"
```

---

### Task 2: Add bloom fields to Effect interface

**Files:**
- Modify: `src/engine/types.ts:48-81`

- [ ] **Step 1: Add bloom fields after `disturbStrength`**

At end of the Effect interface (before closing `}`), add:

```typescript
  bloom?: boolean
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -b --noEmit
```

Expected: PASS (all fields optional, no downstream breakage)

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add bloom fields to Effect interface"
```

---

### Task 3: Add bloom state to Zustand store

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Add state fields to PrtclState interface**

The store already has `bloomEnabled: boolean` (line 19) and `setBloomEnabled` (line 67). Add after them in the interface:

```typescript
  bloomStrength: number
  bloomRadius: number
  bloomThreshold: number
  setBloomStrength: (v: number) => void
  setBloomRadius: (v: number) => void
  setBloomThreshold: (v: number) => void
```

- [ ] **Step 2: Add initial values in the create() call**

After `bloomEnabled: false` in the initial state:

```typescript
  bloomStrength: 0.5,
  bloomRadius: 0.4,
  bloomThreshold: 0.4,
```

- [ ] **Step 3: Add setter actions**

After the existing `setBloomEnabled` action:

```typescript
  setBloomStrength: (v) => set({ bloomStrength: v }),
  setBloomRadius: (v) => set({ bloomRadius: v }),
  setBloomThreshold: (v) => set({ bloomThreshold: v }),
```

- [ ] **Step 4: Type-check**

```bash
npx tsc -b --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store.ts
git commit -m "feat: add bloom strength/radius/threshold to store"
```

---

### Task 4: Apply bloom settings on effect switch

**Files:**
- Modify: `src/editor/EditorLayout.tsx:72-102`

- [ ] **Step 1: Add bloom setters in handleSelectEffect**

Inside `handleSelectEffect`, after the existing `store.set*()` calls (after the `backgroundPreset` line), add:

```typescript
    store.setBloomEnabled(effect.bloom ?? false)
    store.setBloomStrength(effect.bloomStrength ?? 0.5)
    store.setBloomRadius(effect.bloomRadius ?? 0.4)
    store.setBloomThreshold(effect.bloomThreshold ?? 0.4)
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -b --noEmit
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/editor/EditorLayout.tsx
git commit -m "feat: apply bloom settings on effect switch"
```

---

### Task 5: Add BloomPass to Viewport + update manualChunks

**Files:**
- Modify: `src/editor/Viewport.tsx:1-10,153-165`
- Modify: `vite.config.ts:19-45`

- [ ] **Step 1: Add BloomPass component in Viewport.tsx**

Add imports at top:

```typescript
import { EffectComposer, Bloom } from '@react-three/postprocessing'
```

Add the BloomPass component before the default export (after CUSTOM_RENDERERS map):

```tsx
function BloomPass() {
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
```

Mount `<BloomPass />` inside the Canvas, after the scene content (after `{CustomRenderer ? <CustomRenderer /> : <ParticleSystem />}`).

- [ ] **Step 2: Add postprocessing to manualChunks in vite.config.ts**

In the `manualChunks` function, add a rule for postprocessing. After the existing r3f chunk rule:

```typescript
if (id.includes('node_modules/postprocessing/') || id.includes('node_modules/@react-three/postprocessing/')) {
  return 'postprocessing'
}
```

- [ ] **Step 3: Verify dev server runs and existing effects still work**

Open browser at `localhost:5173/create`, switch between a few effects. No visual regressions — bloom is `false` for all existing effects, so BloomPass returns null.

- [ ] **Step 4: Commit**

```bash
git add src/editor/Viewport.tsx vite.config.ts
git commit -m "feat: add BloomPass component with conditional EffectComposer"
```

---

### Task 6: Create Inside Nebula custom renderer

**Files:**
- Create: `src/engine/InsideNebula.tsx`

This is the largest task. The component has:
- Raymarching ShaderMaterial on BackSide BoxGeometry
- 3 noise functions (fbm, ridge, veinNoise)
- Star particles (600 points, additive blending)
- Reads controls from Zustand store via `getState()` in useFrame
- Color palette system (6 palettes mapped by `nebPalette` control)
- HSL post-processing in shader (hue rotation, saturation, brightness)

- [ ] **Step 1: Create the component file**

Follow the PerlinNoise.tsx pattern:
- Import THREE, useFrame, useStore, useMemo, useRef
- Define shader strings as constants (vertex + fragment with noise chunk inlined)
- Define NEBULA_PALETTES array: `[[core, mid, outer], ...]` as `THREE.Color` triplets
- Component function:
  - `useMemo` for BoxGeometry + ShaderMaterial (volumetric) and BufferGeometry + ShaderMaterial (stars)
  - `useFrame` reads controls from `store.controls`, updates uniforms (`uTime`, `uRidgeTime`, `uVeinTime`, `uDensityMult`, `uStructure`, colors from palette + HSL, etc.)
  - Time accumulators for gas/plasma/vein speeds (use `useRef` for accumulated time values)
  - Return `<group>` with `<mesh>` (volume) and `<points>` (stars)

The vertex shader is simple (pass world position). The fragment shader is the full raymarching pipeline from the source (`incoming/effects/inside-nebula/inside-nebula/src/script.js` lines 84-198) with added HSL post-processing uniforms:

After computing `col` in the march loop (line ~184 equivalent), before accumulation, add:
```glsl
// Saturation
float lum = dot(c, vec3(0.299, 0.587, 0.114));
c = mix(vec3(lum), c, uSaturation);
// Hue rotation (Rodrigues)
vec3 k = vec3(0.57735);
c = c * cos(uHueShift) + cross(k, c) * sin(uHueShift) + k * dot(k, c) * (1.0 - cos(uHueShift));
// Brightness
c *= uBrightness;
```

Star particles: 600 points in spherical distribution, colors from current palette, additive blending, soft circle fragment shader with min size clamp. Colors update when palette changes.

- [ ] **Step 2: Register in Viewport CUSTOM_RENDERERS map**

In `src/editor/Viewport.tsx`, add import:

```typescript
import InsideNebula from '../engine/InsideNebula'
```

Add to CUSTOM_RENDERERS:

```typescript
const CUSTOM_RENDERERS: Record<string, React.ComponentType> = {
  'paper-fleet': PaperFleet,
  'text-terrain': TextTerrain,
  'perlin-noise': PerlinNoise,
  'inside-nebula': InsideNebula,
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc -b --noEmit
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/engine/InsideNebula.tsx src/editor/Viewport.tsx
git commit -m "feat: InsideNebula custom renderer — raymarching + star particles"
```

---

### Task 7: Create Inside Nebula preset + register

**Files:**
- Create: `src/effects/presets/inside-nebula.ts`
- Modify: `src/effects/presets/index.ts`
- Modify: `src/editor/ControlPanel.tsx:94-103`

- [ ] **Step 1: Create the preset file**

```typescript
import type { Effect } from '../../engine/types'

export const insideNebula: Effect = {
  id: 'inside-nebula',
  slug: 'inside-nebula',
  name: 'Inside Nebula',
  description: 'You are inside a sentient gas cloud. It knows you are watching.',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['nebula', 'volumetric', 'raymarching', 'glow', 'space', 'gas'],
  particleCount: 600,
  pointSize: 0.5,
  cameraDistance: 3.2,
  cameraPosition: [0, 0, 3.2],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  cameraZoom: 1,
  backgroundPreset: 'void',
  renderer: 'custom',
  customRenderer: 'inside-nebula',
  bloom: true,
  bloomStrength: 0.48,
  bloomRadius: 0.4,
  bloomThreshold: 0.4,
  controls: {
    nebPalette: 0,
    hueShift: 0,
    saturation: 1.0,
    brightness: 1.0,
    density: 0.5,
    structure: 0.14,
    gasSpeed: 1.0,
    plasmaSpeed: 0.3,
  },
  disturbMode: 'scatter',
  disturbRadius: 5.0,
  disturbStrength: 0.8,
  code: `
    var p = addControl('nebPalette', 'Palette', 0, 5, 0);
    var h = addControl('hueShift', 'Hue Shift', 0, 6.28, 0);
    var s = addControl('saturation', 'Saturation', 0, 2.0, 1.0);
    var b = addControl('brightness', 'Brightness', 0.5, 2.0, 1.0);
    var d = addControl('density', 'Density', 0.3, 0.8, 0.5);
    var st = addControl('structure', 'Structure', 0.1, 2.0, 0.14);
    var gs = addControl('gasSpeed', 'Gas Speed', 0, 4.0, 1.0);
    var ps = addControl('plasmaSpeed', 'Plasma Speed', 0, 4.0, 0.3);
    target.set(0, 0, 0);
    color.set(1, 1, 1);
  `,
  createdAt: '2026-03-31',
}
```

- [ ] **Step 2: Register in ALL_PRESETS**

In `src/effects/presets/index.ts`, add import:

```typescript
import { insideNebula } from './inside-nebula'
```

Add `insideNebula` to ALL_PRESETS array, in the organic section (after `nebula`):

```typescript
export const ALL_PRESETS: Effect[] = [frequency, hopf, nebula, insideNebula, starfield, ...]
```

- [ ] **Step 3: Add nebPalette to DROPDOWN_CONTROLS**

In `src/editor/ControlPanel.tsx`, add to the DROPDOWN_CONTROLS map:

```typescript
  nebPalette: { 'PRTCL': 0, 'Classic': 1, 'Inferno': 2, 'Arctic': 3, 'Toxic': 4, 'Void': 5 },
```

- [ ] **Step 4: Type-check**

```bash
npx tsc -b --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/effects/presets/inside-nebula.ts src/effects/presets/index.ts src/editor/ControlPanel.tsx
git commit -m "feat: Inside Nebula preset with palette dropdown"
```

---

### Task 8: Update Nebula Organica params

**Files:**
- Modify: `src/effects/presets/nebula.ts`

- [ ] **Step 1: Update preset fields**

Update the nebula preset with new baselines:

```typescript
  particleCount: 24000,
  pointSize: 0.83,
  backgroundPreset: 'plasma',
  cameraPosition: [4.698, 1.552, -0.719],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: -0.5,
  cameraZoom: 1,
  controls: {
    speed: 0.941,
    scale: 2.256,
    turbulence: 0.892,
  },
  bloom: true,
  bloomStrength: 0.3,
  bloomRadius: 0.3,
  bloomThreshold: 0.5,
```

Keep existing `code`, `disturbMode`, `disturbRadius`, `disturbStrength` unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/effects/presets/nebula.ts
git commit -m "feat: update Nebula Organica params + enable bloom"
```

---

### Task 9: Visual verification

- [ ] **Step 1: Test Inside Nebula**

Open `localhost:5173/create`, select "Inside Nebula" from the organic category. Verify:
- Volumetric raymarched nebula renders with glow (bloom active)
- Star particles visible around the volume
- Camera auto-rotates
- All 8 controls work in Tweakpane (palette dropdown, 7 sliders)
- Palette changes update nebula colors
- HSL sliders modify appearance on top of palette

- [ ] **Step 2: Test bloom on/off transition**

Switch from Inside Nebula to Fractal Frequency (no bloom). Verify:
- Bloom disappears cleanly
- FF renders normally with no visual artifacts
- Switch back to Inside Nebula — bloom re-enables

- [ ] **Step 3: Test Nebula Organica**

Select Nebula Organica. Verify:
- New camera position, background (plasma), and bloom active
- Bloom is subtler than Inside Nebula (0.3 vs 0.48 strength)
- Controls work: speed, scale, turbulence

- [ ] **Step 4: Test other effects unaffected**

Switch through 3-4 other effects (Hopf, Starfield, Axiom, Text Wave). Verify no regressions — bloom is disabled, rendering is identical to before.

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: clean build, no errors. Check that postprocessing lands in its own chunk (not in main bundle).

- [ ] **Step 6: Commit any fixes, then final commit**

```bash
git add -A
git commit -m "feat: Inside Nebula + engine bloom — visual verification pass"
```
