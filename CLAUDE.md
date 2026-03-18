# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRTCL ("particles") is a free, open-source web tool for creating, customizing, and exporting GPU-accelerated particle effects. Users pick/customize effects at prtcl.es, tweak parameters in real-time, and export self-contained snippets for embedding in any website (Elementor, Webflow, plain HTML). MIT licensed, zero accounts, runs entirely in the browser.

## Tech Stack

- **Bundler**: Vite 6
- **UI**: React 19 + TypeScript (strict)
- **3D**: React Three Fiber + drei + Three.js (pin exports to v0.170.0 for CDN stability)
- **Creative Controls**: Tweakpane (right panel parameter GUI)
- **Structural UI**: Tailwind CSS 4 (design tokens in `src/index.css` via `@theme`)
- **State**: Zustand (flat store, `getState()` in render loop — zero React overhead)
- **Deployment**: Vercel (static landing + SPA rewrites)

## Common Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npx vitest run       # Run all tests
npx tsc -b           # Type check (strict)
```

## Architecture

### Effect System

Effects are JavaScript function bodies stored as strings, compiled at runtime via `new Function()`. Each effect receives: particle index (`i`), count, target (Vector3), color (Color), time, THREE library, `addControl()` for declaring and reading slider values, and `setInfo()`. Text effects additionally receive `textPoints: Float32Array`.

**Important**: Effect code must use `addControl(id, label, min, max, initial)` — the compiler parameter is named `addControl`, not `getControl`. The default preset is Fractal Frequency (`ALL_PRESETS[0]`).

Effects are TypeScript objects conforming to the `Effect` interface (see `src/engine/types.ts`).

### Compilation & Security

User code execution requires strict sandboxing (4-stage pipeline in `src/engine/compiler.ts`):
1. **Static analysis** — regex scan for 20 forbidden patterns (document, window, fetch, eval, Function, globalThis, localStorage, setTimeout, etc.)
2. **Compilation** — `new Function()` with strict argument list
3. **Dry run** — execute with i=0..99 to catch runtime errors and collect controls
4. **NaN guard** — fallback to origin if output is NaN/Infinity

The validator (`src/engine/validator.ts`) is a **security boundary** — it must remain strict.

### Renderer

Custom `<ParticleSystem>` R3F component (`src/engine/ParticleSystem.tsx`) using BufferGeometry (position + customColor attributes) with custom ShaderMaterial (additive blending, soft point sprites). The hot loop runs in `useFrame()`:

- **Zero allocations**: target/color objects reused, control map built once per frame
- **No React in loop**: reads store via `getState()` — zero React re-renders
- **Adaptive quality** (`src/engine/adaptive-quality.ts`): reduces particle count when delta > 34ms (~30fps), recovers after 30 good frames at 50fps+, floor at 5000 particles
- **Performance targets**: 20k particles @ 60fps desktop, 5-8k @ 60fps mobile
- **Morph transitions** (2s, `easeInOutSine`): When switching effects, current particle positions/colors are snapshot into Float32Arrays and lerped toward new effect output. Point size also lerps. Particle count mismatches handled via modulo sampling (excess particles merge into new cloud, appearing particles emerge from old cloud). Camera position and target also morph in sync via `CameraSync` in `Viewport.tsx`.

### Splash Screen

Self-contained Canvas 2D particle intro (`src/components/SplashScreen.tsx`). Plays on every page load (no sessionStorage gating — users can rewatch). 1200 particles in acid-pop colors morph through three text phases:

1. **Converge** (1000ms) — scattered particles form "PRTCL"
2. **Morph 1** (600ms) — ".ES" slides in → "PRTCL.ES"
3. **Morph 2** (800ms) — letters spread → "PARTICLES"
4. **Explode** (1400ms) — particles fly off-screen edges at high velocity (no alpha fade), overlay crossfades via `easeInOutCubic` starting at 35% so PRTCL emerges underneath

Total duration ~5.15s. Text sampling uses offscreen canvas → `getImageData()` → X-sorted spatial coherence so particles on "P" in PRTCL naturally map to "P" in PARTICLES. Netmilk logo (160px, top center) and copyright (bottom center) overlay the canvas. DPI-aware rendering with `devicePixelRatio` scaling.

### Hand Tracking

MediaPipe Hands WASM for real-time hand gesture control of the camera (`src/tracking/`). Lazy-loaded (~4MB) only when the user toggles the hand icon in TopBar. Architecture:

```
MediaPipe Hands (WASM, ~30fps) → useHandTracking hook → Zustand store → HandCameraSync (useFrame, 60fps)
```

**Single gesture — open palm**: 3+ of 4 fingers extended (thumb excluded — unreliable across camera angles). Palm X/Y controls camera orbit rotation (with dead zone + mirrored X). Hand distance from camera (wrist-to-middle-finger-tip) controls zoom — hand closer to monitor pushes shape away (zoom out), hand farther pulls shape closer (zoom in). All inputs are smoothed via lerp (`INPUT_ALPHA = 0.12`) to prevent jerks on tracking flicker.

**Camera control**: `HandCameraSync` runs as a separate R3F component rendered after `CameraSync`, so its `useFrame` executes after OrbitControls' update. Manipulates camera via spherical coordinates on the OrbitControls offset. Captures home camera position on first engagement; returns smoothly after 5s timeout.

**Key files**: `hand-camera.ts` (camera controller), `gesture-classifier.ts` (landmark math + debounce), `useHandTracking.ts` (MediaPipe hook), `mediapipe-loader.ts` (WASM init), `TrackingThumbnail.tsx` (mirrored webcam + skeleton overlay).

### Key File Locations

```
src/engine/              — Core: ParticleSystem, ShaderMaterial, compiler, validator, adaptive-quality, camera-bridge, types
src/editor/              — Three-panel editor: EditorLayout, EffectBrowser, Viewport, ControlPanel, TopBar, StatusBar, MobileEffectDropdown
src/effects/presets/     — Built-in effect presets (frequency, hopf, nebula, starfield, blackhole, storm, clifford-torus, magnetic-dust, fibonacci-crystal, paper-fleet)
src/tracking/            — Hand tracking: MediaPipe loader, gesture classifier, hand-camera controller, React hook
src/components/          — SplashScreen (Canvas 2D particle text animation)
src/hooks/               — Shared React hooks (useIsMobile)
src/store.ts             — Zustand store (effect state, settings, camera, panels, tracking, throttled perf metrics)
src/App.tsx              — Router: /create → Editor, /gallery → placeholder; splash overlay
```

### UI Layout

**Desktop** (≥768px): Three-panel layout (280px | flex | 320px) with collapsible sidebars:
- **Left**: Effect browser — categorized presets (organic, math, text, abstract), search
- **Center**: R3F canvas with orbit controls
- **Right**: Tweakpane — Global (particles, point size), Camera (auto-rotate, zoom), Effect (dynamic controls from `addControl()`), Tools (Copy Params)
- **Sidebar toggles**: Arrow buttons (`‹`/`›`) on panel edges collapse/expand each panel independently. In normal mode, canvas resizes (flex reflow). In fullscreen, panels overlay as drawers (position absolute).
- **Fullscreen = immersive mode**: Both panels auto-collapse on enter, auto-restore on exit (including ESC key). Panels can be temporarily re-opened as overlays.

**Mobile** (<768px): Showcase/entertainment mode — fullscreen particles with minimal chrome:
- **TopBar**: PRTCL logo | effect name dropdown trigger | hand tracking | fullscreen
- **Dropdown**: Animated overlay from top (~50% viewport), categorized effects with search, tap-outside-to-close
- **StatusBar**: Centered copyright + "PRTCL on GitHub" link
- **Hidden**: EffectBrowser, ControlPanel, Tweakpane, Export, version/codename
- **Hook**: `useIsMobile()` — `matchMedia`-based breakpoint detection at 768px

Everything is live — no submit buttons. Export is max 2 clicks.

### Preset Tuning Workflow

Each preset defines baseline values for all parameters: `particleCount`, `pointSize`, `autoRotateSpeed`, `cameraZoom`, `cameraPosition`, `cameraTarget`, plus effect-specific control defaults. When an effect is selected, all baselines are applied automatically.

**Copy Params** button in ControlPanel exports a JSON snapshot of all current settings (global, camera position/orientation, effect controls) to the clipboard. This enables iterative tuning: adjust sliders → Copy Params → paste JSON → update preset defaults in code.

### Camera Bridge

Module-level refs (`src/engine/camera-bridge.ts`) expose the R3F camera and OrbitControls to code outside the Canvas (e.g., ControlPanel's Copy Params). Camera position from presets is applied as a one-shot pending state in the store, consumed by CameraSync in the next frame.

### Store Design

Zustand store is flat with granular selectors. Performance metrics (fps, actualParticleCount) are throttled to 1 update/second to avoid React re-renders. The `controls` array triggers Tweakpane rebuild when effect changes; slider values update via `updateControlValue()` without rebuilding the pane. Panel visibility (`leftPanelOpen`, `rightPanelOpen`) and `isFullscreen` are in the store so EditorLayout and TopBar can coordinate sidebar auto-collapse on fullscreen transitions.

## Design System (in `src/index.css`)

Acid-pop palette extracted from vibemilk design system (`incoming/vibemilk-ds/css/themes/acid-pop.css`). Token values only — no `vm-*` component classes.

- **Backgrounds (3-tier)**: `#08040E` (bg) → `#1D1131` (surface) → `#2B1A4A` (elevated)
- **Accent primary**: `#FF2BD6` (hot pink) — brand, selections, slider fills
- **Accent secondary**: `#7CFF00` (lime green) — CTAs, slider knobs, focus rings
- **Text**: `#F9F4FF` (primary) | `#D5C6F2` (secondary) | `#A98ED1` (muted)
- **Borders**: `rgba(255,43,214,0.22)` (subtle pink) | `rgba(124,255,0,0.56)` (strong lime)
- **Semantic**: success `#46FF9A` | warning `#FFD553` | danger `#FF4F7A` | info `#2CF4FF`
- **Font**: Inconsolata Nerd Font Mono (primary) → JetBrains Mono (fallback)
- **Tweakpane**: fully themed via CSS custom properties (`.tp-rotv` overrides)
- Dark mode only (v1)

