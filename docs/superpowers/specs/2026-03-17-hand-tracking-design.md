# Hand Tracking for PRTCL

## Overview

Add real-time hand gesture recognition to PRTCL using MediaPipe Hands. Users toggle tracking via a button in the top bar; gestures manipulate particles in ways that mouse/orbit controls cannot. The webcam feed with skeleton overlay appears as a compact thumbnail in the viewport corner.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tracking library | MediaPipe Hands (WASM) | 21 landmarks, ~30fps, ~4MB lazy-loaded, best accuracy |
| Orbit controls interaction | Hybrid — mouse unchanged, hand adds unique gestures | Mouse is more precise for rotation/zoom; hand reserved for spectacular interactions |
| UI toggle placement | Hybrid — icon in top bar + settings section in right sidebar when ON | Discoverable one-click toggle + extensible settings area |
| Webcam thumbnail | Compact, 120px wide, bottom-right of viewport | Good skeleton visibility without excessive viewport obstruction |
| Gesture set (v1) | Open palm (magnet), Pinch (scale), Fist open/close (explode) | Three gestures — memorable, distinct, impossible with mouse |
| Multi-hand | First hand only (v1) | Simplicity; multi-hand adds gesture ambiguity |
| Mobile | Hidden under 768px (v1) | Performance budget too tight for tracking + particles on mobile |

## Architecture

Four independent layers communicating only through the Zustand store:

```
MediaPipe Hands (WASM on main thread, ~30fps)
    | 21 landmarks + handedness
useHandTracking hook (React)
    | gesture recognition + landmark smoothing
Zustand store (tracking slice)
    | gesture state + hand position + landmarks
ParticleSystem (useFrame, 60fps) + UI (thumbnail + sidebar)
```

### Why this separation

- MediaPipe runs at ~30fps independently from the 60fps render loop. The hook bridges the gap.
- The gesture classifier is pure math (landmark distances) — testable without a webcam.
- The store is the single point of contact. ParticleSystem reads via `getState()`, zero coupling.
- If MediaPipe is unavailable (permissions denied, old browser), everything else works normally.

### Lazy loading

MediaPipe WASM (~4MB) downloads only when the user clicks the toggle. The `src/tracking/` module is not imported until needed (dynamic import). Zero impact on initial page load.

### Threading

MediaPipe WASM inference runs on the main thread (~8ms per inference at ~30fps). On the ~30 frames per second where inference runs, the total frame budget is tighter (~8ms inference + ~1ms modifier + ~5ms effect + ~2ms render = ~16ms). On the remaining ~30 frames (no inference), overhead is only ~1ms. The existing adaptive quality system handles occasional frame drops by reducing particle count when delta > 34ms.

## File Structure

```
src/tracking/                      NEW — all tracking code, lazy-loaded
  types.ts                         Enums, interfaces, landmark types
  mediapipe-loader.ts              Dynamic import + WASM initialization
  gesture-classifier.ts            Pure math: 21 landmarks -> gesture enum
  smoothing.ts                     EMA filter for landmarks (alpha=0.3)
  useHandTracking.ts               React hook: webcam -> MediaPipe -> classify -> smooth -> store
  hand-modifier.ts                 Mutates position buffer in-place per gesture

src/editor/TopBar.tsx              MODIFY — add hand icon toggle button
src/editor/TrackingThumbnail.tsx   NEW — 120px canvas with B/W webcam + green skeleton
src/editor/TrackingSidebar.tsx     NEW — sidebar section (status only, no mode selector in v1)
src/editor/Viewport.tsx            MODIFY — overlay TrackingThumbnail when tracking active
src/store.ts                       MODIFY — add tracking slice
src/engine/ParticleSystem.tsx      MODIFY — apply hand-modifier after effect calculation
```

5 new files, 4 modified files. The `tracking/` module is fully isolated — removing it leaves the app functioning identically.

## Store (tracking slice)

Added to `PrtclState` in `src/store.ts`:

```typescript
// Tracking state
trackingEnabled: boolean           // toggle ON/OFF
trackingReady: boolean             // MediaPipe WASM loaded and ready
trackingError: string | null       // error message if load/permission fails

// Hand data (updated ~30fps by hook, read 60fps by renderer)
gesture: 'none' | 'open_palm' | 'pinch' | 'fist'
palmPosition: { x: number; y: number } | null  // 0-1 normalized viewport coords
pinchDistance: number              // 0-1, thumb-index distance for scale gesture
confidence: number                 // 0-1, MediaPipe detection confidence
landmarks: Array<{ x: number; y: number; z: number }> | null  // 21 points for thumbnail

// Fist state machine (owned by hand-modifier, advanced in useFrame)
fistPhase: 'idle' | 'contracting' | 'exploding' | 'reassembling'
fistProgress: number               // 0-1, progress within current phase

// Actions
setTrackingEnabled: (on: boolean) => void
setTrackingReady: (ready: boolean) => void
setTrackingError: (error: string | null) => void
updateHandState: (state: Partial<TrackingSlice>) => void
```

No throttle on tracking data — MediaPipe is already ~30fps, and `getState()` in the render loop causes zero React re-renders. The thumbnail and sidebar use granular selectors.

