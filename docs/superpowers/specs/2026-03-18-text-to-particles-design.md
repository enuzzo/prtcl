# Phase 3: Text-to-Particles — Design Spec

## Overview

Text-to-particles lets users type any text and see it rendered as a particle cloud. The text is sampled into a point cloud via offscreen canvas, and effects use those points as target positions. Three text effects ship with Phase 3. Google Fonts are loaded dynamically on first use.

The infrastructure is already wired: `textPoints: Float32Array` is in the compiled function signature, the "text" category exists in the EffectBrowser, and canvas text sampling is proven in the SplashScreen.

## Pipeline

```
User types text → debounce 300ms → offscreen canvas renders text at font/weight
→ getImageData() → extract pixels with alpha > 128 → normalize to world coordinates
→ resample to match particleCount → Float32Array stored in Zustand
→ ParticleSystem passes textPoints as 9th parameter to compiled effect
→ Effect reads textPoints[i*3 + 0/1/2] for x/y/z target positions
```

## Canvas Sampler

Rewrite the `sampleTextPointsSorted` concept from `SplashScreen.tsx` as a general-purpose module. Note: SplashScreen returns 2D `[x, y]` pairs; this sampler returns interleaved 3D `Float32Array` with normalized world coordinates — it's a new implementation inspired by the same technique, not a direct extraction.

**File**: `src/text/sampler.ts`

```typescript
export function sampleText(
  text: string,
  font: string,
  weight: string,
  targetCount: number,
): Float32Array
```

**Algorithm**:
1. Measure text dimensions: `ctx.measureText(text)` at ~120px font size to determine canvas width. Add 20% padding. Set canvas height proportionally.
2. Render text centered with specified font/weight in white on transparent background.
3. `getImageData()` — scan pixels with `step=2` for performance.
4. Collect all pixel positions where alpha > 128.
5. **Normalize** coordinates to world space: center at origin, scale to range roughly [-4, 4] in X (proportional to text width) so the text cloud fits naturally in the scene alongside non-text effects.
6. **Resample** to match `targetCount`:
   - If too many points: random downsample.
   - If too few points: jitter-duplicate existing points (add small random offset to avoid visible stacking).
7. **X-sort** for spatial coherence — particles close in the array are close spatially. This makes index-based effects (e.g., wave by index) look coherent.
8. Z = 0 for all points (flat text plane — effects add depth).
9. Return `Float32Array` of length `targetCount * 3` (x, y, z interleaved).

**DPI handling**: The offscreen canvas is for sampling only (never displayed), so use `devicePixelRatio = 1` for consistency across devices.

## Google Fonts

**File**: `src/text/font-loader.ts`

Lazy-loaded: no fonts are fetched until the user selects a text effect.

**Loading strategy**:
1. On first text effect selection, inject a single `<link>` tag:
   ```html
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&family=Inter:wght@300;400;700&...&display=swap">
   ```
2. All curated fonts are loaded in one request (Google Fonts API supports multiple families).
3. Use **per-font** `document.fonts.load('700 120px Montserrat')` to check readiness for the specific selected font (not `document.fonts.ready`, which resolves when ALL loading fonts finish — unreliable when user switches fonts mid-load).
4. Until the selected font loads, the sampler uses the fallback font stack (Inconsolata/system monospace). Store tracks `textFontsLoaded: boolean` so the ControlPanel can show a loading indicator.
5. The `<link>` tag is injected once and never removed.

**Curated font list** (`src/text/fonts.ts`):

| Font | Category | Weights | Vibe |
|------|----------|---------|------|
| Montserrat | Sans | 300,400,700 | Clean, modern |
| Inter | Sans | 300,400,700 | Neutral, readable |
| Bebas Neue | Sans/Display | 400 | Bold, condensed |
| Oswald | Sans | 300,400,700 | Strong, editorial |
| Playfair Display | Serif | 400,700 | Elegant |
| Cormorant Garamond | Serif | 300,400,700 | Classic, light |
| Righteous | Display | 400 | Fun, rounded |
| Pacifico | Handwriting | 400 | Script, playful |
| Permanent Marker | Handwriting | 400 | Handwritten, rough |
| Bungee | Display | 400 | Blocky, bold |
| Space Mono | Mono | 400,700 | Technical |
| Fira Code | Mono | 300,400,700 | Developer |

12 fonts. Mix of styles for creative variety. All have permissive licenses (OFL).

**Export note**: Exported snippets bake `textPoints` as a static Float32Array. The font is NOT needed at runtime in the export — the font name is included only as a comment for documentation.

## Text Input UI

When a text effect (`category: 'text'`) is selected, the ControlPanel shows a **TEXT** Tweakpane folder above the EFFECT folder. Uses Tweakpane bindings for consistency with the rest of the UI:

- **Text**: `pane.addBinding(params, 'text')` — free text input, default "PRTCL". Max ~20 characters.
- **Font**: `pane.addBinding(params, 'font', { options: { ... } })` — dropdown with curated list.
- **Weight**: `pane.addBinding(params, 'weight', { options: { Light: '300', Regular: '400', Bold: '700' } })` — availability depends on font.

