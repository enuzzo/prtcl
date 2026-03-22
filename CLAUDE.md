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

Self-contained Canvas 2D particle intro (`src/components/SplashScreen.tsx`). Plays on every page load (no sessionStorage gating — users can rewatch). 1800 particles in acid-pop colors morph through three text phases (Inconsolata bold, larger font up to 200px):

1. **Converge** (1000ms) — scattered particles form "PRTCL"
2. **Morph 1** (600ms) — ".ES" slides in → "PRTCL.ES"
3. **Morph 2** (800ms) — letters spread → "PARTICLES"
4. **Explode** (1400ms) — particles fly off-screen edges at high velocity (no alpha fade), overlay crossfades via `easeInOutCubic` starting at 35%

**Orchestrated intro transition**: The R3F scene loads Fractal Frequency immediately but with camera far away (`[0, 0, 14]`). When the explosion phase starts, `onExplodeStart` fires → sets `pendingCameraPosition` to the FF preset position. CameraSync morphs the camera from far → close over 2 seconds, synchronized with the crossfade. Result: text explodes outward, FF zooms in from the center. After splash completes, UI panels slide in as staggered overlays (TopBar → sidebars → StatusBar → toggles).

**Initial effect loading**: `handleSelectEffect` accepts `{ skipCamera: true }` — used on first mount so the camera stays far until the explosion callback triggers the zoom.

Total duration ~5.15s + 2s camera morph. Text sampling uses offscreen canvas → `getImageData()` → X-sorted spatial coherence so particles on "P" in PRTCL naturally map to "P" in PARTICLES. Netmilk logo (160px, top center) and copyright (bottom center) overlay the canvas. DPI-aware rendering with `devicePixelRatio` scaling.

### Hand Tracking

MediaPipe Hands WASM for real-time hand gesture control of the camera (`src/tracking/`). Lazy-loaded (~4MB) only when the user toggles the hand icon in TopBar. Architecture:

```
MediaPipe Hands (WASM, ~30fps) → useHandTracking hook → Zustand store → HandCameraSync (useFrame, 60fps)
```

**Single gesture — open palm**: 3+ of 4 fingers extended (thumb excluded — unreliable across camera angles). All inputs are smoothed via lerp (`INPUT_ALPHA = 0.12`) to prevent jerks on tracking flicker.

**Two tracking modes** (toggle in TrackingSidebar):
1. **Control** — palm orbit + zoom. Hand position relative to anchor controls camera rotation via spherical coordinates. Hand distance (wrist-to-finger-tip) controls zoom relative to baseline captured at first engagement. Auto-rotate is killed while tracking is active — shape sits still until the hand moves it.
2. **Disturb** — hand passes through the particle cloud and disrupts motion. 2D palm position is unprojected to 3D via camera ray → z=0 plane intersection. A per-particle force is applied in ParticleSystem's `useFrame` loop as a post-processing step after the effect computes target positions.

**Palm-anchor-relative tracking**: The "zero point" is wherever the user's palm is when first detected — like grabbing a joystick. Movement is computed as delta from this anchor. Re-anchors every time the hand reappears (after fist or hand leaving scene). Horizontal axis is inverted so moving hand right pushes the object right (natural "pushing" feel).

**Disturb force types**: `repel` (radial outward), `attract` (radial inward), `swirl` (tangential orbit around hand), `scatter` (pseudo-random noise displacement), `vortex` (attract + swirl combined spiral). Each effect declares its own `disturbMode`, `disturbRadius`, `disturbStrength` in the Effect interface for unique per-effect behavior. Default: `repel` with radius 4.0 and strength 1.2.

**Smooth transitions**: Disturb force has fade-in (`DISTURB_FADE_IN = 0.06`) and fade-out (`DISTURB_FADE_OUT = 0.02`) so there's no snap when the hand enters/leaves. 3D hand position itself is smoothed via lerp (`DISTURB_POS_LERP = 0.08`). On effect switch with tracking active, camera resets to the new effect's natural position; when hand reappears, current view becomes the new anchor.