## Gesture Recognition

### Classifier logic (gesture-classifier.ts)

The classifier converts 21 MediaPipe landmarks into a gesture enum using landmark distance math:

| Gesture | Detection rule | Particle action |
|---|---|---|
| **NONE** | No hand detected or ambiguous pose | No effect — particles behave normally |
| **OPEN_PALM** | All 5 fingers extended (tip.y < pip.y for each) | Magnet: attract particles toward hand position |
| **PINCH** | Thumb-index tip distance < 0.05 (normalized) | Scale: pinch distance maps to deformation factor |
| **FIST** | All 4 fingers curled (tip.y > pip.y), thumb closed | Contract -> Explode: triggers state machine |

### Finger detection

- Fingers 2-5: `tip.y < pip.y` means extended (MediaPipe y increases downward)
- Thumb: `tip.x` vs `mcp.x` (lateral comparison, depends on handedness)

### Debounce

A gesture must be stable for 150ms before activating. This prevents false triggers during transitions (e.g., opening the hand briefly passes through "pinch"). Debounce logic lives in `gesture-classifier.ts` — it tracks the previous gesture and a stability timestamp.

## Gesture Effects

### Smoothing stages

Three EMA smoothing stages, each in a specific module:

| Stage | Alpha | Module | Purpose |
|---|---|---|---|
| Raw landmarks | 0.3 | `smoothing.ts` | Reduce MediaPipe jitter on 21 landmark positions |
| Magnet target position | 0.15 | `hand-modifier.ts` | Smooth the palm-to-scene mapping for magnet effect |
| Pinch scale factor | 0.2 | `hand-modifier.ts` | Smooth the scale multiplier to prevent jumps |

`smoothing.ts` handles only landmark-level smoothing (called by the hook before writing to store). Per-gesture smoothing is internal to `hand-modifier.ts` (maintains module-level state, similar to how `adaptive-quality.ts` tracks its own counters).

### Open Palm — Magnet

- Palm position in webcam (0-1 normalized) maps to 3D scene space
- Mapping: `palmX -> sceneX * MAGNET_RANGE`, `palmY -> sceneY * MAGNET_RANGE` where `MAGNET_RANGE = 3.0` (constant in v1)
- Attractive force: `F = strength / distance^2`, clamped to avoid singularity (min distance = 0.1)
- Particles keep their base effect position — magnet is an additive offset

### Pinch — Scale

- Thumb-index distance normalized (0 = closed, ~0.15 = open)
- Maps to scale factor: 0.3x (tight pinch) -> 1.0x (normal) -> 3.0x (wide spread)
- Applied as multiplier on `target.xyz` after effect calculation

### Fist — Contract / Explode / Reassemble

Three-phase state machine, **owned by `hand-modifier.ts`** and **advanced in the `useFrame` loop** (60fps timing for smooth animation). The hook only writes the `gesture` field; `hand-modifier.ts` reads it and manages phase transitions:

```
IDLE -> [gesture === 'fist'] -> CONTRACTING -> [gesture !== 'fist'] -> EXPLODING -> REASSEMBLING -> IDLE
                                 (max 600ms)                           (400ms)      (1200ms)
```

1. **CONTRACTING** (fist closed): all particles interpolate toward scene center (0,0,0) with `easeInCubic`. Longer hold = more compression (max 600ms). `fistProgress` advances based on `delta` time.
2. **EXPLODING** (fist opened): radial velocity outward proportional to distance from center. Alpha fade. Fixed 400ms with `easeOutQuad`. Advances automatically regardless of gesture.
3. **REASSEMBLING**: particles smoothly return to original effect positions with `easeInOutCubic` (1200ms). Advances automatically, then transitions to IDLE.

If the user opens fist during CONTRACTING, explosion fires from current compression state. If held for all 600ms, explosion is maximum intensity.

`hand-modifier.ts` writes `fistPhase` and `fistProgress` back to the store so the sidebar can display the current state.

## Data Flow Per Frame

```
1. MediaPipe -> 21 landmarks (x,y,z normalized 0-1) @ ~30fps
2. useHandTracking hook (runs on MediaPipe callback, ~30fps):
   - smoothing.ts: EMA (alpha=0.3) on all 21 landmark positions
   - gesture-classifier.ts: landmark distances -> gesture enum (with 150ms debounce)
   - Compute palm center from smoothed landmarks
   - Write to store: { gesture, palmPosition, landmarks, confidence }
3. ParticleSystem useFrame (runs @ 60fps):
   - Read tracking state via getState()
   - hand-modifier.ts: select code path by gesture OUTSIDE the loop, then run
     branchless inner loop over all particles:
     - OPEN_PALM: attract particles toward palmPosition (smooth target internally)
     - PINCH: scale positions by smoothed pinch factor
     - FIST: advance state machine by delta, apply contract/explode/reassemble
   - Modifier mutates the positions Float32Array in-place
```

The modifier does not touch effect code — it operates on positions already computed in the buffer. This means ALL existing effects automatically work with tracking without any modification.

## ParticleSystem Integration

