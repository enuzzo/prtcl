# PRTCL — Design Specification

> Free, open-source web tool for creating, customizing, and exporting GPU-accelerated particle effects.
> Domain: prtcl.es | License: MIT | Zero accounts | Runs entirely in the browser.

---

## 1. Problem & Target User

Web designers and developers (especially Elementor/Webflow users) who want beautiful particle backgrounds for their sites but don't want to write code. They need: pick an effect, tweak it, copy an HTML snippet, paste it, done. Under 60 seconds from landing to working effect.

Users technical enough to use npm/bundlers can ask their AI to build custom effects — we serve the "fast food" niche: gorgeous, instant, free.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Bundler | **Vite 6** | Instant HMR, critical for shader/canvas iteration |
| UI Framework | **React 19** | Ecosystem, R3F compatibility |
| 3D Engine | **React Three Fiber + drei** | Composable, extensible beyond particles |
| Creative Controls | **Tweakpane** | Purpose-built for 3D/creative parameter GUIs |
| Structural UI | **shadcn/ui + Tailwind CSS 4** | Sidebar, modals, buttons — accessible, composable |
| State | **Zustand** | Flat store, granular selectors, zero React overhead in render loop |
| Fonts | **Google Fonts API** | Dynamic loading, only when text feature active |
| Deploy | **Vercel** | Edge-cached static landing + SPA rewrites |
| Language | **TypeScript (strict)** | Proper types for Effect, Control, ExportConfig |

### Why Not Next.js

PRTCL is 95% client-side SPA. The only SSR need is the landing page for SEO. Next.js App Router adds server component complexity, slower dev server, and bundle overhead we don't need. Vite gives us instant HMR (critical for 3D work) and a smaller bundle. The landing page is static HTML — Google indexes it without any framework.

---

## 3. Architecture

### 3.1 Project Structure

```
prtcl/
├── index.html                  # Landing page — static HTML, perfect SEO
├── src/
│   ├── main.tsx                # SPA entry point (React 19)
│   ├── App.tsx                 # Router: /create, /gallery
│   ├── engine/
│   │   ├── ParticleSystem.tsx  # R3F component — hot loop in useFrame
│   │   ├── ShaderMaterial.ts   # Custom shader (additive blend, soft sprites)
│   │   ├── compiler.ts         # new Function() + sandboxing pipeline
│   │   ├── validator.ts        # Static analysis — security boundary
│   │   └── text-sampler.ts     # Canvas text → Float32Array (Poisson disk)
│   ├── editor/
│   │   ├── EditorLayout.tsx    # Three-panel shell
│   │   ├── EffectBrowser.tsx   # Left sidebar (tree, search, categories)
│   │   ├── Viewport.tsx        # Center R3F canvas
│   │   ├── ControlPanel.tsx    # Tweakpane wrapper (right panel)
│   │   ├── ExportModal.tsx     # Export dialog with 4 modes
│   │   └── CodeEditor.tsx      # Collapsible code editor
│   ├── effects/
│   │   ├── types.ts            # Effect, EffectContext, Control interfaces
│   │   ├── presets/            # One file per preset (nebula.ts, lorenz.ts, ...)
│   │   └── export-templates.ts # HTML generators for all 4 export modes
│   ├── store.ts                # Zustand store — flat, granular selectors
│   ├── ui/                     # shadcn/ui components (only what's used)
│   └── lib/
│       ├── fonts.ts            # Google Fonts dynamic loader
│       └── utils.ts
├── public/
│   ├── gallery/                # Curated JSON presets
│   ├── og/                     # Open Graph images
│   ├── sitemap.xml
│   └── robots.txt
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 3.2 Data Flow

```
Preset selected → compiler.ts (validate + compile) → Zustand store (compiled fn)
                                                          ↓
Tweakpane slider → store.controls → useFrame() reads controls + fn → mutates BufferGeometry
                                                          ↓
                                                    R3F canvas renders at 60fps
