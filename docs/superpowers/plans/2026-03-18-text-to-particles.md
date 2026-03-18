# Text-to-Particles Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users type any text and see it rendered as a particle cloud with 3 text effects and Google Fonts.

**Architecture:** Canvas text sampling produces a Float32Array of 3D points. Effects read these via the existing `textPoints` parameter (already wired into the compiler). Tweakpane text folder in ControlPanel controls text/font/weight. Google Fonts loaded lazily on first text effect selection.

**Tech Stack:** React 19, TypeScript, Zustand, Tweakpane, Google Fonts CSS API, Canvas 2D (offscreen sampling), Three.js/R3F

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `src/text/types.ts` | FontDefinition, TextConfig interfaces |
| `src/text/fonts.ts` | Curated font list (12 fonts) |
| `src/text/font-loader.ts` | Lazy Google Fonts `<link>` injection + per-font readiness |
| `src/text/sampler.ts` | Canvas text → Float32Array (measure, render, scan, normalize, resample, sort) |
| `src/text/useTextSampling.ts` | Hook: debounced store watcher → sampleText → store.setTextPoints |
| `src/effects/presets/text-scatter.ts` | Effect: converge/scatter loop |
| `src/effects/presets/text-wave.ts` | Effect: 3D sine wave text |
| `src/effects/presets/text-dissolve.ts` | Effect: noise dissolve/reform |

### Modified Files
| File | Change |
|------|--------|
| `src/store.ts` | Add text state to PrtclState + initial values + setters |
| `src/engine/ParticleSystem.tsx` | Pass `textPoints` at both compiledFn call sites (lines ~152, ~160) |
| `src/editor/ControlPanel.tsx` | Add TEXT Tweakpane folder when `category === 'text'` |
| `src/editor/EditorLayout.tsx` | Mount `useTextSampling()` hook |
| `src/effects/presets/index.ts` | Register 3 new text effects in ALL_PRESETS |
| `src/export/IsolatedParticleSystem.tsx` | Add `textPoints` prop, pass to compiledFn |
| `src/export/types.ts` | Add `textPoints` to ExportPayload |
| `src/export/generators/html-generator.ts` | Bake textPoints inline for text effects |
| `src/export/generators/react-generator.ts` | Bake textPoints inline for text effects |
| `src/embed/EmbedView.tsx` | Support `text`/`font`/`weight` URL params with runtime sampling |

---

## Task 1: Text Types & Font List

**Files:**
- Create: `src/text/types.ts`
- Create: `src/text/fonts.ts`

- [ ] **Step 1: Create text types**

```typescript
// src/text/types.ts
export interface FontDefinition {
  family: string
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono'
  weights: number[]
  vibe: string
}

export interface TextConfig {
  text: string
  font: string
  weight: string
}
```

- [ ] **Step 2: Create curated font list**

```typescript
// src/text/fonts.ts
import type { FontDefinition } from './types'

export const CURATED_FONTS: FontDefinition[] = [
  { family: 'Montserrat', category: 'sans', weights: [300, 400, 700], vibe: 'Clean, modern' },
  { family: 'Inter', category: 'sans', weights: [300, 400, 700], vibe: 'Neutral, readable' },
  { family: 'Bebas Neue', category: 'display', weights: [400], vibe: 'Bold, condensed' },
  { family: 'Oswald', category: 'sans', weights: [300, 400, 700], vibe: 'Strong, editorial' },
  { family: 'Playfair Display', category: 'serif', weights: [400, 700], vibe: 'Elegant' },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 700], vibe: 'Classic, light' },
  { family: 'Righteous', category: 'display', weights: [400], vibe: 'Fun, rounded' },
  { family: 'Pacifico', category: 'handwriting', weights: [400], vibe: 'Script, playful' },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400], vibe: 'Handwritten, rough' },
  { family: 'Bungee', category: 'display', weights: [400], vibe: 'Blocky, bold' },
  { family: 'Space Mono', category: 'mono', weights: [400, 700], vibe: 'Technical' },
  { family: 'Fira Code', category: 'mono', weights: [300, 400, 700], vibe: 'Developer' },
]

/** Build the Google Fonts CSS API URL for all curated fonts */
export function buildGoogleFontsUrl(): string {
  const families = CURATED_FONTS.map((f) => {
    const weights = f.weights.join(';')
    return `family=${f.family.replace(/ /g, '+')}:wght@${weights}`
  })
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/text/types.ts src/text/fonts.ts
git commit -m "feat(text): add font definitions and curated font list"
```

