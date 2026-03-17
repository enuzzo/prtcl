# Hand Tracking for PRTCL

## Overview

Real-time hand gesture recognition using MediaPipe Hands. Users toggle tracking via a button in TopBar; the open palm gesture controls camera orbit and zoom. The webcam feed (mirrored) with skeleton overlay appears as a compact thumbnail in the viewport corner.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tracking library | MediaPipe Hands (WASM) | 21 landmarks, ~30fps, ~4MB lazy-loaded, best accuracy |
| Control mode | Camera orbit + zoom via open palm | Single gesture does everything — intuitive, reliable |
| Gesture set | Open palm only (v1) | Pinch too fine/rarely detected; fist needs calibration. One gesture, done well |
| Zoom direction | Hand closer → zoom out, hand farther → zoom in | Push/pull metaphor — like physically moving an object through the screen |
| Input smoothing | Lerp (alpha=0.12) on palm position + hand size | Prevents jerks on tracking flicker or hand re-entry |
| Timeout | 5 seconds grace, then smooth return to home | Hand can leave and return without losing position; after 5s, auto-reset |
| Webcam display | Mirrored (CSS scaleX(-1)), 120px thumbnail | Natural mirror feel; non-intrusive viewport overlay |
| Multi-hand | First hand only (v1) | Simplicity; multi-hand adds gesture ambiguity |
| Mobile | Hidden under 768px (v1) | Performance budget too tight for tracking + particles on mobile |

## Architecture

Four independent layers communicating only through the Zustand store:

```
MediaPipe Hands (WASM on main thread, ~30fps)
    | 21 landmarks + handedness
useHandTracking hook (React)
    | gesture recognition + palm center + hand size
Zustand store (tracking slice)
    | gesture state + palm position + hand size
HandCameraSync (useFrame, 60fps) + UI (thumbnail + sidebar)
```

### Camera control via HandCameraSync

`HandCameraSync` is a separate R3F component rendered as a sibling **after** `CameraSync` in `Viewport.tsx`. This ensures its `useFrame` callback runs after OrbitControls' `update()`, so camera changes stick.

The camera controller (`hand-camera.ts`) works in spherical coordinates:
- **Rotation**: Palm X/Y offset from center → theta/phi changes (with dead zone of 0.06, mirrored X)
- **Zoom**: Hand size ratio (current / baseline) → camera radius multiplied by ratio. Hand closer (larger ratio) = larger radius = zoom out. Hand farther (smaller ratio) = smaller radius = zoom in.
- **Home capture**: On first engagement, saves camera position, target, and radius
- **Timeout**: After 5s without tracking, smoothly lerps back to home position

### Why this separation

- MediaPipe runs at ~30fps independently from the 60fps render loop. The hook bridges the gap.
- The gesture classifier is pure math (landmark distances) — testable without a webcam.
- The store is the single point of contact. HandCameraSync reads via `getState()`, zero coupling.
- If MediaPipe is unavailable (permissions denied, old browser), everything else works normally.

### Lazy loading

MediaPipe WASM (~4MB) downloads only when the user clicks the toggle. The `src/tracking/` module is not imported until needed (dynamic import). Zero impact on initial page load.

## File Structure

```
src/tracking/                      — All tracking code, lazy-loaded
  types.ts                         Enums, interfaces, landmark types
  mediapipe-loader.ts              Dynamic import + WASM initialization
  gesture-classifier.ts            Pure math: 21 landmarks → gesture enum + palm center + hand size
  useHandTracking.ts               React hook: webcam → MediaPipe → classify → store
  hand-camera.ts                   Camera orbit/zoom controller (spherical coords, smoothed inputs)

src/editor/TopBar.tsx              — Hand icon toggle button
src/editor/TrackingThumbnail.tsx   — Mirrored 120px canvas with B/W webcam + green skeleton
src/editor/TrackingSidebar.tsx     — Sidebar section (status display)
src/editor/Viewport.tsx            — HandCameraSync component + TrackingThumbnail overlay
src/store.ts                       — Tracking slice in Zustand store
```

## Store (tracking slice)

```typescript
trackingEnabled: boolean
trackingReady: boolean
trackingError: string | null
gesture: 'none' | 'open_palm'
palmPosition: { x: number; y: number } | null
handSize: number                   // wrist-to-middle-finger-tip distance (proxy for camera distance)
confidence: number
landmarks: Array<{ x: number; y: number; z: number }> | null
```

## Gesture Recognition

### Open palm detection

Requires 3+ of 4 fingers extended (index, middle, ring, pinky). Thumb is excluded — its x-axis comparison is unreliable across camera angles and handedness.

- Finger extended: `tip.y < pip.y` (MediaPipe y increases downward)
- Debounce: 150ms stability before gesture change is confirmed

### Hand metrics

- **Palm center**: Average of wrist + 4 MCP landmarks (index, middle, ring, pinky)
- **Hand size**: Euclidean distance from wrist to middle finger tip — proxy for hand distance from camera

## Input Smoothing

All raw inputs are smoothed via exponential moving average before use:

| Input | Alpha | Purpose |
|---|---|---|
| Palm X position | 0.12 | Smooth rotation, prevent jerks on re-detection |
| Palm Y position | 0.12 | Smooth rotation |
| Hand size | 0.12 | Smooth zoom changes |
| Camera radius | 0.05 | Additional zoom smoothing |

On first engagement, smoothed values are initialized to raw values (no initial lerp lag).

## Camera Control Constants

| Constant | Value | Purpose |
|---|---|---|
| ROTATE_SPEED | 0.06 | Radians per frame at full offset |
| ZOOM_ALPHA | 0.05 | Lerp speed for zoom radius smoothing |
| DEAD_ZONE | 0.06 | Ignore palm movement within this radius of center |
| RETURN_ALPHA | 0.025 | Lerp speed for returning to home position |
| TIMEOUT_MS | 5000 | Ms before smooth return to home position |
| INPUT_ALPHA | 0.12 | Lerp speed for smoothing raw hand inputs |

## Edge Cases

| Case | Behavior |
|---|---|
| Camera permission denied | `trackingError` set, toggle returns to OFF, button tooltip shows error |
| MediaPipe WASM load failure | `trackingError` set, toggle disabled with error tooltip |
| Hand leaves frame | Camera holds position during 5s grace period |
| Hand returns within 5s | Smoothly continues from current camera position |
| Hand absent > 5s | Camera smoothly lerps back to home position |
| Tracking flicker (1-2 dropped frames) | Smoothed inputs prevent visible jerks |
| Two hands visible | Use first detected hand only |
| Mobile (< 768px) | Toggle hidden — not available on mobile |

## Verification

1. Click hand icon in top bar → WASM loads, webcam starts, thumbnail appears (mirrored)
2. Show open palm → camera orbits following hand position
3. Move hand closer to monitor → shape moves away (zoom out)
4. Pull hand away from monitor → shape comes closer (zoom in)
5. Remove hand → camera holds position for 5s, then smoothly returns home
6. Toggle OFF → thumbnail disappears, sidebar section hides, camera returns to normal
7. `npx tsc -b` → no type errors
8. All existing effects work unchanged with tracking ON