```

Key constraint: **Zustand never triggers React re-renders in the render loop.** `useFrame` reads the store via `getState()` — zero React overhead in the hot path.

### 3.3 Routing (Vercel)

```
/           → index.html (static, edge-cached)
/create     → src/main.tsx SPA (rewrite)
/gallery    → src/main.tsx SPA (rewrite)
```

Requires `vercel.json` with rewrite rules to serve the SPA for `/create` and `/gallery` routes.

---

## 4. SEO Strategy

The landing page is static HTML — no JavaScript required for indexable content. Google sees everything on first crawl.

### Meta Tags

- `<title>`: "PRTCL — Free Particle Effect Generator for Websites"
- `<meta name="description">`: targets "free particle background generator", "Elementor particle effects"
- Open Graph + Twitter Card with animated preview image
- `<link rel="canonical" href="https://prtcl.es">`

### Structured Data (JSON-LD)

```json
{
  "@type": "SoftwareApplication",
  "name": "PRTCL",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0" }
}
```

### Content Strategy

- **H1**: "Free Particle Effects for Your Website — Copy, Paste, Done"
- **Subtitle**: "Beautiful GPU-accelerated backgrounds ready for Elementor, Webflow, or any HTML page. MIT licensed. No signup. No watermark."
- **Keyword targets**: "free particle effects for Elementor", "free animated background Elementor", "particle background generator free", "copy paste particle effect HTML"
- **Dedicated section**: "Works with Elementor" — visual 3-step guide (open HTML widget → paste → publish)
- **Badge**: "MIT Licensed — Free Forever" prominently displayed
- **CTA**: "Start Creating — It's Free" → direct link to /create, no signup wall
- **FAQ section** with schema FAQ markup for Google rich results
- **Gallery preview**: 6 best effects as static images linking to /create

### Performance Targets (Landing)

- LCP < 1.5s (static HTML, font preload, optimized hero image)
- CLS = 0 (reserved dimensions for all elements)
- Zero blocking JS — particle demo script is `defer` + `type="module"`
- Lighthouse score > 90

---

## 5. UI Layout

### Three-Panel Fixed Layout (Option A — approved)

```
┌──────────────────────────────────────────────────────┐
│  PRTCL                                       [Export] │
├─────────┬────────────────────────────┬───────────────┤
│         │                            │               │
│ EFFECTS │                            │  CONTROLS     │
│ BROWSER │      3D VIEWPORT           │  (Tweakpane)  │
│ 280px   │      (R3F canvas)          │  320px        │
│         │      flex: 1               │               │
│ shadcn  │                            │  [sliders]    │
│ tree +  │                            │  [color]      │
│ search  │                            │  [toggles]    │
│         │                            │               │
├─────────┴────────────────────────────┴───────────────┤
│  60fps  |  15,000 particles  |  Nebula Organica      │
└──────────────────────────────────────────────────────┘
```

- **Left (280px)**: Effect browser — categorized presets (Organic, Math, Text, Abstract), search, fork button. Built with shadcn/ui components.
- **Center (flex)**: R3F canvas with orbit controls. Drag rotate, scroll zoom, right-click pan.
- **Right (320px)**: Tweakpane controls. Global controls on top (particle count, point size, background color, bloom), dynamic effect controls below, collapsible code editor at bottom.
- **Top bar**: PRTCL logo + Export button
- **Bottom bar**: FPS counter, particle count, effect name

### Mobile

Collapses to tab navigation (bottom) below **768px** breakpoint. Three tabs: Effects, Viewport, Controls. Viewport is default active tab.

---

## 6. Engine

### 6.1 Compiler Pipeline

```
User code (string)
  → validator.ts: regex scan for forbidden patterns
      (document, window, fetch, eval, import, require, XMLHttpRequest, WebSocket,
       globalThis, self, top, parent, opener, location, cookie, localStorage,
       sessionStorage, setTimeout, setInterval, Function)
  → compiler.ts: new Function('i','count','target','color','time','THREE','addControl','setInfo','textPoints', code)
  → Dry run: execute with i=0, count=100, catch runtime errors
  → NaN guard: verify output is not NaN/Infinity
  → Store: compiled function ready for useFrame