---

## Task 2: Font Loader

**Files:**
- Create: `src/text/font-loader.ts`

- [ ] **Step 1: Implement font loader**

```typescript
// src/text/font-loader.ts
import { buildGoogleFontsUrl } from './fonts'

let linkInjected = false

/** Inject the Google Fonts <link> tag (once). */
export function ensureFontsInjected(): void {
  if (linkInjected) return
  linkInjected = true
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = buildGoogleFontsUrl()
  document.head.appendChild(link)
}

/**
 * Wait for a specific font to be available.
 * Uses document.fonts.load() which returns a promise for the specific font face.
 * Falls back immediately if the Font Loading API is not available.
 */
export async function waitForFont(family: string, weight: string): Promise<boolean> {
  ensureFontsInjected()
  if (!document.fonts?.load) return false
  try {
    const result = await document.fonts.load(`${weight} 120px "${family}"`)
    return result.length > 0
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/text/font-loader.ts
git commit -m "feat(text): add lazy Google Fonts loader with per-font readiness"
```

---

## Task 3: Canvas Text Sampler

**Files:**
- Create: `src/text/sampler.ts`

- [ ] **Step 1: Implement the sampler**

Core algorithm: measure text → create offscreen canvas → render text → scan pixels → normalize to world coords → resample to target count → X-sort → return Float32Array.

```typescript
// src/text/sampler.ts

/**
 * Sample text into a Float32Array of 3D points (x, y, z interleaved).
 * Uses an offscreen canvas to render text, scans pixel alpha,
 * normalizes to world-space coordinates centered at origin.
 */
export function sampleText(
  text: string,
  font: string,
  weight: string,
  targetCount: number,
): Float32Array {
  if (!text.trim()) return new Float32Array(targetCount * 3)

  const fontSize = 120
  const fontStr = `${weight} ${fontSize}px "${font}", "Inconsolata", monospace`

  // Measure text to size canvas
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = fontStr
  const metrics = measure.measureText(text)
  const textW = Math.ceil(metrics.width) + fontSize  // padding
  const textH = fontSize * 2

  // Render text on offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = textW
  canvas.height = textH
  const ctx = canvas.getContext('2d')!
  ctx.font = fontStr
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, textW / 2, textH / 2)

  // Scan pixels — collect positions where alpha > 128
  const imageData = ctx.getImageData(0, 0, textW, textH)
  const pixels = imageData.data
  const step = 2
  const raw: [number, number][] = []

  for (let y = 0; y < textH; y += step) {
    for (let x = 0; x < textW; x += step) {
      const alpha = pixels[(y * textW + x) * 4 + 3]
      if (alpha > 128) raw.push([x, y])
    }
  }

  if (raw.length === 0) return new Float32Array(targetCount * 3)

  // Normalize to world space: center at origin, scale to [-spread, spread]
  const spread = 4
  const aspect = textW / textH
  const scaleX = (spread * 2 * aspect) / textW
  const scaleY = (spread * 2) / textH
  const cx = textW / 2
  const cy = textH / 2

  const normalized = raw.map(([x, y]) => [
    (x - cx) * scaleX,
    -(y - cy) * scaleY,  // flip Y (canvas Y is down, world Y is up)
  ] as [number, number])

  // X-sort for spatial coherence
  normalized.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])

  // Resample to target count
  const result = new Float32Array(targetCount * 3)
  const n = normalized.length

  for (let i = 0; i < targetCount; i++) {
    const srcIdx = i < n
      ? i
      : Math.floor(Math.random() * n)  // jitter-duplicate
    const [px, py] = normalized[srcIdx]!
    const jitterX = i < n ? 0 : (Math.random() - 0.5) * 0.05
    const jitterY = i < n ? 0 : (Math.random() - 0.5) * 0.05
    result[i * 3]     = px + jitterX
    result[i * 3 + 1] = py + jitterY
    result[i * 3 + 2] = 0  // flat Z
  }

  return result
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/text/sampler.ts
git commit -m "feat(text): add canvas text sampler with normalization and resampling"
```

---

## Task 4: Store + ParticleSystem Integration

