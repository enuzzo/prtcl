# Audio Reactivity (Phase 1.11) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time microphone input so particle effects react to sound — frequency bands, energy, and beat detection flow into the effect pipeline.

**Architecture:** getUserMedia → AudioContext → AnalyserNode → rAF loop in hook → Zustand store → ParticleSystem reads in useFrame. Mirrors hand tracking pattern exactly. TopBar gets a mic toggle button (left of hand icon) with expandable mini frequency bars.

**Tech Stack:** Web Audio API (native), React hooks, Zustand, CSS transitions

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/audio/types.ts` | AudioSlice interface (state + actions) |
| Create | `src/audio/analyser.ts` | computeBands() + BeatDetector class |
| Create | `src/audio/useAudioReactivity.ts` | React hook: mic lifecycle, rAF loop, store updates |
| Modify | `src/store.ts:1-168` | Add AudioSlice to PrtclState, initial values, actions |
| Modify | `src/engine/types.ts:7-78` | Add bass/mids/highs/energy/beat to EffectContext + CompiledEffectFn |
| Modify | `src/engine/compiler.ts:22-67` | Add 5 audio params to Function(), dry-run, NaN guard |
| Modify | `src/engine/ParticleSystem.tsx:52-150` | Read audio from store, pass to compiledFn |
| Modify | `src/editor/TopBar.tsx:88-128` | Mic toggle button + expanding frequency bars |
| Modify | `src/editor/Viewport.tsx:1-11,140` | Import and call useAudioReactivity hook |
| Modify | `src/effects/presets/frequency.ts:29-93` | Audio modulation: bass→amp, highs→freq, beat→color |
| Modify | `src/effects/presets/fibonacci-crystal.ts:28-152` | Audio modulation: energy→breath, beat→faceting |
| Modify | `src/effects/presets/nebula.ts:14-52` | Audio modulation: mids→turbulence, beat→color flash |

---

### Task 1: Audio Types

**Files:**
- Create: `src/audio/types.ts`

- [ ] **Step 1: Create AudioSlice interface**

```typescript
// src/audio/types.ts

export interface AudioSlice {
  // State
  audioEnabled: boolean
  audioReady: boolean
  audioError: string | null
  bassBand: number
  midsBand: number
  highsBand: number
  energy: number
  beat: number

  // Actions
  setAudioEnabled: (on: boolean) => void
  setAudioReady: (ready: boolean) => void
  setAudioError: (error: string | null) => void
  updateAudioData: (data: {
    bassBand: number
    midsBand: number
    highsBand: number
    energy: number
    beat: number
  }) => void
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors from `src/audio/types.ts` (other files may have pre-existing issues)

- [ ] **Step 3: Commit**

```bash
git add src/audio/types.ts
git commit -m "feat(audio): add AudioSlice type definition"
```

---

### Task 2: Analyser — Band Computation + Beat Detection

**Files:**
- Create: `src/audio/analyser.ts`

- [ ] **Step 1: Implement computeBands and BeatDetector**

```typescript
// src/audio/analyser.ts

export interface AudioBands {
  bassBand: number
  midsBand: number
  highsBand: number
  energy: number
}

/**
 * Compute normalized frequency bands from raw FFT data.
 *
 * With fftSize=1024 at 44100 Hz sample rate, each bin ≈ 43 Hz:
 *   Bass  (20-250 Hz)    → bins 0-5
 *   Mids  (250-2000 Hz)  → bins 6-46
 *   Highs (2000-20000 Hz) → bins 47-464
 *
 * Each band: sum byte values in range / (count * 255) → normalized 0-1.
 */
export function computeBands(data: Uint8Array, binCount: number): AudioBands {
  // Bin boundaries (fftSize=1024, sampleRate=44100)
  const bassEnd = Math.min(6, binCount)
  const midsEnd = Math.min(47, binCount)
  const highsEnd = Math.min(465, binCount)

  let bassSum = 0
  let midsSum = 0
  let highsSum = 0

  for (let i = 0; i < bassEnd; i++) bassSum += data[i]
  for (let i = bassEnd; i < midsEnd; i++) midsSum += data[i]
  for (let i = midsEnd; i < highsEnd; i++) highsSum += data[i]

  const bassBand = bassEnd > 0 ? bassSum / (bassEnd * 255) : 0
  const midsBand = (midsEnd - bassEnd) > 0 ? midsSum / ((midsEnd - bassEnd) * 255) : 0
  const highsBand = (highsEnd - midsEnd) > 0 ? highsSum / ((highsEnd - midsEnd) * 255) : 0
  const energy = (bassBand + midsBand + highsBand) / 3

  return { bassBand, midsBand, highsBand, energy }
}

const HISTORY_SIZE = 30
const BEAT_THRESHOLD = 1.5
const BEAT_DECAY_MS = 100

/**
 * Simple onset detector: beat fires when current bass energy
 * exceeds 1.5× the rolling average. Beat value decays from
 * 1.0 to 0.0 over ~100ms for smooth effect transitions.
 */
export class BeatDetector {
  private history: number[] = []
  private lastBeatTime = 0

  detect(bassBand: number, now: number): number {
    this.history.push(bassBand)
    if (this.history.length > HISTORY_SIZE) this.history.shift()

    // Need at least a few frames for a meaningful average
    if (this.history.length < 5) return 0

    const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length

    if (bassBand > avg * BEAT_THRESHOLD && avg > 0.01) {
      this.lastBeatTime = now
      return 1
    }

    // Decay
    const elapsed = now - this.lastBeatTime
    if (elapsed < BEAT_DECAY_MS) {
      return 1 - elapsed / BEAT_DECAY_MS
    }

    return 0
  }

  reset(): void {
    this.history = []
    this.lastBeatTime = 0
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors from `src/audio/analyser.ts`

- [ ] **Step 3: Commit**

```bash
git add src/audio/analyser.ts
git commit -m "feat(audio): frequency band computation + beat detector"
```

---

### Task 3: Zustand Store — Audio Slice

**Files:**
- Modify: `src/store.ts:1-168`

- [ ] **Step 1: Add AudioSlice to store**

Add import at top (after line 3):
```typescript
import type { AudioSlice } from './audio/types'
```

Extend PrtclState (line 5):
```typescript
export interface PrtclState extends TrackingSlice, AudioSlice {
```

Add audio state defaults (after tracking section, line 147):
```typescript
  // ── Audio ───────────────────────────────────────────────
  audioEnabled: false,
  audioReady: false,
  audioError: null,
  bassBand: 0,
  midsBand: 0,
  highsBand: 0,
  energy: 0,
  beat: 0,