The TEXT folder is added/removed when switching between text and non-text effects. The ControlPanel rebuild trigger already fires on effect change (controlSchema); it needs to also account for `selectedEffect.category` changing.

These are NOT `addControl()` controls — they're a separate system managed by the store. Text/font/weight changes trigger re-sampling via the `useTextSampling` hook.

**Mobile (<768px)**: ControlPanel is hidden on mobile. Text effects use the default text ("PRTCL") with default font. This is an acceptable limitation for Phase 3 — mobile is showcase mode, not editing mode.

## React Hook: useTextSampling

**File**: `src/text/useTextSampling.ts`

```typescript
export function useTextSampling(): void
```

Watches `textInput`, `textFont`, `textWeight`, `particleCount`, and `selectedEffect.category` from the store. On change (debounced 300ms), calls `sampleText()` and writes the result to `store.setTextPoints()`. When switching away from a text effect, sets `textPoints` to `null`. Also triggers font loading on first use.

Mounted in `EditorLayout.tsx` (outside the Canvas — it's a React hook, not an R3F hook).

## Store Changes

Add to Zustand store (`src/store.ts`), extending the `PrtclState` interface:

```typescript
// Text-to-particles state
textInput: string                    // default "PRTCL"
textFont: string                     // default "Montserrat"
textWeight: string                   // default "700" (Bold)
textPoints: Float32Array | null      // null when no text effect selected
textFontsLoaded: boolean             // false until Google Fonts <link> is injected + loaded
setTextInput: (text: string) => void
setTextFont: (font: string) => void
setTextWeight: (weight: string) => void
setTextPoints: (points: Float32Array | null) => void
setTextFontsLoaded: (loaded: boolean) => void
```

## ParticleSystem Integration

**File**: `src/engine/ParticleSystem.tsx`

There are **two** `compiledFn()` call sites in the render loop that currently pass `undefined` for textPoints:
1. **Main loop** (line ~152) — particles in the current effect
2. **Morph fallback** (line ~160) — disappearing particles during effect transitions

Both need updating:
```typescript
const textPts = selectedEffect.category === 'text' ? textPoints : undefined
// ... then in both call sites:
compiledFn(i, count, target, color, time, THREE, getControl, setInfo, textPts, ...)
```

Read `textPoints` from the store via `getState()` (zero React overhead, same pattern as other store reads in the hot loop).

## IsolatedParticleSystem Integration

**File**: `src/export/IsolatedParticleSystem.tsx`

Also passes `undefined` for textPoints (line ~51). Needs a `textPoints` prop:

```typescript
interface Props {
  compiledFn: CompiledEffectFn
  controls: Record<string, number>
  particleCount: number
  pointSize: number
  textPoints?: Float32Array | null  // NEW
}
```

Pass `textPts` instead of `undefined` in the `useFrame` loop. The ExportPreview will pass the baked textPoints from the store.

## Export Integration

### ExportPayload type (`src/export/types.ts`)

Add `textPoints?: Float32Array | null` to the `ExportPayload` interface. The ExportModal reads `textPoints` from the store and includes it in the payload.

### HTML Generator (`src/export/generators/html-generator.ts`)

For text effects, bake `textPoints` as an inline Float32Array:

```javascript
const TEXT_POINTS = new Float32Array([0.123, -0.456, 0, 0.789, ...]);
```

**Size consideration**: A 15,000-particle text cloud = 45,000 floats. At ~7 chars per float (rounded to 3 decimals), that's ~315KB of inline data. Mitigation:
- Round floats to 3 decimal places (reduces size by ~30%)
- Default export particle count for text effects at 8,000-10,000 (smaller than non-text defaults)
- The snippet is still self-contained and works, just larger

In the effect call, pass `TEXT_POINTS` instead of `undefined` for the textPoints parameter.

### React Generator (`src/export/generators/react-generator.ts`)

Same approach: bake textPoints as a constant `Float32Array`. Include as a prop default.

### Iframe Embed (`src/embed/EmbedView.tsx`)

URL params `text`, `font`, `weight` — the embed route loads the font dynamically and runs the sampler at load time. This means `EmbedView.tsx` needs `font-loader.ts` and `sampler.ts` as runtime dependencies. The embed route waits for the specific font to load (via `document.fonts.load()`) before sampling and rendering.

## 3 Text Effects

All effects: `category: 'text'`, use `textPoints` for target positions, fall back to origin if textPoints is undefined or too short. Must be registered in `ALL_PRESETS` in `src/effects/presets/index.ts`.

### 1. Text Scatter (`text-scatter.ts`)

Particles start in random scattered positions. Over time, they converge toward the text shape (lerp toward textPoints). Hold the formed text for a beat, then scatter outward again. Continuous loop.

**Preset baselines**: `particleCount: 12000`, `pointSize: 0.8`, `cameraPosition: [0, 0, 6]`, `cameraTarget: [0, 0, 0]`, `autoRotateSpeed: 0`.

**Controls**:
- `speed` — convergence/scatter speed (0.5-5.0, default 1.5)
- `scatter` — scatter radius (2-20, default 8)
- `holdTime` — seconds text stays formed (0.5-3.0, default 1.2)
- `colorSpeed` — color cycling speed (0.0-3.0, default 0.8)

**Visual**: Acid-pop color palette. Particles trail slightly during convergence. Formation creates a satisfying "snap" moment.

### 2. Text Wave (`text-wave.ts`)

Particles are positioned on the text points. Each particle oscillates in Z (depth) based on a sine wave function of its X position and time. Creates a 3D undulating text surface — like a flag made of particles.

**Preset baselines**: `particleCount: 15000`, `pointSize: 0.6`, `cameraPosition: [0, 0, 7]`, `cameraTarget: [0, 0, 0]`, `autoRotateSpeed: 0.3`.

**Controls**:
- `waveAmp` — wave amplitude in Z (0.1-3.0, default 0.8)
- `waveFreq` — wave frequency (0.5-5.0, default 2.0)
- `waveSpeed` — animation speed (0.1-3.0, default 1.0)
- `colorShift` — color varies with Z displacement (0.0-2.0, default 1.0)

**Visual**: Text is always readable but has a mesmerizing depth wave. Colors shift with displacement — peaks are warm (pink/yellow), troughs are cool (cyan/purple).

### 3. Text Dissolve (`text-dissolve.ts`)

Text starts fully formed. Particles gradually drift away from their target positions using pseudo-noise computed with layered trig functions: `sin(x * scale + time) * cos(y * scale + time * 0.7) * sin(z * scale * 0.5 + time * 1.3)`. No external noise library needed — this avoids bundle bloat and validator issues. The drift increases until the text is unrecognizable, then snaps back and reforms. Cycle repeats.

**Preset baselines**: `particleCount: 12000`, `pointSize: 0.7`, `cameraPosition: [0, 0, 6]`, `cameraTarget: [0, 0, 0]`, `autoRotateSpeed: 0`.

**Controls**:
- `dissolveSpeed` — how fast particles drift (0.1-3.0, default 0.8)
- `noiseScale` — noise granularity (0.5-5.0, default 2.0)
- `reformSpeed` — how fast text snaps back (0.5-5.0, default 2.0)
- `intensity` — max drift distance (0.5-5.0, default 2.0)

**Visual**: Ethereal — like watching text made of sand being blown by wind, then magically reassembling. Color based on drift distance from target.

## TypeScript Interfaces

**File**: `src/text/types.ts`

```typescript
export interface FontDefinition {
  family: string
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono'
  weights: number[]       // e.g., [300, 400, 700]
  vibe: string            // one-line description for UI tooltip
}

export interface TextConfig {
  text: string
  font: string
  weight: string
}
```

## File Architecture

```
src/text/
  sampler.ts            — Canvas text sampling, normalization, resampling
  font-loader.ts        — Google Fonts lazy loading + per-font readiness detection
  fonts.ts              — Curated font list (FontDefinition[])
  types.ts              — TextConfig, FontDefinition interfaces
  useTextSampling.ts    — Hook: watches store, debounces, triggers resampling

src/effects/presets/
  text-scatter.ts       — Effect 1: converge/scatter loop
  text-wave.ts          — Effect 2: 3D sine wave
  text-dissolve.ts      — Effect 3: noise dissolve/reform
```

**Integration points** (existing files to modify):
- `src/store.ts` — add text state fields to PrtclState interface + store
- `src/engine/ParticleSystem.tsx` — pass textPoints at both compiledFn call sites
- `src/export/IsolatedParticleSystem.tsx` — add textPoints prop
- `src/export/types.ts` — add textPoints to ExportPayload
- `src/export/generators/html-generator.ts` — bake textPoints for text effects
- `src/export/generators/react-generator.ts` — bake textPoints for text effects
- `src/embed/EmbedView.tsx` — add font loading + sampling for text URL params
- `src/editor/ControlPanel.tsx` — add TEXT Tweakpane folder for text effects
- `src/editor/EditorLayout.tsx` — mount useTextSampling hook
- `src/effects/presets/index.ts` — register 3 new text effects in ALL_PRESETS

## What Is NOT in Phase 3

- User-authored text effects (custom code that uses textPoints) — would require editor UI changes, deferred.
- 3D extruded text (Three.js TextGeometry) — different approach, not particle-based.
- Text animation timeline (morph between different texts) — cool but scope creep.
- More than 12 fonts — keep it curated, expandable later.
- Mobile text editing — mobile is showcase mode; text effects use default "PRTCL".

## Performance Notes

- Canvas sampling takes ~5-20ms depending on text length and font. Debounced so it's imperceptible.
- `textPoints` is a single Float32Array allocation, reused across frames. Zero GC pressure in the hot loop.
- Font loading is ~50-200KB total for all 12 fonts. One-time cost on first text effect selection.
- Export baked textPoints at 3 decimal precision keeps snippet size manageable (~200-350KB for 10-15k particles).