**Files:**
- Modify: `src/store.ts`
- Modify: `src/engine/ParticleSystem.tsx`

- [ ] **Step 1: Add text state to store**

Add to `PrtclState` interface (after the `exportModalOpen` field):
```typescript
// Text-to-particles
textInput: string
textFont: string
textWeight: string
textPoints: Float32Array | null
textFontsLoaded: boolean
```

Add setters to the interface:
```typescript
setTextInput: (text: string) => void
setTextFont: (font: string) => void
setTextWeight: (weight: string) => void
setTextPoints: (points: Float32Array | null) => void
setTextFontsLoaded: (loaded: boolean) => void
```

Add initial values in the `create` call:
```typescript
textInput: 'PRTCL',
textFont: 'Montserrat',
textWeight: '700',
textPoints: null,
textFontsLoaded: false,
setTextInput: (text) => set({ textInput: text }),
setTextFont: (font) => set({ textFont: font }),
setTextWeight: (weight) => set({ textWeight: weight }),
setTextPoints: (points) => set({ textPoints: points }),
setTextFontsLoaded: (loaded) => set({ textFontsLoaded: loaded }),
```

- [ ] **Step 2: Update ParticleSystem to pass textPoints**

In `src/engine/ParticleSystem.tsx`, inside the `useFrame` callback, after reading other store values, add:
```typescript
const textPoints = state.textPoints
const textPts = state.selectedEffect?.category === 'text' ? textPoints : undefined
```

Then replace `undefined` (the 9th argument) with `textPts` in **both** compiledFn calls:
- Line ~152 (main loop): `compiledFn(i, count, target, color, time, THREE, getControl, setInfo, textPts, camX, ...)`
- Line ~160 (morph fallback): `compiledFn(i % count, count, target, color, time, THREE, getControl, setInfo, textPts, camX, ...)`

- [ ] **Step 3: Type check + run tests**

Run: `npx tsc -b --noEmit && npx vitest run`
Expected: PASS (no existing tests should break — textPts is undefined for non-text effects, same as before)

- [ ] **Step 4: Commit**

```bash
git add src/store.ts src/engine/ParticleSystem.tsx
git commit -m "feat(text): add text state to store, pass textPoints in ParticleSystem"
```

---

## Task 5: useTextSampling Hook

**Files:**
- Create: `src/text/useTextSampling.ts`
- Modify: `src/editor/EditorLayout.tsx`

- [ ] **Step 1: Implement the hook**

```typescript
// src/text/useTextSampling.ts
import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { sampleText } from './sampler'
import { waitForFont, ensureFontsInjected } from './font-loader'

export function useTextSampling(): void {
  const textInput = useStore((s) => s.textInput)
  const textFont = useStore((s) => s.textFont)
  const textWeight = useStore((s) => s.textWeight)
  const particleCount = useStore((s) => s.particleCount)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const isTextEffect = selectedEffect?.category === 'text'

  useEffect(() => {
    // Clear textPoints when switching away from text effects
    if (!isTextEffect) {
      useStore.getState().setTextPoints(null)
      return
    }

    // Debounce sampling
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      // Ensure fonts are loading
      ensureFontsInjected()
      await waitForFont(textFont, textWeight)
      useStore.getState().setTextFontsLoaded(true)

      // Sample and store
      const points = sampleText(textInput, textFont, textWeight, particleCount)
      useStore.getState().setTextPoints(points)
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [isTextEffect, textInput, textFont, textWeight, particleCount])
}
```

- [ ] **Step 2: Mount in EditorLayout**

In `src/editor/EditorLayout.tsx`, add import:
```typescript
import { useTextSampling } from '../text/useTextSampling'
```

Inside the `EditorLayout` component body (before the return), add:
```typescript
useTextSampling()
```

- [ ] **Step 3: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/text/useTextSampling.ts src/editor/EditorLayout.tsx
git commit -m "feat(text): add useTextSampling hook with debounced sampling"
```

---

## Task 6: First Text Effect — Text Wave

The simplest of the three — particles sit on text points and oscillate in Z. Gets text rendering visible immediately.

**Files:**
- Create: `src/effects/presets/text-wave.ts`
- Modify: `src/effects/presets/index.ts`

- [ ] **Step 1: Create the effect**

```typescript
// src/effects/presets/text-wave.ts
import type { Effect } from '../../engine/types'