**Camera control**: `HandCameraSync` runs as a separate R3F component rendered after `CameraSync`, so its `useFrame` executes after OrbitControls' update. Manipulates camera via spherical coordinates on the OrbitControls offset. Captures home camera position on first engagement; returns smoothly via lerp when palm closes.

**Key files**: `hand-camera.ts` (palm-anchor camera controller), `gesture-classifier.ts` (landmark math + debounce), `useHandTracking.ts` (MediaPipe hook), `mediapipe-loader.ts` (WASM init with generation-counter cancellation), `TrackingThumbnail.tsx` (mirrored webcam + skeleton overlay), `TrackingSidebar.tsx` (Control/Disturb mode toggle UI).

**MediaPipe loader pattern**: Uses a generation counter (`_gen`) to safely handle React StrictMode double-mount and rapid toggle scenarios. `closeMediaPipe()` bumps the generation, invalidating any in-flight async load. Concurrent callers share the same pending promise instead of throwing. This prevents the `_loading` flag from getting stuck and silently breaking subsequent tracking attempts.

### Audio Reactivity

Microphone input via Web Audio API for real-time audio-reactive particle effects (`src/audio/`). Lazy-loaded on first mic toggle (no autoplay policy issues).

```
getUserMedia (mic) → AudioContext → AnalyserNode (fftSize: 1024) → rAF loop → Zustand store → ParticleSystem (useFrame, 60fps)
```

**Frequency bands**: FFT splits 512 bins into bass (20-250Hz), mids (250-2kHz), highs (2k-20kHz), plus total energy — all normalized 0-1. Beat detector uses rolling bass average with 1.5× threshold, decays 1.0→0.0 over 100ms.

**Effect integration**: 5 new params (`bass`, `mids`, `highs`, `energy`, `beat`) appended to compiled function signature. All zero when mic is off — effects need no conditionals.

