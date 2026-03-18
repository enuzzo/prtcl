# Audio Reactivity — Phase 1.11 Design Spec

> Approved during brainstorming session, March 18 2026.

## Overview

Add real-time microphone input to PRTCL so particle effects react to sound. Microphone audio is captured via Web Audio API, analyzed into frequency bands, and passed into the effect rendering pipeline. A compact UI in the TopBar provides the toggle and live frequency feedback.

## Scope

**In scope (MVP):**
- Microphone input via `getUserMedia` + `AnalyserNode`
- FFT frequency analysis → 3 bands (bass, mids, highs) + total energy + beat detection
- Audio data passed to all effects via EffectContext parameters
- TopBar mic toggle button with expandable mini frequency bars
- 2-3 existing preset upgrades to demo audio reactivity

**Out of scope (future):**
- Audio file upload (drag & drop MP3/WAV)
- Tab audio capture (`getDisplayMedia`)
- Per-slider audio binding in Tweakpane
- Audio-first presets (e.g., "Audio Spectrum")

## Architecture

### Audio Pipeline

```
Mic (getUserMedia)
  → AudioContext (created lazy on first toggle — avoids autoplay policy block)
    → MediaStreamSource
      → AnalyserNode (fftSize: 256, 128 frequency bins)
        → useAudioReactivity hook (rAF loop, ~60fps)
          → computeBands() → bass (20-250Hz), mids (250-2kHz), highs (2k-20kHz)
          → BeatDetector.detect() → spike in bass energy vs rolling average
          → store.updateAudioData({ bassBand, midsBand, highsBand, energy, beat })
```

Pattern follows hand tracking: dedicated rAF loop writes to Zustand store, ParticleSystem reads from store in `useFrame()`. One frame of latency (~16ms) is imperceptible.

### Beat Detection

Simple onset detection algorithm:
- Maintains a rolling history of ~30 frames of bass energy
- Beat = current bass energy > 1.5x rolling average
- Beat flag stays `true` for ~100ms then decays to `false`
- No sophisticated BPM tracking — just energy spikes

### Frequency Band Computation

`AnalyserNode.getByteFrequencyData()` returns 128 bins (0-255 each) covering 0 to Nyquist (~22050Hz at 44100Hz sample rate).

| Band  | Frequency Range | Bins (approx) | Description              |
|-------|----------------|---------------|--------------------------|
| Bass  | 20-250 Hz      | 0-3           | Kick drums, bass lines   |
| Mids  | 250-2000 Hz    | 3-12          | Vocals, guitars, snares  |
| Highs | 2000-20000 Hz  | 12-128        | Hi-hats, cymbals, air    |

Each band: sum byte values in range, divide by (count * 255) → normalized 0-1.

## Store Slice

Added flat to `PrtclState` in `store.ts`:

```typescript
// State
audioEnabled: boolean           // mic toggle on/off
audioReady: boolean             // true when stream + analyser active
audioError: string | null       // "Permission denied", etc.
bassBand: number                // 0-1, 20-250 Hz
midsBand: number                // 0-1, 250-2000 Hz
highsBand: number               // 0-1, 2000-20000 Hz
energy: number                  // 0-1, average of three bands
beat: boolean                   // true for ~100ms on each beat

// Actions
setAudioEnabled: (on: boolean) => void
setAudioReady: (ready: boolean) => void
setAudioError: (error: string | null) => void
updateAudioData: (data: { bassBand, midsBand, highsBand, energy, beat }) => void
```

No nested objects. Same pattern as `TrackingSlice`.

## EffectContext Extension

Five new parameters appended to the compiled function signature:

```
compiledFn(i, count, target, color, time, THREE, getControl, setInfo,
  textPoints, camX, camY, camZ, pointerX, pointerY, pointerZ,
  bass, mids, highs, energy, beat)
```

When mic is off, values are: `bass=0, mids=0, highs=0, energy=0, beat=false`. Effects don't need conditionals — zero means silence, multiplying by zero is a no-op.