```

The validator is a **security boundary** — it must remain strict. User-submitted code runs in the browser.

### 6.2 Render Loop (Hot Path)

Zero allocations per frame. `target` and `color` are reused objects.

```typescript
useFrame(() => {
  const { compiledFn, controls, particleCount } = store.getState()
  const positions = geometry.attributes.position.array
  const colors = geometry.attributes.customColor.array

  for (let i = 0; i < particleCount; i++) {
    target.set(0, 0, 0)
    compiledFn(i, particleCount, target, color, clock.elapsedTime, THREE, getControl)
    positions[i * 3]     = target.x
    positions[i * 3 + 1] = target.y
    positions[i * 3 + 2] = target.z
    colors[i * 3]     = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.attributes.position.needsUpdate = true
  geometry.attributes.customColor.needsUpdate = true
})
```

- `getControl` reads from a plain object (not the store) — zero overhead
- `getState()` called once outside the loop — single read per frame
- Adaptive quality: if `delta > 0.020` (below 50fps), gradually reduce `particleCount`. Recovery: scale back up when delta < 0.014 (above 70fps) for 60 consecutive frames. Floor: never go below 1000 particles.

### 6.3 Custom ShaderMaterial

- **Vertex**: passes `vColor` to fragment, computes `gl_PointSize` with distance attenuation
- **Fragment**: soft circle via `smoothstep` on distance from point center, multiplied by `vColor`
- **Blending**: `AdditiveBlending` — overlapping particles glow brighter
- **Settings**: `transparent: true`, `depthWrite: false`

### 6.4 Performance Targets

| Metric | Target |
|--------|--------|
| Particles @ 60fps (desktop) | 20,000 |
| Particles @ 60fps (mobile) | 5,000–8,000 |
| Time to interactive (editor) | < 2s |
| Export snippet size | < 15KB minified (before CDN import) |

---

## 7. Export System

### Modal — 4 Tabs

**Tab 1: Embed Snippet (default)**
Single self-contained `<div>` with inline `<script type="module">`:
- Three.js imported from jsdelivr CDN (v0.170.0 pinned)
- Minimal vanilla Three.js renderer (~80 lines) — no React/R3F in export
- Effect function with current control values baked in
- `pointer-events: none`, `position: absolute`, `inset: 0`, transparent background
- ResizeObserver for container adaptation
- Default 8000 particles (adjustable via slider in modal)
- All exports include `/* Made with PRTCL — prtcl.es */`
- Target: < 15KB minified

**Tab 2: Full HTML**
Complete `<!DOCTYPE html>` page with orbit controls, background, minimal UI. Download as .html.

**Tab 3: Effect Code**
Just the function body. Copy button.

**Tab 4: JSON Preset**
Full `Effect` object as JSON — re-importable into PRTCL. Copy + Download .json.

### Live Preview

The export modal renders the generated HTML in an iframe — user sees exactly what they'll get before copying.

### Key Constraint

Export templates generate vanilla Three.js — zero React dependency in exported code. The template engine in `export-templates.ts` takes effect code + current control values and produces standalone HTML.

---

## 8. Controls — Tweakpane

### Flow

```
Effect selected → compiler dry run → addControl() registers controls in store
                                            ↓
                                  ControlPanel.tsx reads store.controls
                                            ↓
                                  Creates Tweakpane blade per control
                                            ↓
                                  onChange → store.setControl(id, value) → useFrame reads new value
```

When the user switches effects, the Tweakpane instance is destroyed and rebuilt with the new effect's controls.

### Control Types

- **Slider** (min/max/step) — speed, scale, turbulence
- **Color** — Tweakpane native color picker
- **Boolean** (toggle) — bloom, grid
- **Point3D** — positions/offsets
- **List/dropdown** — variant selection

### Global Controls (always visible, above effect controls)

- Particle count (1,000–30,000)
- Point size
- Background color (preview only, not included in embed export)
- Bloom toggle

### Effect Controls (dynamic, below globals)

- Generated by `addControl()` in effect code
- Grouped in Tweakpane folders if the effect organizes them
- Values stored in Zustand, injected into export

---

## 9. Google Fonts — Dynamic Loading

Activates ONLY when a text-category effect is selected. Zero weight for non-text effects.

```
User selects "Text Dissolve"
  → ControlPanel shows text section (input, font picker, size slider)
  → fonts.ts fetches font list from Google Fonts API (cached after first call)
  → User picks a font
  → fonts.ts injects <link> in <head> to load the font
  → text-sampler.ts renders text on offscreen canvas with that font
  → Poisson disk sampling → Float32Array of normalized points
  → Points passed to effect as textPoints parameter
  → Effect animates particles to/from those points
```

**Font picker**: dropdown with font name rendered in its own typeface. Search integrated. Ships with a **static curated list of ~100 popular Google Fonts** (no API key needed). The list is a JSON file in the repo, updated manually. Font CSS loaded on-demand from `fonts.googleapis.com` (public, no key).

---

## 10. Built-in Presets (v1)

12 presets across 4 categories:

| Category | Presets |
|----------|---------|
| Organic | Nebula Organica, Fireflies, Aurora |
| Math | Lorenz Attractor, Spiral Galaxy, DNA Helix |
| Text | Text Dissolve, Text Wave, Text Matrix |
| Abstract | Starfield, Gravity Well, Crystal Growth |

All presets authored by "PRTCL Team" or "Netmilk Studio".

Phase 1 ships with 4: Nebula, Lorenz, Galaxy, Starfield. The rest follow in phases 3-4.

---

## 11. Implementation Phases

1. **Core Engine**: Vite scaffold, ParticleSystem, compiler, validator, Zustand store, 3-panel layout, Tweakpane integration, 4 presets
2. **Export System**: All 4 export modes, modal UI, live preview iframe
3. **Text-to-Particles**: Canvas sampler, Google Fonts loader, 3 text effects, text controls
4. **Polish**: Landing page (static HTML, SEO), gallery, fork system, mobile responsive, performance pass
5. **Launch**: Vercel deploy, prtcl.es DNS, GitHub public

---

## 12. Design Tokens

| Token | Value |
|-------|-------|
| Background | `#050510` |
| Surface | `#0d0d1a` |
| Border | `#1a1a2e` |
| Accent | `#7aa2f7` (electric blue) |
| Code font | JetBrains Mono |
| UI font | Geist or Satoshi (geometric sans) |
| Mode | Dark only (v1) |