  setAudioEnabled: (on) => set({ audioEnabled: on }),
  setAudioReady: (ready) => set({ audioReady: ready }),
  setAudioError: (error) => set({ audioError: error }),
  updateAudioData: (data) => set(data),
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/store.ts
git commit -m "feat(audio): add audio slice to Zustand store"
```

---

### Task 4: Engine Integration — Types, Compiler, ParticleSystem

**Files:**
- Modify: `src/engine/types.ts:7-78`
- Modify: `src/engine/compiler.ts:22-67`
- Modify: `src/engine/ParticleSystem.tsx:52-150`

- [ ] **Step 1: Add audio params to EffectContext and CompiledEffectFn**

In `src/engine/types.ts`, add to EffectContext (after `pointerZ`, line 26):
```typescript
  /** Bass frequency band (20-250 Hz), normalized 0-1. 0 when mic off. */
  bass?: number
  /** Mid frequency band (250-2000 Hz), normalized 0-1. 0 when mic off. */
  mids?: number
  /** High frequency band (2000-20000 Hz), normalized 0-1. 0 when mic off. */
  highs?: number
  /** Average energy across all bands, normalized 0-1. 0 when mic off. */
  energy?: number
  /** Beat onset detector: 1.0 on beat, decays to 0.0 over ~100ms. 0 when mic off. */
  beat?: number
```

Add to CompiledEffectFn (after `pointerZ`, line 77):
```typescript
  bass?: number,
  mids?: number,
  highs?: number,
  energy?: number,
  beat?: number,
```

- [ ] **Step 2: Add audio params to compiler Function() constructor**

In `src/engine/compiler.ts`, update the `new Function()` call (lines 22-27) — add 5 params after `'pointerZ'`:
```typescript
    rawFn = new Function(
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo', 'textPoints',
      'camX', 'camY', 'camZ',
      'pointerX', 'pointerY', 'pointerZ',
      'bass', 'mids', 'highs', 'energy', 'beat',
      effect.code,
    ) as (...args: unknown[]) => void
```

Update dry-run call (line 57) — add 5 zeroes:
```typescript
      rawFn(i, 100, target, color, 0, THREE, addControl, setInfo, undefined, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
```

Update NaN guard call (line 67) — add 5 zeroes:
```typescript
    rawFn(0, 100, target, color, 0, THREE, addControl, setInfo, undefined, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
```

- [ ] **Step 3: Pass audio data from store to compiledFn in ParticleSystem**

In `src/engine/ParticleSystem.tsx`, read audio from store (after line 53):
```typescript
    const { bassBand, midsBand, highsBand, energy, beat } = store
```

Update both compiledFn calls (lines 150 and 158) — add audio args after pointerZ:
```typescript
          compiledFn(i, count, target, color, time, THREE, getControl, setInfo, undefined, camX, camY, camZ, pointerX, pointerY, pointerZ, bassBand, midsBand, highsBand, energy, beat)
```

- [ ] **Step 4: Verify TypeScript compiles and dev server runs**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/compiler.ts src/engine/ParticleSystem.tsx
git commit -m "feat(audio): wire audio params through engine pipeline"
```

---

### Task 5: useAudioReactivity Hook

**Files:**
- Create: `src/audio/useAudioReactivity.ts`
- Modify: `src/editor/Viewport.tsx:1-11,140`

- [ ] **Step 1: Implement the hook**

```typescript
// src/audio/useAudioReactivity.ts

import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { computeBands, BeatDetector } from './analyser'

export function useAudioReactivity(): void {
  const audioEnabled = useStore((s) => s.audioEnabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const dataRef = useRef<Uint8Array | null>(null)
  const beatDetectorRef = useRef(new BeatDetector())

  useEffect(() => {
    if (!audioEnabled) {
      // Cleanup
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (ctxRef.current) {
        ctxRef.current.close()
        ctxRef.current = null
      }
      analyserRef.current = null
      dataRef.current = null
      beatDetectorRef.current.reset()

      const s = useStore.getState()
      s.setAudioReady(false)
      s.updateAudioData({ bassBand: 0, midsBand: 0, highsBand: 0, energy: 0, beat: 0 })
      return
    }

    // Init
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream

        const ctx = new AudioContext()
        ctxRef.current = ctx

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount // 512
        const data = new Uint8Array(bufferLength)
        dataRef.current = data

        useStore.getState().setAudioReady(true)
        useStore.getState().setAudioError(null)

        // Analysis loop
        function loop() {
          if (cancelled) return
          rafRef.current = requestAnimationFrame(loop)

          analyser.getByteFrequencyData(data)
          const bands = computeBands(data, bufferLength)
          const beat = beatDetectorRef.current.detect(bands.bassBand, performance.now())

          useStore.getState().updateAudioData({
            bassBand: bands.bassBand,
            midsBand: bands.midsBand,
            highsBand: bands.highsBand,
            energy: bands.energy,
            beat,
          })
        }
        loop()
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No microphone found'
            : `Microphone error: ${(err as Error).message}`
        useStore.getState().setAudioError(msg)
        useStore.getState().setAudioEnabled(false)
      }
    }

    start()

    // Tab visibility: suspend/resume AudioContext
    function onVisibility() {
      const ctx = ctxRef.current
      if (!ctx) return
      if (document.hidden) ctx.suspend()
      else ctx.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (ctxRef.current) {
        ctxRef.current.close()
        ctxRef.current = null
      }
    }
  }, [audioEnabled])
}
```

- [ ] **Step 2: Call hook from Viewport**

In `src/editor/Viewport.tsx`, add import (after line 10):
```typescript
import { useAudioReactivity } from '../audio/useAudioReactivity'
```

Call in Viewport component (after line 140, after `useHandTracking()`):
```typescript
  useAudioReactivity()
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/audio/useAudioReactivity.ts src/editor/Viewport.tsx
git commit -m "feat(audio): useAudioReactivity hook — mic lifecycle + rAF analysis"
```

---

### Task 6: TopBar UI — Mic Toggle + Expanding Frequency Bars

**Files:**
- Modify: `src/editor/TopBar.tsx:88-128`

- [ ] **Step 1: Add audio state reads and toggle callback**

Add after the tracking state reads (after line 27):
```typescript
  const audioEnabled = useStore((s) => s.audioEnabled)
  const audioReady = useStore((s) => s.audioReady)
  const audioError = useStore((s) => s.audioError)
  // Read band data for mini bars (fine to re-render — bars are visual feedback)
  const bassBand = useStore((s) => s.bassBand)
  const midsBand = useStore((s) => s.midsBand)
  const highsBand = useStore((s) => s.highsBand)

  const toggleAudio = useCallback(() => {
    if (audioError) {
      useStore.getState().setAudioError(null)
    }
    useStore.getState().setAudioEnabled(!audioEnabled)
  }, [audioEnabled, audioError])
```

- [ ] **Step 2: Add mic button + expanding bars to TopBar**

In the right actions `<div>` (before the hand tracking button, around line 89), add:

```tsx
          {/* Audio mic toggle + expanding bars */}
          <div className="flex items-center">
            {/* Expanding frequency bars — grow left from mic button */}
            <div
              className="flex items-end gap-[2px] overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                width: audioEnabled && audioReady && !isMobile
                  ? '40px' : '0px',
                marginRight: audioEnabled && audioReady && !isMobile
                  ? '6px' : '0px',
                opacity: audioEnabled && audioReady ? 1 : 0,
              }}
            >
              {[
                bassBand,
                (bassBand + midsBand) / 2,
                midsBand,
                (midsBand + highsBand) / 2,
                highsBand,
              ].map((v, idx) => (
                <div
                  key={idx}
                  className="w-[4px] rounded-sm"
                  style={{
                    height: `${Math.max(2, v * 16)}px`,
                    backgroundColor: `rgba(255, 43, 214, ${0.4 + v * 0.6})`,
                    transition: 'height 50ms ease-out',
                  }}
                />
              ))}
            </div>

            {/* Mic button */}
            <button
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded text-sm font-mono transition-colors ${
                audioError
                  ? 'bg-danger/10 text-danger border border-danger/30'
                  : audioEnabled
                    ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                    : 'bg-elevated text-text-muted border border-transparent hover:bg-border/50'
              } ${audioEnabled && !audioReady ? 'animate-pulse' : ''}`}
              title={
                audioError
                  ?? (audioEnabled && !audioReady
                    ? 'Requesting mic...'
                    : audioEnabled
                      ? 'Mic ON — click to mute'
                      : 'React to sound')
              }
            >
              🎙️
            </button>
          </div>
```

- [ ] **Step 3: Verify TypeScript compiles and test visually**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors

Test: open browser, click mic button, allow mic, see bars animate with sound.

- [ ] **Step 4: Commit**

```bash
git add src/editor/TopBar.tsx
git commit -m "feat(audio): mic toggle in TopBar with expanding frequency bars"
```

---

### Task 7: Preset Upgrades — Audio Modulation

**Files:**
- Modify: `src/effects/presets/frequency.ts:29-93`
- Modify: `src/effects/presets/fibonacci-crystal.ts:28-152`
- Modify: `src/effects/presets/nebula.ts:14-52`

- [ ] **Step 1: Upgrade Fractal Frequency**

In `src/effects/presets/frequency.ts`:

First, fix the `energy` variable name collision — the effect declares `var energy = Math.abs(wave)` which shadows the audio `energy` parameter. Rename it:
- Line 80 of effect code: `var energy = Math.abs(wave);` → `var waveEnergy = Math.abs(wave);`
- Line 82: `energy * 3.0` → `waveEnergy * 3.0`
- Line 83: `0.2 * energy` → `0.2 * waveEnergy`

Then, after the `addControl` declarations (after line 38), add audio modulation:
```javascript
// Audio modulation (values are 0 when mic is off — no effect)
amp = amp + bass * amp * 0.5;
freq = freq + highs * freq * 0.3;
```

Before the `color.setHSL` call (before line 85), add beat flash:
```javascript
// Beat flash — spike brightness toward white on onset
light = light + beat * 0.4;
sat = sat - beat * 0.3;
```

- [ ] **Step 2: Upgrade Fibonacci Crystal**

In `src/effects/presets/fibonacci-crystal.ts`, after `addControl` lines (after line 33), add:
```javascript
// Audio modulation
breath = breath + energy * 2.0;
faceting = faceting + beat * (1.0 - faceting) * 0.5;
```

- [ ] **Step 3: Upgrade Nebula**

In `src/effects/presets/nebula.ts`, after `addControl` lines (after line 17), add:
```javascript
// Audio modulation
turbulence = turbulence + mids * 1.5;
```

Before the `color.setHSL` call (before line 51), add beat flash:
```javascript
// Beat flash — spike toward white
lum = lum + beat * 0.35;
sat = sat - beat * 0.25;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Test with mic**

Open each of the 3 effects with mic enabled, play music, verify:
- Fractal Frequency: particles expand on bass, oscillate faster on highs
- Fibonacci Crystal: breathes with energy, facets sharpen on beat
- Nebula: turbulence increases with mids, flashes on beat

- [ ] **Step 6: Commit**

```bash
git add src/effects/presets/frequency.ts src/effects/presets/fibonacci-crystal.ts src/effects/presets/nebula.ts
git commit -m "feat(audio): upgrade 3 presets with audio reactivity"
```

---

### Task 8: Final Verification + Cleanup

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc -b --noEmit`
Expected: Zero errors

- [ ] **Step 2: Vite build check**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: End-to-end test**

1. Open dev server
2. Click mic → allow permission → bars appear, animate
3. Switch effects → audio params carry across
4. Click mic again → bars collapse, effects return to normal
5. Mobile viewport → mic button visible, no bars

- [ ] **Step 4: Final commit — CLAUDE.md status update**

Update `CLAUDE.md` Phase 1.11 checkbox from `[ ]` to `[x]`.

```bash
git add CLAUDE.md
git commit -m "docs: mark Phase 1.11 audio reactivity as complete"
```
