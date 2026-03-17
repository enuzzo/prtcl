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

Effects are JavaScript function bodies stored as strings, compiled at runtime via `new Function()`. Each effect receives: particle index (`i`), count, target (Vector3), color (Color), time, THREE library, `getControl()` for reading slider values, and `setInfo()`. Text effects additionally receive `textPoints: Float32Array`.

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

### Key File Locations

```
src/engine/              — Core: ParticleSystem, ShaderMaterial, compiler, validator, adaptive-quality, camera-bridge, types
src/editor/              — Three-panel editor: EditorLayout, EffectBrowser, Viewport, ControlPanel, TopBar, StatusBar
src/effects/presets/     — Built-in effect presets (nebula, lorenz, galaxy, starfield, blackhole, hopf)
src/store.ts             — Zustand store (effect state, settings, camera, throttled perf metrics)
src/App.tsx              — Router: /create → Editor, /gallery → placeholder
```

### UI Layout

Three-panel fixed layout (280px | flex | 320px), collapses to tabs below 768px:
- **Left**: Effect browser — categorized presets (organic, math, text, abstract), search
- **Center**: R3F canvas with orbit controls
- **Right**: Tweakpane — Global (particles, point size), Camera (auto-rotate, zoom), Effect (dynamic controls from `addControl()`), Tools (Copy Params)

Everything is live — no submit buttons. Export is max 2 clicks.

### Preset Tuning Workflow

Each preset defines baseline values for all parameters: `particleCount`, `pointSize`, `autoRotateSpeed`, `cameraZoom`, `cameraPosition`, `cameraTarget`, plus effect-specific control defaults. When an effect is selected, all baselines are applied automatically.

**Copy Params** button in ControlPanel exports a JSON snapshot of all current settings (global, camera position/orientation, effect controls) to the clipboard. This enables iterative tuning: adjust sliders → Copy Params → paste JSON → update preset defaults in code.

### Camera Bridge

Module-level refs (`src/engine/camera-bridge.ts`) expose the R3F camera and OrbitControls to code outside the Canvas (e.g., ControlPanel's Copy Params). Camera position from presets is applied as a one-shot pending state in the store, consumed by CameraSync in the next frame.

### Store Design

Zustand store is flat with granular selectors. Performance metrics (fps, actualParticleCount) are throttled to 1 update/second to avoid React re-renders. The `controls` array triggers Tweakpane rebuild when effect changes; slider values update via `updateControlValue()` without rebuilding the pane.

## Design Tokens (in `src/index.css`)

- Background: `#050510` | Surface: `#0d0d1a` | Border: `#1a1a2e`
- Accent: `#7aa2f7` (electric blue)
- Text: `#e0e0e0` | Muted: `#8b8fa3`
- Code font: JetBrains Mono
- Dark mode only (v1)

## Implementation Status

- [x] **Phase 1**: Core engine, compiler, editor layout, 6 presets (Nebula, Lorenz, Galaxy, Starfield, Black Hole, Hopf Fibration)
- [x] **Phase 1.5**: Preset tuning workflow — camera controls, zoom, Copy Params, per-preset baselines
- [ ] **Phase 2**: Export system — 4 modes + modal + live preview
- [ ] **Phase 3**: Text-to-particles — canvas sampler, Google Fonts, 3 text effects
- [ ] **Phase 4**: Landing page (static HTML, SEO), gallery, mobile responsive
- [ ] **Phase 5**: Vercel deploy, prtcl.es, GitHub public

## Conventions

- Package name: `prtcl`
- GitHub: `enuzzo/prtcl`, domain: `prtcl.es`
- Built-in preset author: "PRTCL Team"
- TypeScript strict — proper types for Effect, Control, CompiledEffect
- Gallery v1: curated JSON in repo (no database, no auth)
- Google Fonts: loaded dynamically only when text feature is used
- Export snippets must include `/* Made with PRTCL — prtcl.es */`
- Design spec: `docs/superpowers/specs/2026-03-16-prtcl-design.md`
- Implementation plan: `docs/superpowers/plans/2026-03-16-prtcl-phase1-core-engine.md`