## Implementation Status

- [x] **Phase 1**: Core engine, compiler, editor layout, 7 presets (Fractal Frequency, Hopf Fibration, Nebula, Starfield, Black Hole, Cumulonimbus Storm, 4D Clifford Torus)
- [x] **Phase 1.5**: Preset tuning workflow — camera controls, zoom, Copy Params, per-preset baselines
- [x] **Phase 1.6**: Design system — vibemilk acid-pop theme, Inconsolata font, Tweakpane theming, fullscreen, effect browser search + collapsible categories, adaptive quality linear ramp
- [x] **Phase 1.7**: Splash screen — Canvas 2D particle text intro (PRTCL → PRTCL.ES → PARTICLES → explode), Netmilk branding, StatusBar footer with copyright + GitHub link
- [x] **Phase 1.8**: Hand tracking — MediaPipe Hands WASM, open palm gesture controls camera orbit + zoom, mirrored webcam thumbnail, smoothed inputs, 5s timeout return to home position
- [x] **Phase 1.9**: Mobile responsive + collapsible sidebars — mobile showcase mode (dropdown effect selector, fullscreen particles), desktop collapsible off-canvas panels with arrow toggles, immersive fullscreen (auto-collapse + drawer overlays), CSS transitions 300ms
- [x] **Phase 1.10**: New presets + engine features — pointer tracking (pointerX/Y/Z in EffectContext), Magnetic Dust (cursor-reactive glitter), Fibonacci Crystal (icosahedral facets + spherical harmonics + Quilez palette), Paper Fleet (10k instanced mesh arrows with gravitational orbits). Custom renderer architecture: effects can declare `renderer: 'custom'` to mount standalone R3F components instead of ParticleSystem. Removed Spiral Galaxy.
- [ ] **Phase 1.11**: Audio reactivity — microphone input, Spotify/external audio sources, frequency analysis driving effect parameters
- [ ] **Phase 2**: Export system — 4 modes + modal + live preview
- [ ] **Phase 3**: Text-to-particles — canvas sampler, Google Fonts, 3 text effects
- [ ] **Phase 4**: Landing page (static HTML, SEO), gallery
- [ ] **Phase 5**: Vercel deploy, prtcl.es, GitHub public

## Conventions

- Package name: `prtcl`
- GitHub: `enuzzo/prtcl`, domain: `prtcl.es`
- Built-in preset author: "PRTCL Team"
- TypeScript strict — proper types for Effect, Control, CompiledEffect
- Gallery v1: curated JSON in repo (no database, no auth)
- Google Fonts: loaded dynamically only when text feature is used
- Export snippets must include `/* Made with PRTCL — prtcl.es */`