**UI**: Mic toggle button in TopBar (left of hand tracking). On click, 5 mini frequency bars expand leftward (300ms CSS transition). Bars reflect spectral segments in real-time (#FF2BD6 accent color).

**Key files**: `analyser.ts` (band computation + BeatDetector class), `useAudioReactivity.ts` (hook: mic lifecycle, rAF analysis, store updates), `types.ts` (AudioSlice interface).

### Background Picker

Customizable scene backgrounds with presets organized in 3 categories: solid colors, gradients (linear/radial), and patterns. Default is Nebula (radial gradient).

**Architecture**: WebGL `scene.background` is set via the `SceneBackground` R3F component, not CSS backgrounds (the Canvas uses `alpha: false`, so CSS is invisible behind the WebGL framebuffer). Solid presets use `THREE.Color`. Gradient and pattern presets render to an offscreen `<canvas>` at 512×512 and create a `THREE.CanvasTexture`.

**Preset data** (`src/editor/background-presets.ts`): Each preset defines `id`, `name`, `category`, `baseColor` (hex fallback for WebGL clear), `css` (for HTML export/UI swatches), optional `gradient` (Canvas2D gradient definition with stops), optional `renderToCanvas` callback (Canvas2D drawing for patterns).

**Presets**: 6 solids (Void, Abyss, Deep Space, Graphite, Obsidian, Midnight), 6 subtle gradients (Nebula, Aurora, Sunset, Arctic, Ember, Cosmos), 5 vivid gradients (Plasma, Electric, Magma, Toxic, Ultraviolet), 5 patterns (Grid, Dots, Scanlines, Circuit, Noise).

**UI** (`BackgroundPicker.tsx`): Collapsible folder styled to match Tweakpane, with swatch grids per category (7×N flex-wrap, 28px swatches). Custom color picker (+) button with hidden `<input type="color">`. Rendered below Tweakpane in ControlPanel.

**Store**: `backgroundPreset` (string ID, default `'nebula'`) and `backgroundColor` (CSS string). `setBackgroundPreset(id)` looks up the preset and sets both fields atomically.

**Export compatibility**: HTML exports use CSS `background` on the container div with transparent WebGL clear (`alpha: true`). Iframe embeds extract a hex fallback from gradient CSS for the `bg` URL param.

**Key files**: `background-presets.ts` (preset data + types), `SceneBackground.tsx` (R3F component), `BackgroundPicker.tsx` (UI).

### Export System

3 export modes in a modal overlay (`src/export/`). Click Export in TopBar → modal with live preview, settings, and generated code.

**Modes**:
1. **Website Embed** (default) — self-contained `<div>` + `<script type="module">`, Three.js v0.170.0 from CDN. Copy-paste into Elementor/Webflow/Wix/WordPress HTML widget. Tab shows brand icons + names.
2. **React Component** — `.tsx` file with R3F + drei. Typed props for count, pointSize, controls, autoRotate.
3. **`<iframe>` Embed** — `<iframe src="prtcl.es/embed?effect=...">`. Route `/embed` renders stripped canvas (no UI).

**Modal UX**: Left side = live preview (mini R3F canvas, isolated from editor state) + settings (particles, point size, height, background, auto-rotate, orbit controls, pointer reactive, PRTCL badge). Right side = syntax-highlighted code with copy/download. Settings changes regenerate code in real-time.

**Code generation**: Pure functions in `src/export/generators/`. Each generator takes an `ExportPayload` (effect, controls, camera snapshot, settings) and returns a code string. HTML generator inlines shaders, effect code, and a complete render loop. All exports include MIT credits comment.

**Embed route** (`/embed`): `EmbedView.tsx` reads URL params, resolves preset by ID, renders minimal R3F scene. Apache `.htaccess` in `public/` handles SPA routing fallback for SiteGround deployment.

**IsolatedParticleSystem**: Standalone particle renderer that accepts all settings as props (no Zustand dependency). Used by ExportPreview. Includes viewport-relative point size scaling (`canvasHeight / 800`) so the small preview canvas looks proportional to the full viewport.

**Limitations**: Custom renderer effects (Paper Fleet, Text Terrain) cannot be exported — Export button shows tooltip. Hand tracking and audio reactivity are not included in exports.

**Key files**: `ExportModal.tsx` (modal container), `IsolatedParticleSystem.tsx` (standalone renderer), `generators/html-generator.ts` (core HTML snippet), `generators/react-generator.ts`, `generators/iframe-generator.ts`, `templates/shader-strings.ts`, `src/embed/EmbedView.tsx`.

### DPI-Aware Point Size

`gl_PointSize` operates in framebuffer pixels, not CSS pixels. On Retina displays (devicePixelRatio=2), the framebuffer is 2× the CSS size, making particles appear half as large in CSS terms compared to standard displays. Fix: multiply `uPointSize` by `renderer.getPixelRatio()` in the `useFrame` loop. This applies in both `ParticleSystem.tsx` (main editor) and `IsolatedParticleSystem.tsx` (export preview).

**Point size range**: Normalized to 0.2–8.0 with step 0.1 for granular control. All preset `pointSize` defaults were recalibrated after the DPI fix (roughly halved from previous values).

### Text-to-Particles

Canvas text sampling produces a `Float32Array` of 3D points. Effects read these via the `textPoints` parameter (9th arg in compiled function signature). Google Fonts loaded lazily on first text effect selection.

```
User types text → debounce 300ms → offscreen canvas renders text → getImageData()
→ extract alpha > 128 → normalize to world coords → resample to particleCount
→ X-sorted Float32Array → Zustand store → ParticleSystem passes to compiledFn
```

**Text module** (`src/text/`): `sampler.ts` (canvas → Float32Array), `font-loader.ts` (lazy Google Fonts `<link>` + per-font readiness via `document.fonts.load()`), `fonts.ts` (12 curated fonts — selected for visual distinctiveness: display faces like Monoton, Rubik Glitch, Press Start 2P alongside classics like Orbitron, Sacramento, Abril Fatface), `useTextSampling.ts` (debounced hook mounted in EditorLayout).

**3 text effects**: Text Wave (sine displacement), Text Scatter (cascading waves with orbital drift, WLED-inspired palettes, sparkle overlay), Text Dissolve (trig-based noise drift/reform, 3 color modes: PRTCL/Spectrum/Noir). Text Terrain is a custom renderer effect (InstancedMesh letter grid on animated noise terrain with falling letters, 4 palettes, 3 text presets).

**Multiline text**: Line 1 and Line 2 input fields allow two-line text. Line Spacing control adjusts vertical distance between lines. Both lines are sampled together into a single `Float32Array`.

**ControlPanel**: TEXT Tweakpane folder (Line 1, Line 2, font dropdown, line spacing, weight selector) shown only for `category: 'text'` effects. Weight selector is hidden for single-weight fonts (e.g., Monoton, Press Start 2P). Pane rebuilds when `selectedEffectId` changes.

**Export**: `textPoints` baked as inline `Float32Array` in HTML/React generators (rounded to 3 decimals). Iframe embed passes `text`/`font`/`weight` URL params, embed route samples at load time.

### Landing Page

Static marketing page at `/` with Netmilk brand voice copy. Editor lives at `/create` with splash animation.

**Architecture**: Pure React components, zero Zustand dependency. Three.js background is lazy-loaded AFTER initial paint via `requestIdleCallback` → `React.lazy()` → separate chunk. This keeps the landing bundle at ~19KB gzip while the 3D effect loads asynchronously. Lighthouse sees the fast static page.

**Background effect**: `BackgroundEffect.tsx` wraps `BackgroundCanvas.tsx` (lazy). Renders Fractal Frequency at 6k particles, camera close (z=1.2), 60% opacity, auto-rotate 0.8. Canvas is `position: fixed, z-0` behind all content. Sections use semi-transparent backgrounds (`bg-bg/90`, `bg-bg/85`, etc.) with `backdrop-blur-sm` so the effect shows through.

**Sections**:
- `LandingNav` — sticky nav, transparent→solid on scroll (64px threshold), PRTCL logo with `.ES` hover reveal, lime "Create" CTA
- `LandingHero` — full viewport, radial vignette overlay, headline + sub + platform badge strip (Elementor/Webflow/Wix/WordPress/React/HTML as white pills with icons) + dual CTA
- `FeatureBento` — 3×2 flat grid, compact glassmorphism cards with `border-2`, icon+title inline, sarcastic copy
- `EffectShowcase` — 4 live effect iframes (`/embed` route, `loading="lazy"`), 2×2 desktop / horizontal scroll mobile
- `FinalCTA` — gradient background with floating CSS dots, closing CTA
- `LandingFooter` — compact footer with brand + links + tagline

**SEO**: Complete `<head>` with OG/Twitter meta, structured data (`WebApplication` + `Organization` + `WebSite` schema.org graph), `robots.txt`, `sitemap.xml`, font preload, preconnect. `.htaccess` with gzip compression, immutable asset caching, security headers.

**Key files**: `src/landing/LandingPage.tsx` (root), `BackgroundEffect.tsx` (lazy loader), `BackgroundCanvas.tsx` (R3F), `LandingHero.tsx`, `FeatureBento.tsx`, `EffectShowcase.tsx`, `FinalCTA.tsx`, `LandingFooter.tsx`, `LandingNav.tsx`, `icons.tsx`.

### Key File Locations

```
src/engine/              — Core: ParticleSystem, ShaderMaterial, compiler, validator, adaptive-quality, camera-bridge, types
src/editor/              — Three-panel editor: EditorLayout, EffectBrowser, Viewport, ControlPanel, TopBar, StatusBar, MobileEffectDropdown, BackgroundPicker, SceneBackground, background-presets
src/landing/             — Landing page: LandingPage, LandingNav, LandingHero, BackgroundEffect/Canvas, FeatureBento, EffectShowcase, FinalCTA, LandingFooter, icons
src/text/                — Text-to-particles: sampler, font-loader, fonts list, useTextSampling hook, types
src/effects/presets/     — Built-in effect presets (frequency, hopf, nebula, starfield, blackhole, storm, clifford-torus, perlin-noise, electromagnetic, hyperflower, fireflies, murmuration, axiom, paper-fleet, text-wave, text-scatter, text-dissolve, text-terrain)
src/tracking/            — Hand tracking: MediaPipe loader, gesture classifier, hand-camera controller, React hook
src/audio/               — Audio reactivity: analyser (FFT bands + beat), useAudioReactivity hook, AudioSlice types
src/components/          — SplashScreen (Canvas 2D particle text animation)
src/export/              — Export system: modal, generators (HTML/React/iframe), preview, settings, tabs, icons
src/embed/               — Embed route: EmbedView (stripped canvas for iframe embeds)
src/hooks/               — Shared React hooks (useIsMobile)
src/store.ts             — Zustand store (effect state, settings, camera, panels, tracking, export modal, throttled perf metrics)
src/App.tsx              — Router: / → LandingPage, /create → Editor, /embed → EmbedView; splash overlay on /create only
public/.htaccess         — Apache SPA routing + gzip compression + asset caching + security headers
public/robots.txt        — Search engine directives (disallow /embed)
public/sitemap.xml       — Sitemap for prtcl.es
```

### UI Layout

**Desktop** (≥768px): Three-panel layout (280px | flex | 320px) with collapsible sidebars:
- **Left**: Effect browser — categorized presets in rounded cards (math, organic, creature, text, abstract), search. Math first so Fractal Frequency is the top effect. Descriptions only shown for selected effect. Duplicate-click guard prevents re-selecting same effect.
- **Center**: R3F canvas with orbit controls
- **Right**: Tweakpane — Global (particles, point size), Camera (auto-rotate, zoom), TEXT (Line 1, Line 2, font dropdown, line spacing — only for text effects), Effect (dynamic controls from `addControl()`, with DROPDOWN_CONTROLS map for named presets like style/colorMode/palette), Tools (Copy Params)
- **Sidebar toggles**: Arrow buttons (`‹`/`›`) on panel edges collapse/expand each panel independently. After intro, sidebars start as overlays (no canvas reflow) and switch to flex/margin mode only after the user first toggles a panel. In fullscreen, panels always overlay as drawers (position absolute).
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

Zustand store is flat with granular selectors. Performance metrics (fps, actualParticleCount) are throttled to 1 update/second to avoid React re-renders. The `controls` array triggers Tweakpane rebuild when effect changes; slider values update via `updateControlValue()` without rebuilding the pane. Panel visibility (`leftPanelOpen`, `rightPanelOpen`) and `isFullscreen` are in the store so EditorLayout and TopBar can coordinate sidebar auto-collapse on fullscreen transitions. Sidebars stay as overlays (position absolute) until the user first toggles a panel, preventing canvas reflow glitch during the intro animation. `trackingMode` (`'control' | 'disturb'`) selects between camera-orbit and particle-disruption hand tracking.

## Performance & Lighthouse Strategy

Target: **Lighthouse 100/95/100/100** (Performance/Accessibility/Best Practices/SEO) on both mobile and desktop. Current landing page payload: **~171 KiB** on mobile.

### Rules to maintain Lighthouse scores

1. **No Three.js on mobile landing** — `BackgroundEffect.tsx` skips the R3F background on `window.innerWidth < 768`. The 3D effect is barely visible behind the vignette on mobile and tanks TBT by seconds. Desktop gets the lazy-loaded effect via `requestIdleCallback`.

2. **No iframe embeds on mobile** — `EffectShowcase.tsx` renders lightweight static cards (link only) on `sm:hidden` breakpoint instead of 4 `<iframe>` embeds. Each iframe loads Three.js + fonts + vendor = ~2.7MB per iframe. Desktop gets the live iframes.

3. **Self-hosted woff2, not TTF** — Inconsolata served as `Inconsolata-Regular.woff2` (56KB) instead of the Nerd Font TTF (2.2MB). The Nerd Font contained thousands of icon glyphs we don't use. `font-display: optional` prevents FOUT — first visit uses system fallback, subsequent visits use cached Inconsolata.

4. **Preload the font** — `<link rel="preload" href="/fonts/Inconsolata-Regular.woff2" as="font" type="font/woff2" crossorigin>` in `index.html` ensures the font loads early.

5. **Code splitting via manualChunks** — `vite.config.ts` splits into: `vendor` (React/router/Zustand, ~87KB), `three` (Three.js, ~220KB), `r3f` (R3F/drei, lazy), `BackgroundEffect` (lazy, landing only), `EditorLayout` (lazy, /create only), `EmbedView` (lazy, /embed only). Landing page only loads `index` + `vendor` chunks.

6. **Lazy loading pattern** — Heavy components use `React.lazy()` + `<Suspense>`. The landing page defers Three.js via `requestIdleCallback` with 2s timeout fallback. This keeps FCP/LCP fast because Lighthouse measures the initial static render.

7. **No modulePreload** — Disabled in Vite config (`modulePreload: false`) to prevent the preload helper from creating cross-chunk dependencies that pull Three.js into the initial bundle.

### When adding new features

- **Landing page**: Never import Three.js, R3F, or any 3D code synchronously. Always lazy-load behind `React.lazy()` or dynamic `import()`.
- **New sections with iframes**: Always provide a mobile-only lightweight alternative (static card, screenshot, or nothing).
- **Fonts**: Never add fonts > 100KB. Prefer woff2 subsets. Google Fonts Latin subset is typically 15-60KB.
- **Images**: Use WebP/AVIF, lazy load below-the-fold images, set explicit `width`/`height` to prevent CLS.
- **Run Lighthouse CLI before deploy**: `npx lighthouse https://prtcl.es --form-factor=mobile --throttling-method=simulate --only-categories=performance,accessibility,best-practices,seo`

### Versioning

`src/version.ts` exports `VERSION`, `CODENAME`, and `BUILD_HASH` (git short SHA injected at build time via Vite `define`). `VERSION_TAG` format: `v0.7.0+abc1234`. Shown in StatusBar (desktop editor). Bump `VERSION` in both `version.ts` and `package.json` on significant changes.

## Design System (in `src/index.css`)

Acid-pop palette extracted from vibemilk design system (`incoming/vibemilk-ds/css/themes/acid-pop.css`). Token values only — no `vm-*` component classes.

- **Backgrounds (3-tier)**: `#08040E` (bg) → `#1D1131` (surface) → `#2B1A4A` (elevated)
- **Accent primary**: `#FF2BD6` (hot pink) — brand, selections, slider fills
- **Accent secondary**: `#7CFF00` (lime green) — CTAs, slider knobs, focus rings
- **Text**: `#F9F4FF` (primary) | `#D5C6F2` (secondary) | `#A98ED1` (muted)
- **Borders**: `rgba(255,43,214,0.22)` (subtle pink) | `rgba(124,255,0,0.56)` (strong lime)
- **Semantic**: success `#46FF9A` | warning `#FFD553` | danger `#FF4F7A` | info `#2CF4FF`
- **Font**: Inconsolata (self-hosted woff2, 56KB, `font-display: optional`) → JetBrains Mono (fallback)
- **Tweakpane**: fully themed via CSS custom properties (`.tp-rotv` overrides)
- Dark mode only (v1)

## Implementation Status

- [x] **Phase 1**: Core engine, compiler, editor layout, 7 presets (Fractal Frequency, Hopf Fibration, Nebula, Starfield, Black Hole, Cumulonimbus Storm, 4D Clifford Torus)
- [x] **Phase 1.5**: Preset tuning workflow — camera controls, zoom, Copy Params, per-preset baselines
- [x] **Phase 1.6**: Design system — vibemilk acid-pop theme, Inconsolata font, Tweakpane theming, fullscreen, effect browser search + collapsible categories, adaptive quality linear ramp
- [x] **Phase 1.7**: Splash screen — Canvas 2D particle text intro (PRTCL → PRTCL.ES → PARTICLES → explode), Netmilk branding, StatusBar footer with copyright + GitHub link
- [x] **Phase 1.8**: Hand tracking — MediaPipe Hands WASM, open palm gesture controls camera orbit + zoom, mirrored webcam thumbnail, smoothed inputs, 5s timeout return to home position
- [x] **Phase 1.9**: Mobile responsive + collapsible sidebars — mobile showcase mode (dropdown effect selector, fullscreen particles), desktop collapsible off-canvas panels with arrow toggles, immersive fullscreen (auto-collapse + drawer overlays), CSS transitions 300ms
- [x] **Phase 1.10**: New presets + engine features — pointer tracking (pointerX/Y/Z in EffectContext), Fibonacci Crystal (icosahedral facets + spherical harmonics + Quilez palette), Paper Fleet (10k instanced mesh arrows with gravitational orbits). Custom renderer architecture: effects can declare `renderer: 'custom'` to mount standalone R3F components instead of ParticleSystem. Removed Spiral Galaxy, Magnetic Dust.
- [x] **Phase 1.11**: Audio reactivity — microphone input via Web Audio API, FFT frequency analysis (bass/mids/highs/energy/beat), TopBar mic toggle with expanding frequency bars, 3 preset upgrades (Fractal Frequency, Fibonacci Crystal, Nebula)
- [x] **Phase 2**: Export system — 3 modes (Website Embed, React Component, Iframe) + modal with live preview + /embed route. Self-contained HTML snippets for Elementor/Webflow/Wix/WordPress, React/R3F component export, iframe embeds. Video/GIF deliberately dropped (screen recording exists).
- [x] **Phase 3**: Text-to-particles — canvas text sampler, Google Fonts (12 curated), 3 text effects (Text Wave, Text Scatter, Text Dissolve), Tweakpane TEXT folder, export + embed support with baked textPoints
- [x] **Phase 3.5**: Polish & personality — Text Scatter rewrite (cascading waves, orbital drift, WLED-inspired palettes, sparkle), Text Dissolve color modes (PRTCL/Spectrum/Noir), EffectBrowser category cards + description-on-select, GLaDOS-style effect descriptions, duplicate-click guard fix, splash screen tuning (1800 particles, larger font), dropdown controls for style/colorMode/palette
- [x] **Phase 3.6**: New effects — Creature category (Medusa, Kraken, Anemone) with IK-inspired tentacles, Text Terrain (InstancedMesh letter landscape with falling animation), point size cap raised to 8.0, Clifford Torus retuning
- [x] **Phase 3.7**: Perlin Noise effect (3D Perlin noise flow field with turbulence controls), multiline text support (Line 1/Line 2 fields + Line Spacing control), font curation for visual distinctiveness (added Monoton, Rubik Glitch, Orbitron, Press Start 2P, Silkscreen, Sacramento, Abril Fatface; removed generic sans-serif fonts), weight selector hidden for single-weight fonts, removed Text Varsity
- [x] **Phase 3.8**: Background picker — 22 presets (6 solids, 11 gradients, 5 patterns), SceneBackground R3F component with CanvasTexture rendering, BackgroundPicker swatch UI, custom color picker, export compatibility (CSS backgrounds for HTML, hex fallback for iframe). Hand tracking fix: rewrote mediapipe-loader with generation-counter pattern for React StrictMode safety.
- [x] **Phase 3.85**: Hand tracking v2 — two modes (Control + Disturb), palm-anchor-relative tracking (re-anchors on each hand reappearance), inverted horizontal axis for natural feel, per-effect disturbance with 5 force types (repel/attract/swirl/scatter/vortex), smooth fade-in/out on hand enter/exit, camera reset on effect switch, auto-rotate killed during tracking, TrackingSidebar mode toggle UI, overflow-hidden fix for Mac scrollbar during intro animation.
- [x] **Phase 4**: Landing page at `/` — SEO-optimized, Lighthouse-ready. Lazy-loaded Fractal Frequency R3F background (Three.js deferred via requestIdleCallback). Hero with platform badge strip (Elementor/Webflow/Wix/WordPress/React/HTML). Glassmorphism bento feature grid (3×2). Effect showcase with live iframe embeds. Netmilk brand voice copy. Full structured data (schema.org WebApplication). Code splitting: landing bundle 19KB gzip, Three.js loads async. robots.txt + sitemap.xml. .htaccess with compression + caching headers.
- [x] **Phase 4.05**: Lighthouse 100 — font optimization (2.2MB Nerd Font TTF → 56KB woff2), no Three.js/iframes on mobile landing, `font-display: optional` to prevent FOUT, code splitting with manualChunks. Mobile payload reduced from 10.7MB to 171KB. Scores: Performance 100, Accessibility 95, Best Practices 100, SEO 100.
- [x] **Phase 4.06**: Lighthouse 100/100/100/100 — removed unused Google Fonts preconnect, IntersectionObserver lazy iframes in EffectShowcase (prevents 4× Three.js on page load), fixed accessibility contrast issues (version tag opacity, footer background), mobile hero padding for iPhone viewport (pt-20 clears fixed nav), 3D background delay reduced from 5s to 2s for faster desktop appearance. Scores: Performance 100, Accessibility 100, Best Practices 100, SEO 100 on both mobile and desktop.
- [x] **Phase 4.07**: Font optimization — replaced 2.2MB Nerd Font TTF with 20KB Inconsolata woff2 subset, `font-display: block` to prevent FOUT (dark background masks invisible text period). Removed Google Fonts preconnect (no longer needed for landing page).
- [x] **Phase 4.08**: New effects + per-effect controls — Removed 4 weak presets (Fibonacci Crystal, Medusa, Kraken, Anemone) and creature category. Added 5 new effects: Hyperflower (twisted spherical harmonics, from external `hyperflower_attractor.js`), Electromagnetic Field (dipole field lines), Fireflies (bioluminescent pulses), Murmuration (starling flock waves), Axiom (living optimization landscape with wave-riding agents, 5 palettes). Moved Particles and Point Size from Global folder into per-effect EFFECT folder — each effect owns its own values. Point size range 0.1–12 (was 0.2–8.0). Copy Params now includes particleCount/pointSize at effect level. Per-effect `backgroundPreset` support (Axiom defaults to Electric). Effect count: 18 presets across 4 categories (math, organic, text, abstract). Removed creature category entirely.
- [ ] **Phase 4.1**: Share button — `prtcl.es/create#effect=...&controls=...`. TopBar button next to Export, copy URL to clipboard. Parse hash on load to restore state. Serialize: effect ID, controls, camera, global settings, background.
- [ ] **Phase 5**: SiteGround deploy pipeline, prtcl.es, GitHub public

## Future Ideas

- **Effect Transition Options** — currently morph is always 2s easeInOutSine. Add dropdown: Morph (current), Explode→Reform, Dissolve (alpha fade), Instant (hard cut).

## Conventions

- Package name: `prtcl`
- GitHub: `enuzzo/prtcl`, domain: `prtcl.es`
- Built-in preset author: "PRTCL Team"
- TypeScript strict — proper types for Effect, Control, CompiledEffect
- Gallery v1: curated JSON in repo (no database, no auth)
- Google Fonts: loaded dynamically only when text feature is used
- Export snippets must include credits: `/* Made with PRTCL — prtcl.es | https://github.com/enuzzo/prtcl | MIT License © enuzzo */`
