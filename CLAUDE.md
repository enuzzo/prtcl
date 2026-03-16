# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRTCL ("particles") is a free, open-source web tool for creating, customizing, and exporting GPU-accelerated particle effects. Users pick/customize effects at prtcl.es, tweak parameters in real-time, and export self-contained snippets for embedding in any website. MIT licensed, zero accounts, runs entirely in the browser.

## Tech Stack

- **Framework**: Next.js 15 (App Router) — SSR for SEO landing, client components for the editor
- **3D**: React Three Fiber + Three.js (pin exports to v0.170.0 for CDN stability)
- **UI**: shadcn/ui + Tailwind CSS 4
- **State**: Zustand
- **Fonts**: Google Fonts API (dynamic, loaded only when text feature is active)
- **Deployment**: Vercel

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Start production server
```

## Architecture

### Effect System

Effects are JavaScript function bodies stored as strings, compiled at runtime via `new Function()`. Each effect receives an `EffectContext` with: particle index, count, target position, color, time, THREE library, `addControl()` for dynamic sliders, `setInfo()`, and `annotate()`. Text effects additionally receive `textPoints: Float32Array`.

Effects are stored as JSON conforming to the `Effect` interface (see `lib/effects/types.ts`).

### Compilation & Security

User code execution requires strict sandboxing:
1. **Static analysis** — regex scan for forbidden patterns (document, window, fetch, eval, etc.)
2. **Dry run** — execute once with i=0, count=100 to catch runtime errors
3. **NaN guard** — fallback to origin if any output is NaN/Infinity

The validator (`lib/effects/validator.ts`) must remain strict — this is a security boundary.

### Renderer

Custom `<ParticleSystem>` R3F component using BufferGeometry (position + customColor attributes) with custom ShaderMaterial (additive blending, soft point sprites). The hot loop runs in `useFrame()` — performance here is critical. Targets: 20k particles @ 60fps desktop, 5-8k @ 60fps mobile. Adaptive quality auto-reduces particle count if frame time > 20ms.

### Text-to-Particles

Canvas-based text sampling: render text to offscreen canvas, threshold + Poisson disk sampling to extract glyph positions as a Float32Array of normalized coordinates.

### Export System (4 modes)

1. **Full HTML** — standalone page with Three.js from CDN, controls, orbit
2. **Embed Snippet** — transparent, no UI, pointer-events: none, fills parent (the Elementor/Webflow use case)
3. **Code** — just the effect function body
4. **JSON Preset** — full Effect definition, importable back into PRTCL

Export snippets must include `/* Made with PRTCL — prtcl.es */`. Target < 15KB minified (before CDN import).

### Key File Locations

```
components/particles/   — Core particle system, shader material, compiler, text sampler
components/editor/      — Three-panel editor layout, effect browser, controls, export modal
lib/effects/            — Types, built-in presets, validator, export templates
lib/store.ts            — Zustand store (app state)
app/create/             — Main editor page (client component boundary)
app/gallery/            — Community presets browser
public/gallery/         — Gallery JSON files (curated, no database)
```

### UI Layout

Three-panel responsive layout (collapses to tabs on mobile):
- **Left**: Effect browser (presets, search, fork)
- **Center**: R3F canvas with orbit controls
- **Right**: Dynamic controls from `addControl()`, global settings, text controls, collapsible code editor

Everything is live — no submit buttons. Export is max 2 clicks.

## Design Tokens

- Background: #050510 (dark-first, dark mode only for v1)
- Accent: #7aa2f7 (electric blue)
- Code font: JetBrains Mono
- Marketing font: Geist, Satoshi, or similar geometric sans

## Implementation Phases

Follow this order — each phase builds on the previous:
1. Core engine: particle system, compiler, editor layout, 4 presets (Nebula, Lorenz, Galaxy, Starfield)
2. Export system: all 4 modes + modal
3. Text-to-particles: canvas sampler, Google Fonts loader, 3 text effects
4. Polish: landing page, gallery, fork system, mobile responsive, performance pass
5. Launch: Vercel deploy, domain, GitHub public

## Conventions

- Package name: `prtcl`
- GitHub: `enuzzo/prtcl`, domain: `prtcl.es`
- Built-in preset author: "PRTCL Team" or "Netmilk Studio"
- TypeScript strict — proper types for Effect, Control, ExportConfig
- Gallery v1 is curated JSON in the repo (no database, no auth)
- Google Fonts loaded dynamically only when text feature is used
- Full architecture spec: see `PRTCL-BOOTSTRAP.md`