Minimal change to the render loop — one block after the effect for-loop:

```typescript
// Inside useFrame(), AFTER the loop computing base positions
const tracking = useStore.getState()

if (tracking.trackingEnabled && tracking.gesture !== 'none') {
  // applyHandModifier selects gesture code path once, then loops internally
  // Signature: mutates positions buffer in-place
  applyHandModifier(positions, count, tracking, delta)
}
```

`applyHandModifier` signature:

```typescript
function applyHandModifier(
  positions: Float32Array,  // position buffer to mutate in-place
  count: number,            // particle count
  tracking: TrackingSlice,  // current tracking state from store
  delta: number,            // frame delta in seconds (for fist state machine timing)
): void
```

The function selects a gesture-specific code path once (switch on `tracking.gesture`), then runs a tight inner loop over `count` particles without branching.

## UI Components

### TopBar toggle

Icon button with three states, matching existing TopBar button styling:

- **OFF**: `bg-elevated text-muted border-transparent` (blends with other buttons)
- **ON**: `bg-accent2/15 text-accent2 border-accent2/40` (lime glow)
- **Loading**: icon pulses with `animate-pulse`, tooltip "Loading hand tracking..."
- **Error**: `text-danger`, tooltip shows `trackingError` message

### TrackingThumbnail (120x90px)

Positioned absolute bottom-right of viewport with 10px margin:

- Canvas 2D overlaid on webcam feed, **updated on MediaPipe callback (~30fps)**, not on requestAnimationFrame
- Webcam rendered in B/W via `ctx.filter = 'grayscale(1)'`
- Skeleton: lime lines (#7CFF00) between 21 landmarks, circles on joints
- Gesture label below feed: uppercase lime text, Inconsolata 9px
- Border: `1px solid rgba(124,255,0,0.4)`, `border-radius: 6px`
- Background: `rgba(0,0,0,0.85)`
- Appears/disappears with `opacity 200ms ease` transition

### TrackingSidebar

Section in ControlPanel, above Global controls (only visible when tracking ON):

- Header: "TRACKING" in lime (#7CFF00), uppercase, letter-spacing wider
- Status line: "Active" in #7CFF00 / "No hand" in text-muted
- Current gesture display: gesture name + fist phase if applicable
- No mode selector in v1 (hands only — face tracking is a future spec)
- Section animates in/out with `max-height` transition

All styling uses the existing acid-pop design tokens from `src/index.css` (`accent2` for lime, `text-muted` for secondary text, `elevated` for backgrounds).

### Error feedback

No toast system exists in the codebase. Errors are handled inline:

- **Camera permission denied**: `trackingError` set in store, toggle returns to OFF. TopBar button shows danger color with tooltip "Camera permission required". TrackingSidebar (if briefly visible) shows error text inline.
- **WASM load failure**: Same pattern — `trackingError` set, toggle disabled, tooltip shows error.
- **Hand lost**: Not an error — gesture transitions to NONE, effects fade over 300ms. Sidebar shows "No hand detected" in muted text.

## Edge Cases

| Case | Behavior |
|---|---|
| Camera permission denied | `trackingError` set, toggle returns to OFF, button tooltip shows error |
| MediaPipe WASM load failure | `trackingError` set, toggle disabled with error tooltip |
| Hand leaves frame | Gesture -> NONE, tracking effects cease gradually (300ms fade) |
| Two hands visible | Use first detected hand only (v1) |
| Mobile (< 768px) | Toggle hidden — not available on mobile (v1) |
| Fist during effect change | State machine resets to IDLE, reassembles toward new positions |
| Tracking ON + fullscreen | Thumbnail stays visible, same relative position |
| Tab in background | `document.hidden` pauses MediaPipe inference, resumes on focus. Note: `document` access is in `src/tracking/` (app code), not in sandboxed effect code, so the validator does not apply. |

## Performance Budget

| Component | Cost | Frequency |
|---|---|---|
| MediaPipe WASM inference | ~8ms | ~30fps (alternating frames) |
| Gesture classifier + smoothing | <0.1ms | ~30fps |
| Hand modifier loop (20k particles) | ~1ms | 60fps (every frame) |

**Worst-case frame** (inference + modifier + effect + render): ~8 + 1 + 5 + 2 = ~16ms. Tight but within 60fps budget on desktop. On the ~30 frames/sec without inference: ~1 + 5 + 2 = ~8ms (comfortable headroom).

If frames consistently exceed 16.6ms, the existing adaptive quality system reduces particle count (floor at 5000). This provides automatic performance scaling without tracking-specific logic.

## Verification

1. Click hand icon in top bar -> WASM loads, webcam starts, thumbnail appears
2. Show open palm -> particles attract toward hand position like a magnet
3. Pinch thumb and index -> particle formation scales smaller; spread them -> scales larger
4. Close fist -> particles contract to center; open fist -> explosion -> particles reassemble
5. Toggle OFF -> thumbnail disappears, sidebar section hides, particles return to normal
6. Deny camera permission -> button shows error tooltip, toggle returns to OFF
7. `npx tsc -b` -> no type errors
8. All existing effects work unchanged with tracking ON