export const textWave: Effect = {
  id: 'text-wave',
  slug: 'text-wave',
  name: 'Text Wave',
  description: 'Your words, riding a sine wave through 3D space. Like a flag made of light.',
  category: 'text',
  tags: ['text', 'wave', 'sine', '3d'],
  author: 'PRTCL Team',
  particleCount: 15000,
  pointSize: 0.6,
  autoRotateSpeed: 0.3,
  cameraPosition: [0, 0, 7] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  code: `
var waveAmp = addControl("waveAmp", "Wave Amplitude", 0.1, 3.0, 0.8);
var waveFreq = addControl("waveFreq", "Wave Frequency", 0.5, 5.0, 2.0);
var waveSpeed = addControl("waveSpeed", "Wave Speed", 0.1, 3.0, 1.0);
var colorShift = addControl("colorShift", "Color Shift", 0.0, 2.0, 1.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Sine wave displacement in Z based on X position and time
  var phase = tx * waveFreq + time * waveSpeed;
  var zDisp = Math.sin(phase) * waveAmp;

  // Secondary wave for visual richness
  var phase2 = ty * waveFreq * 0.7 + time * waveSpeed * 1.3;
  var zDisp2 = Math.sin(phase2) * waveAmp * 0.3;

  target.set(tx, ty, zDisp + zDisp2);

  // Color based on Z displacement — warm peaks, cool troughs
  var normalizedZ = (zDisp + waveAmp) / (waveAmp * 2);
  var hue = 0.85 - normalizedZ * colorShift * 0.4; // pink→cyan range
  color.setHSL(hue, 0.9, 0.55 + normalizedZ * 0.2);
} else {
  // Fallback: origin with dim color
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
```

- [ ] **Step 2: Register in ALL_PRESETS**

In `src/effects/presets/index.ts`, add:
```typescript
import { textWave } from './text-wave'
```
And append to the array:
```typescript
export const ALL_PRESETS: Effect[] = [frequency, hopf, nebula, starfield, blackhole, storm, cliffordTorus, magneticDust, fibonacciCrystal, paperFleet, textWave]
```

- [ ] **Step 3: Type check + test manually**

Run: `npx tsc -b --noEmit`
Then open `http://localhost:5173`, select "Text Wave" from the effect browser (under Text category). You should see "PRTCL" rendered as particles with a sine wave animation.

- [ ] **Step 4: Commit**

```bash
git add src/effects/presets/text-wave.ts src/effects/presets/index.ts
git commit -m "feat(text): add Text Wave effect — first text-to-particles preset"
```

---

## Task 7: Text Scatter Effect

**Files:**
- Create: `src/effects/presets/text-scatter.ts`
- Modify: `src/effects/presets/index.ts`

- [ ] **Step 1: Create the effect**

Particles converge from scattered positions to text, hold, then scatter out. Uses time-based phase cycling.

```typescript
// src/effects/presets/text-scatter.ts
import type { Effect } from '../../engine/types'

export const textScatter: Effect = {
  id: 'text-scatter',
  slug: 'text-scatter',
  name: 'Text Scatter',
  description: 'Chaos finds meaning. Particles swarm from noise into words, hold the shape, then explode again.',
  category: 'text',
  tags: ['text', 'scatter', 'converge', 'formation'],
  author: 'PRTCL Team',
  particleCount: 12000,
  pointSize: 0.8,
  autoRotateSpeed: 0,
  cameraPosition: [0, 0, 6] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  code: `
var speed = addControl("speed", "Speed", 0.5, 5.0, 1.5);
var scatter = addControl("scatter", "Scatter Radius", 2.0, 20.0, 8.0);
var holdTime = addControl("holdTime", "Hold Time", 0.5, 3.0, 1.2);
var colorSpeed = addControl("colorSpeed", "Color Speed", 0.0, 3.0, 0.8);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Deterministic scatter position per particle (seeded by index)
  var seed1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  var seed2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
  var seed3 = Math.sin(i * 419.2 + 371.9) * 43758.5453;
  var sx = (seed1 - Math.floor(seed1) - 0.5) * scatter * 2;
  var sy = (seed2 - Math.floor(seed2) - 0.5) * scatter * 2;
  var sz = (seed3 - Math.floor(seed3) - 0.5) * scatter;

  // Phase cycle: converge → hold → scatter → hold-scattered
  var cycleLen = 2.0 / speed + holdTime + 2.0 / speed + 0.5;
  var phase = (time * speed) % cycleLen;
  var convergeEnd = 2.0 / speed;
  var holdEnd = convergeEnd + holdTime;
  var scatterEnd = holdEnd + 2.0 / speed;

  var t;
  if (phase < convergeEnd) {
    // Converging: scatter → text
    t = phase / convergeEnd;
    t = t * t * (3.0 - 2.0 * t); // smoothstep
  } else if (phase < holdEnd) {
    // Holding formed text
    t = 1.0;
  } else if (phase < scatterEnd) {
    // Scattering: text → scatter
    t = 1.0 - (phase - holdEnd) / (scatterEnd - holdEnd);
    t = t * t * (3.0 - 2.0 * t);
  } else {
    // Brief hold in scattered state
    t = 0.0;
  }

  target.set(
    sx + (tx - sx) * t,
    sy + (ty - sy) * t,
    sz * (1.0 - t)
  );

  // Color: shifts with time and formation state
  var hue = (i / count * 0.5 + time * colorSpeed * 0.1) % 1.0;
  var sat = 0.7 + t * 0.3;
  var lum = 0.3 + t * 0.35;
  color.setHSL(hue, sat, lum);
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
```

- [ ] **Step 2: Register in ALL_PRESETS**

Add import and append `textScatter` to the array.

- [ ] **Step 3: Type check + test manually**

Run: `npx tsc -b --noEmit`. Open browser, select "Text Scatter". Particles should converge to "PRTCL", hold, then scatter.

- [ ] **Step 4: Commit**

```bash
git add src/effects/presets/text-scatter.ts src/effects/presets/index.ts
git commit -m "feat(text): add Text Scatter effect — converge/hold/scatter cycle"
```

---

## Task 8: Text Dissolve Effect

**Files:**
- Create: `src/effects/presets/text-dissolve.ts`
- Modify: `src/effects/presets/index.ts`

- [ ] **Step 1: Create the effect**

Pseudo-noise via layered trig (no external library).

```typescript
// src/effects/presets/text-dissolve.ts
import type { Effect } from '../../engine/types'

export const textDissolve: Effect = {
  id: 'text-dissolve',
  slug: 'text-dissolve',
  name: 'Text Dissolve',
  description: 'Sand that remembers its shape. Particles drift away into noise, then snap back. Ethereal.',
  category: 'text',
  tags: ['text', 'dissolve', 'noise', 'reform'],
  author: 'PRTCL Team',
  particleCount: 12000,
  pointSize: 0.7,
  autoRotateSpeed: 0,
  cameraPosition: [0, 0, 6] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  code: `
var dissolveSpeed = addControl("dissolveSpeed", "Dissolve Speed", 0.1, 3.0, 0.8);
var noiseScale = addControl("noiseScale", "Noise Scale", 0.5, 5.0, 2.0);
var reformSpeed = addControl("reformSpeed", "Reform Speed", 0.5, 5.0, 2.0);
var intensity = addControl("intensity", "Intensity", 0.5, 5.0, 2.0);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // Phase: dissolve out → reform back (sawtooth with smoothstep)
  var cycle = 4.0 / dissolveSpeed;
  var phase = (time * dissolveSpeed) % cycle;
  var halfCycle = cycle * 0.5;
  var drift;
  if (phase < halfCycle) {
    drift = phase / halfCycle; // 0→1 dissolve
    drift = drift * drift; // ease in
  } else {
    drift = 1.0 - (phase - halfCycle) / halfCycle; // 1→0 reform
    drift = drift * drift;
  }

  // Pseudo-noise displacement (layered trig, no library)
  var nx = Math.sin(tx * noiseScale + time * 0.7) * Math.cos(ty * noiseScale * 0.8 + time * 0.5);
  var ny = Math.cos(tx * noiseScale * 0.9 + time * 0.6) * Math.sin(ty * noiseScale + time * 0.8);
  var nz = Math.sin(tx * noiseScale * 0.5 + time * 1.3) * Math.cos(ty * noiseScale * 1.1 + time * 0.4);

  // Per-particle variation using index as seed
  var pSeed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  var pVar = pSeed - Math.floor(pSeed); // 0-1
  var driftScale = drift * intensity * (0.5 + pVar);

  target.set(
    tx + nx * driftScale,
    ty + ny * driftScale,
    nz * driftScale
  );

  // Color: hue shifts with drift distance, desaturates as it dissolves
  var driftDist = Math.sqrt(nx * nx + ny * ny + nz * nz) * driftScale;
  var hue = (0.8 + driftDist * 0.1) % 1.0;
  var sat = 0.9 - drift * 0.4;
  var lum = 0.5 + drift * 0.15;
  color.setHSL(hue, sat, lum);
} else {
  target.set(0, 0, 0);
  color.setHSL(0.8, 0.5, 0.1);
}
`,
}
```

- [ ] **Step 2: Register in ALL_PRESETS**

Add import and append `textDissolve` to the array.

- [ ] **Step 3: Type check + test manually**

Run: `npx tsc -b --noEmit`. Open browser, select "Text Dissolve". Text forms, drifts into noise, reforms.

- [ ] **Step 4: Commit**

```bash
git add src/effects/presets/text-dissolve.ts src/effects/presets/index.ts
git commit -m "feat(text): add Text Dissolve effect — noise drift/reform cycle"
```

---

## Task 9: ControlPanel TEXT Folder

**Files:**
- Modify: `src/editor/ControlPanel.tsx`

- [ ] **Step 1: Add TEXT folder for text effects**

In the `useEffect` that builds the Tweakpane, after the Camera folder and before the Effect controls folder, add a TEXT folder conditional on the selected effect's category:

```typescript
// ── Text controls (only for text effects) ────────────
const selectedEffect = useStore.getState().selectedEffect
if (selectedEffect?.category === 'text') {
  const textFolder = pane.addFolder({ title: 'Text' })
  const { textInput, textFont, textWeight } = useStore.getState()

  // Build font options object { 'Montserrat': 'Montserrat', ... }
  const fontOptions: Record<string, string> = {}
  // Import CURATED_FONTS at top of file
  for (const f of CURATED_FONTS) fontOptions[f.family] = f.family

  const textParams = { text: textInput, font: textFont, weight: textWeight }

  textFolder.addBinding(textParams, 'text', { label: 'Text' })
    .on('change', (ev: { value: string }) => useStore.getState().setTextInput(ev.value))

  textFolder.addBinding(textParams, 'font', { label: 'Font', options: fontOptions })
    .on('change', (ev: { value: string }) => useStore.getState().setTextFont(ev.value))

  // Weight options — filter by selected font's available weights
  const currentFontDef = CURATED_FONTS.find(f => f.family === textFont)
  const weightOptions: Record<string, string> = {}
  for (const w of (currentFontDef?.weights ?? [300, 400, 700])) {
    const label = w <= 300 ? 'Light' : w <= 400 ? 'Regular' : 'Bold'
    weightOptions[label] = String(w)
  }

  textFolder.addBinding(textParams, 'weight', { label: 'Weight', options: weightOptions })
    .on('change', (ev: { value: string }) => useStore.getState().setTextWeight(ev.value))
}
```

Add the import at the top of the file:
```typescript
import { CURATED_FONTS } from '../text/fonts'
```

Also update the `controlSchema` memo to include the selected effect category, so the pane rebuilds when switching between text and non-text effects:
```typescript
const selectedEffectId = useStore((s) => s.selectedEffect?.id)

const controlSchema = useMemo(
  () => `${selectedEffectId}|${controls.map((c) => `${c.id}:${c.min}:${c.max}:${c.initial}`).join('|')}`,
  [controls, selectedEffectId],
)
```

- [ ] **Step 2: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 3: Test manually**

Select a text effect → TEXT folder appears with text input, font dropdown, weight dropdown. Change text → particles re-form. Switch to a non-text effect → TEXT folder disappears.

- [ ] **Step 4: Commit**

```bash
git add src/editor/ControlPanel.tsx
git commit -m "feat(text): add Tweakpane TEXT folder for text effects"
```

---

## Task 10: Export Integration

**Files:**
- Modify: `src/export/types.ts`
- Modify: `src/export/ExportModal.tsx`
- Modify: `src/export/IsolatedParticleSystem.tsx`
- Modify: `src/export/generators/html-generator.ts`
- Modify: `src/export/generators/react-generator.ts`

- [ ] **Step 1: Add textPoints to ExportPayload**

In `src/export/types.ts`, add to `ExportPayload`:
```typescript
textPoints?: Float32Array | null
```

- [ ] **Step 2: Pass textPoints from ExportModal**

In `src/export/ExportModal.tsx`, read textPoints from store and include in payload:
```typescript
const textPoints = useStore((s) => s.textPoints)
// ... in payload:
textPoints: selectedEffect.category === 'text' ? textPoints : undefined,
```

- [ ] **Step 3: Update IsolatedParticleSystem**

Add `textPoints?: Float32Array | null` to the Props interface. Pass it as the 9th argument in the compiledFn call instead of `undefined`.

- [ ] **Step 4: Update ExportPreview**

Pass `textPoints` from payload through to `IsolatedParticleSystem`:
```typescript
textPoints={payload?.textPoints}
```

- [ ] **Step 5: Update HTML generator**

For text effects, bake the textPoints as an inline array before the effect function call:
```typescript
// When effect category is 'text' and textPoints exists:
const textPointsStr = payload.textPoints
  ? `const TEXT_POINTS = new Float32Array([${Array.from(payload.textPoints).map(v => v.toFixed(3)).join(',')}]);`
  : ''
// Pass TEXT_POINTS (or undefined) as the 9th arg in the effectFn call
```

- [ ] **Step 6: Update React generator**

Same approach — bake textPoints as a const.

- [ ] **Step 7: Type check + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/export/types.ts src/export/ExportModal.tsx src/export/IsolatedParticleSystem.tsx src/export/generators/html-generator.ts src/export/generators/react-generator.ts src/export/ExportPreview.tsx
git commit -m "feat(text): add textPoints to export system — baked in HTML/React, preview support"
```

---

## Task 11: Embed Route Text Support

**Files:**
- Modify: `src/embed/EmbedView.tsx`

- [ ] **Step 1: Add text URL params support**

When `text`, `font`, and `weight` URL params are present, load the font and sample the text at load time:

```typescript
import { sampleText } from '../text/sampler'
import { waitForFont, ensureFontsInjected } from '../text/font-loader'

// In the component:
const textParam = params.get('text')
const fontParam = params.get('font') || 'Montserrat'
const weightParam = params.get('weight') || '700'
const isTextEffect = effect.category === 'text'

const [textPoints, setTextPoints] = useState<Float32Array | null>(null)

useEffect(() => {
  if (!isTextEffect) return
  const text = textParam || 'PRTCL'
  ensureFontsInjected()
  waitForFont(fontParam, weightParam).then(() => {
    setTextPoints(sampleText(text, fontParam, weightParam, effectiveParticleCount))
  })
}, [isTextEffect, textParam, fontParam, weightParam, effectiveParticleCount])
```

Pass `textPoints` to the particle system in the embed canvas.

- [ ] **Step 2: Update iframe generator**

In `src/export/generators/iframe-generator.ts`, when the effect is a text effect, add `text`, `font`, and `weight` params to the URL:
```typescript
if (payload.effect.category === 'text') {
  const { textInput, textFont, textWeight } = /* read from store or settings */
  params.set('text', textInput)
  params.set('font', textFont)
  params.set('weight', textWeight)
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/embed/EmbedView.tsx src/export/generators/iframe-generator.ts
git commit -m "feat(text): support text effects in embed route and iframe generator"
```

---

## Task 12: Final Verification + CLAUDE.md Update

- [ ] **Step 1: Run full test + build**

```bash
npx tsc -b --noEmit && npx vitest run && npm run build
```

- [ ] **Step 2: Manual E2E test**

1. Select each text effect (Wave, Scatter, Dissolve) — verify particles form text
2. Change text in TEXT folder → particles update
3. Change font → particles re-form with new font shape
4. Export → Website Embed → copy to blank HTML page → verify it renders
5. Export → iframe tab → verify URL includes text params
6. Visit `/embed?effect=text-wave&text=HELLO&font=Bungee` → verify it works

- [ ] **Step 3: Update CLAUDE.md**

Mark Phase 3 as complete. Add Text-to-Particles section to Architecture.

- [ ] **Step 4: Commit + push**

```bash
git add -A
git commit -m "feat(text): Phase 3 complete — text-to-particles with 3 effects and Google Fonts"
git push origin main
```