### Files affected:
- `src/engine/types.ts` — add `bass`, `mids`, `highs`, `energy`, `beat` to EffectContext
- `src/engine/compiler.ts` — extend function signature and dry-run call
- `src/engine/ParticleSystem.tsx` — read audio state from store, pass to compiledFn

## File Structure

```
src/audio/
  types.ts              — AudioSlice interface definition
  useAudioReactivity.ts — React hook: getUserMedia, AnalyserNode, rAF loop, cleanup
  analyser.ts           — computeBands(dataArray, binCount) + BeatDetector class
```

Three files total. No separate loader module — Web Audio API is native, no WASM to lazy-load. The hook manages the full lifecycle: permission request → stream → AudioContext → AnalyserNode → rAF analysis loop → cleanup on disable.

## TopBar UI

### Layout

```
OFF:  [ 🎙️ ] [ ✋ ] [ ⛶ ]

ON:   [ ||||| 🎙️ ] [ ✋ ] [ ⛶ ]
        bars ←expand
```

### Mic Button
- Position: immediately left of the hand tracking button
- Same size and style as hand tracking toggle
- Three states:
  - **Idle** (mic off): `bg-elevated text-text-muted border-transparent`
  - **Active** (mic on): `bg-accent2/15 text-accent2 border-accent2/40` (lime)
  - **Error** (permission denied): `bg-danger/10 text-danger border-danger/30`
  - **Loading** (requesting permission): `animate-pulse`

### Mini Frequency Bars
- 5 vertical bars, max height ~16px
- Appear only when `audioEnabled && audioReady`
- Expand animation: bars container grows from width 0 to full width over 300ms (CSS transition), pushing content to the left. Mic button stays in place, space opens to its left.
- On mic off: collapse animation reverses (300ms), bars shrink to width 0
- Each bar maps to a spectral segment (sub-bass, bass, mids, upper-mids, highs)
- Bar height = band amplitude (0-1 mapped to 0-16px)
- Color: accent primary (`#FF2BD6`) with opacity proportional to amplitude
- Bars animate at render rate (~60fps) via direct DOM manipulation or inline style updates from the store

### Mobile
- Mic button visible in TopBar (same position)
- Mini bars hidden to save horizontal space — `useIsMobile()` check

## Preset Upgrades

Upgrade 2-3 existing effects to react to audio. The modifications are minimal — a few lines that multiply existing parameters by audio values. When mic is off (audio values = 0), the multiplier has no effect.

### Fractal Frequency
- `bass` modulates amplitude (particles push outward on bass hits)
- `highs` modulate frequency (faster oscillation on high-frequency content)
- `beat` triggers a brief color flash (white spike)

### Fibonacci Crystal
- `energy` modulates `breath` speed (crystal breathes with the music)
- `beat` pulses `faceting` (facets sharpen momentarily on each beat)

### Nebula
- `mids` modulate density/spread (nebula expands with mids)
- `beat` triggers white color flash

### Implementation pattern
```javascript
// Example: in Fractal Frequency effect code
var amp = addControl("amp", "Amplitude", 0.1, 50.0, 15.0);
// Audio modulation: bass adds to amplitude (0 when mic off)
amp = amp + bass * amp * 0.5;
```

## Error Handling

- **Permission denied**: set `audioError = "Microphone access denied"`, button shows error state (red). No retry — user must click again to re-request.
- **No microphone**: set `audioError = "No microphone found"`.
- **AudioContext suspended**: can happen if created without user gesture. The lazy creation on button click should prevent this, but if it occurs: call `audioContext.resume()`.
- **Stream ends unexpectedly**: cleanup and set `audioEnabled = false`, `audioReady = false`.

## Performance Considerations

- `AnalyserNode` runs on audio thread — zero main thread cost for FFT
- `getByteFrequencyData()` copies 128 bytes per frame — negligible
- Band computation: 3 range sums over 128 values — trivial
- Store update: single `setState` call per frame with 5 numbers + 1 boolean
- No allocations in hot path — reuse `Uint8Array` for frequency data
- Beat detector history array: fixed size 30, shift/push — minimal GC pressure
