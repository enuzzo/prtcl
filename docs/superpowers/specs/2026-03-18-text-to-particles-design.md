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

Extract and generalize the `sampleTextPointsSorted` function from `SplashScreen.tsx` into a reusable module.

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
1. Create offscreen canvas (sized to fit text at ~120px font size).
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
3. Use `document.fonts.ready` promise to know when fonts are available.
4. Until fonts load, the sampler uses the fallback font stack (Inconsolata/system monospace).
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

**Export note**: Exported HTML/React snippets include the Google Fonts `<link>` tag for the specific font used. The font is needed at runtime since the text is pre-sampled but the font name appears in comments for reference.

Wait — actually, exports bake the `textPoints` as a static Float32Array, so the font is NOT needed at runtime in the export. The font name is included only as a comment for documentation.

## Text Input UI

When a text effect (`category: 'text'`) is selected, the ControlPanel shows a **TEXT** folder above the EFFECT folder:

```
┌─ TEXT ─────────────────────────────┐
│  Text     [PRTCL          ]       │
│  Font     [Montserrat      ▾]     │
│  Weight   [Bold            ▾]     │
└────────────────────────────────────┘
┌─ EFFECT ───────────────────────────┐
│  Speed      [====●===]            │
│  ...                               │
└────────────────────────────────────┘
```

**Controls**:
- **Text** (`TextInput`): Free text input, default "PRTCL". Max ~20 characters (longer text loses resolution at reasonable particle counts).
- **Font** (`Dropdown`): Curated list of 12 Google Fonts.
- **Weight** (`Dropdown`): Light (300), Regular (400), Bold (700) — availability depends on font.

These are NOT `addControl()` controls — they're a separate system managed by the store. The ControlPanel detects `selectedEffect.category === 'text'` and renders the text folder. Text/font/weight changes trigger re-sampling via a React hook.

## React Hook: useTextSampling

**File**: `src/text/useTextSampling.ts`

```typescript
export function useTextSampling(): void
```

Watches `textInput`, `textFont`, `textWeight`, and `particleCount` from the store. On change (debounced 300ms), calls `sampleText()` and writes the result to `store.setTextPoints()`. Also triggers font loading on first use.

This hook is mounted once in `EditorLayout.tsx` (or `Viewport.tsx`). It's a side-effect hook with no return value.

## Store Changes

Add to Zustand store (`src/store.ts`):

```typescript
// Text-to-particles state
textInput: string                    // default "PRTCL"
textFont: string                     // default "Montserrat"
textWeight: string                   // default "700" (Bold)
textPoints: Float32Array | null      // null when no text effect selected
setTextInput: (text: string) => void
setTextFont: (font: string) => void
setTextWeight: (weight: string) => void
setTextPoints: (points: Float32Array | null) => void
```

## ParticleSystem Integration

**File**: `src/engine/ParticleSystem.tsx`

Change from:
```typescript
compiledFn(i, count, target, color, time, THREE, getControl, setInfo, undefined, ...)
```

To:
```typescript
const textPts = selectedEffect.category === 'text' ? textPoints : undefined
compiledFn(i, count, target, color, time, THREE, getControl, setInfo, textPts, ...)
```

Read `textPoints` from the store via `getState()` (zero React overhead, same pattern as other store reads in the hot loop).

## 3 Text Effects

All effects: `category: 'text'`, use `textPoints` for target positions, fall back to origin if textPoints is undefined or too short.

### 1. Text Scatter (`text-scatter.ts`)

Particles start in random scattered positions. Over time, they converge toward the text shape (lerp toward textPoints). Hold the formed text for a beat, then scatter outward again. Continuous loop.

**Controls**:
- `speed` — convergence/scatter speed (0.5-5.0, default 1.5)
- `scatter` — scatter radius (2-20, default 8)
- `holdTime` — seconds text stays formed (0.5-3.0, default 1.2)
- `colorSpeed` — color cycling speed (0.0-3.0, default 0.8)

**Visual**: Acid-pop color palette. Particles trail slightly during convergence. Formation creates a satisfying "snap" moment.

### 2. Text Wave (`text-wave.ts`)

Particles are positioned on the text points. Each particle oscillates in Z (depth) based on a sine wave function of its X position and time. Creates a 3D undulating text surface — like a flag made of particles.

**Controls**:
- `waveAmp` — wave amplitude in Z (0.1-3.0, default 0.8)
- `waveFreq` — wave frequency (0.5-5.0, default 2.0)
- `waveSpeed` — animation speed (0.1-3.0, default 1.0)
- `colorShift` — color varies with Z displacement (0.0-2.0, default 1.0)

**Visual**: Text is always readable but has a mesmerizing depth wave. Colors shift with displacement — peaks are warm (pink/yellow), troughs are cool (cyan/purple).

### 3. Text Dissolve (`text-dissolve.ts`)

Text starts fully formed. Particles gradually drift away from their target positions using 3D noise (Simplex-style, computed with basic trig). The drift increases until the text is unrecognizable, then snaps back and reforms. Cycle repeats.

**Controls**:
- `dissolveSpeed` — how fast particles drift (0.1-3.0, default 0.8)
- `noiseScale` — noise granularity (0.5-5.0, default 2.0)
- `reformSpeed` — how fast text snaps back (0.5-5.0, default 2.0)
- `intensity` — max drift distance (0.5-5.0, default 2.0)

**Visual**: Ethereal — like watching text made of sand being blown by wind, then magically reassembling. Color based on drift distance from target.

## File Architecture

```
src/text/
  sampler.ts            — Canvas text sampling, normalization, resampling
  font-loader.ts        — Google Fonts lazy loading + readiness detection
  fonts.ts              — Curated font list with categories and weight options
  types.ts              — TextConfig, FontDefinition interfaces
  useTextSampling.ts    — Hook: watches store, debounces, triggers resampling

src/effects/presets/
  text-scatter.ts       — Effect 1: converge/scatter loop
  text-wave.ts          — Effect 2: 3D sine wave
  text-dissolve.ts      — Effect 3: noise dissolve/reform
```

## Export Considerations

- **HTML export**: `textPoints` baked as inline `Float32Array` (pre-sampled, static text). No font loading needed at runtime. The exported snippet is self-contained.
- **React export**: `textPoints` baked as a constant. Could expose as a prop for dynamic re-sampling, but Phase 3 keeps it simple with static baked points.
- **Iframe embed**: URL param `text=HELLO&font=Montserrat&weight=700` — the embed route runs the sampler at load time. Requires font loading in the embed route too.

## What Is NOT in Phase 3

- User-authored text effects (custom code that uses textPoints) — would require editor UI changes, deferred.
- 3D extruded text (Three.js TextGeometry) — different approach, not particle-based.
- Text animation timeline (morph between different texts) — cool but scope creep.
- More than 12 fonts — keep it curated, expandable later.

## Performance Notes

- Canvas sampling takes ~5-20ms depending on text length and font. Debounced so it's imperceptible.
- `textPoints` is a single Float32Array allocation, reused across frames. Zero GC pressure in the hot loop.
- Font loading is ~50-200KB total for all 12 fonts. One-time cost on first text effect selection.
