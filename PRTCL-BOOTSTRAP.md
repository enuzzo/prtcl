# PRTCL — Project Bootstrap & Architecture Plan

> **Surprisingly Pointless Orbital Rendering Engine**
> Domain: `prtcl.es` (reads as "particles")
> License: MIT — Netmilk Studio sagl

---

## What Is This

PRTCL is a free, open-source web tool for creating, customizing, and exporting GPU-accelerated particle effects. The primary use case is: someone needs a particle background for their website (Elementor, Webflow, plain HTML, whatever), they open prtcl.es, pick or customize an effect, tweak the parameters, and export a self-contained snippet they paste into their site. Done.

Secondary use case: creative coders, generative artists, and developers who want a playground to prototype and archive particle effects with a proper GUI and real-time preview.

The tool is free, MIT-licensed, runs entirely in the browser, and requires zero accounts or sign-ups.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR for SEO landing pages, static export for the app shell |
| 3D Engine | React Three Fiber + Three.js | React-idiomatic 3D, great ecosystem, drei helpers |
| UI | shadcn/ui + Tailwind CSS 4 | Beautiful defaults, fully customizable, no vendor lock |
| State | Zustand | Lightweight, no boilerplate, works great with R3F |
| Fonts | Google Fonts API (dynamic) | For text-to-particles feature |
| Storage | localStorage + optional cloud sync later | Zero-friction persistence |
| Deployment | Vercel | Obvious for Next.js, free tier is generous |
| Monorepo | Turborepo (optional, later) | If we split editor/export into packages |

---

## Information Architecture

```
prtcl.es/
├── / ...................... Landing page (SEO, hero with live particle demo, CTA)
├── /create ............... Main editor/playground (the core app)
├── /gallery .............. Browse community presets
├── /gallery/[slug] ....... Individual preset detail + fork
├── /docs ................. API reference for writing effects
└── /about ................ Credits, Netmilk, license info
```

---

## Core Architecture

### 1. Effect System

Each effect is a **JavaScript function body** (string) that gets compiled into a function at runtime. The function receives these arguments:

```typescript
interface EffectContext {
  i: number;          // particle index (0 to count-1)
  count: number;      // total particle count
  target: Vector3;    // WRITE — set particle position
  color: Color;       // WRITE — set particle color
  time: number;       // elapsed seconds
  THREE: typeof THREE; // full Three.js library
  addControl: (id: string, label: string, min: number, max: number, initial: number) => number;
  setInfo: (title: string, description: string) => void;
  annotate: (id: string, position: Vector3, label: string) => void;
}
```

Effects are stored as JSON:

```typescript
interface Effect {
  id: string;
  slug: string;           // URL-friendly name
  name: string;
  description: string;
  author: string;
  code: string;           // the function body
  tags: string[];         // e.g. ["organic", "attractor", "text"]
  particleCount: number;  // recommended count (default 15000)
  cameraDistance: number;  // recommended initial zoom
  createdAt: string;
  controls?: Record<string, number>; // saved control values
}
```

### 2. Compilation & Sandboxing

Effects are compiled via `new Function()` with a strict argument list. Before running, each effect goes through:

1. **Static analysis** — regex scan for forbidden patterns (document, window, fetch, eval, etc.)
2. **Dry run** — execute once with i=0, count=100 to catch runtime errors
3. **NaN guard** — if any output coordinate is NaN/Infinity, fall back to origin

### 3. Renderer

Built on React Three Fiber with a custom `<ParticleSystem>` component:

- **Geometry**: `BufferGeometry` with `position` and `customColor` attributes
- **Material**: Custom `ShaderMaterial` with additive blending, soft point sprites
- **Update loop**: `useFrame()` runs the compiled effect function for all particles
- **Performance target**: 60fps with 15k particles on mid-range hardware
- **Adaptive quality**: auto-reduce particle count if frame time exceeds 20ms

### 4. Text-to-Particles System

This is a key differentiator. The flow:

1. User types text and selects a Google Font
2. We render the text to an offscreen `<canvas>` at high resolution
3. Sample the canvas pixels to extract glyph positions
4. Map particle positions to the sampled points
5. Apply particle effects (dissolve, reform, morph, wave, etc.) on top

Implementation:

```typescript
// text-sampler.ts
function sampleText(text: string, font: string, fontSize: number, maxPoints: number): Float32Array {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  // Set canvas size based on text metrics
  ctx.font = `${fontSize}px "${font}"`;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + 20;
  canvas.height = fontSize * 1.5;
  // Draw white text on black
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `${fontSize}px "${font}"`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 10, canvas.height / 2);
  // Sample pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // ... threshold + Poisson disk sampling to get maxPoints positions
  // Return normalized coordinates centered at origin
}
```

Text effects will be a special category in the effect system where the effect code receives an additional `textPoints: Float32Array` parameter with pre-sampled positions.

---

## UI Layout

Three-panel layout (responsive — collapses to tabs on mobile):

```
┌──────────────────────────────────────────────────────┐
│  ☰ PRTCL                                    [Export] │
├─────────┬────────────────────────────┬───────────────┤
│         │                            │               │
│ EFFECTS │                            │  CONTROLS     │
│ BROWSER │      3D VIEWPORT           │               │
│         │      (canvas)              │  [sliders]    │
│ [list]  │                            │  [color]      │
│         │                            │  [text input] │
│         │                            │               │
│ [+New]  │                            │  [Code]  ▼    │
│ [Fork]  │                            │               │
├─────────┴────────────────────────────┴───────────────┤
│  FPS: 60  |  15,000 particles  |  Nebula Organica    │
└──────────────────────────────────────────────────────┘
```

### Left Panel — Effect Browser
- Built-in presets (categorized: Organic, Math, Galaxy, Text, Abstract)
- User's custom effects (from localStorage)
- Community gallery link
- Search/filter by tag
- Fork button on each preset

### Center — Viewport
- Full R3F canvas with orbit controls
- Drag to rotate, scroll to zoom, right-click to pan
- Optional grid floor (toggle)
- Background color picker (for preview)

### Right Panel — Controls
- Dynamic sliders generated by `addControl()` calls
- Global controls: particle count, point size, background color, bloom toggle
- Text section (only visible for text effects): font picker, text input, font size
- Collapsible code editor (Monaco or CodeMirror) at the bottom

### Top Bar
- PRTCL logo (link to landing)
- Export button (opens export modal)

### Bottom Bar (Status)
- FPS counter
- Particle count
- Effect name + description

---

## Export System — The Key Feature

The export modal offers these modes:

### Mode 1: Full HTML (standalone page)
A complete `<!DOCTYPE html>` page with:
- Three.js loaded from CDN (jsdelivr)
- The particle renderer
- Orbit controls
- The selected effect with current control values
- Responsive canvas (fills viewport)

Use case: someone wants a standalone particle page, a screen-saver, a demo.

### Mode 2: Headless / Embeddable (the Elementor killer)
An HTML snippet designed to be pasted into an HTML widget:

```html
<div id="prtcl-bg" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;">
<script type="module">
// Minimal Three.js particle renderer
// No orbit controls, no UI
// Fills parent container
// Transparent background (particles only)
// pointer-events: none so content above is interactive
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
// ... minimal renderer code ...
// ... effect code ...
</script>
</div>
```

Key properties of headless mode:
- **Transparent background** — renders only particles, page shows through
- **pointer-events: none** — doesn't interfere with content above
- **position: absolute + inset: 0** — fills parent container
- **No controls, no UI** — pure visual
- **Responsive** — adapts to container size via ResizeObserver
- **Performance conscious** — lower default particle count (8000)
- **Self-contained** — single `<div>` with inline `<script type="module">`

### Mode 3: Copy Code
Just the effect function body, for use in other engines or our playground.

### Mode 4: JSON Preset
Full effect definition as JSON, importable back into PRTCL.

### Export Modal UI

```
┌─────────────────────────────────────────────────┐
│  Export "Nebula Organica"                    [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ○ Full HTML Page                               │
│    Complete standalone page with controls        │
│                                                 │
│  ● Embed Snippet (Elementor / HTML widget)      │
│    Transparent background, paste into any site   │
│                                                 │
│  ○ Effect Code                                  │
│    Just the function body                       │
│                                                 │
│  ○ JSON Preset                                  │
│    Full preset definition for import            │
│                                                 │
├─────────────────────────────────────────────────┤
│  Preview:                                       │
│  ┌─────────────────────────────────────────┐    │
│  │ <div id="prtcl-bg" style="posit...      │    │
│  │ <script type="module">                  │    │
│  │ import * as THREE from 'https://...     │    │
│  │ ...                                     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Copy to Clipboard]  [Download .html]          │
│                                                 │
│  ℹ Paste this into an Elementor HTML widget,    │
│    set the section height, and you're done.     │
└─────────────────────────────────────────────────┘
```

---

## Built-in Effects (v1)

### Category: Organic
1. **Nebula Organica** — volumetric gas cloud with FBM turbulence and breathing
2. **Fireflies** — bioluminescent particles with random walk and pulsing glow
3. **Aurora** — curtain-like waves of color flowing across space

### Category: Math
4. **Lorenz Attractor** — strange attractor with chaotic trajectories
5. **Spiral Galaxy** — logarithmic spiral arms with orbital dynamics
6. **DNA Helix** — double helix with hydrogen bonds

### Category: Text
7. **Text Dissolve** — text forms from scattered particles, holds, dissolves
8. **Text Wave** — text with sine wave displacement on each character
9. **Text Matrix** — characters rain down Matrix-style, then reform

### Category: Abstract
10. **Starfield** — classic warp-speed star tunnel
11. **Gravity Well** — particles orbit and fall into a central singularity
12. **Crystal Growth** — procedural crystalline structure that grows over time

---

## Gallery / Community System (v1 — simple)

For v1, the gallery is a curated JSON file in the repo. Users can submit effects via GitHub PR or a simple form that creates an issue. No database, no auth.

Structure:

```
/public/gallery/
├── index.json         # list of all gallery effects
├── nebula.json        # individual effect files
├── lorenz.json
└── ...
```

The gallery page at `/gallery` loads `index.json`, shows cards with thumbnails (generated via server-side or OG image), and links to `/gallery/[slug]` which loads the effect in the editor with a "Fork to My Effects" button.

Future (v2+): Supabase or similar for user accounts, effect sharing, likes, etc.

---

## SEO & Landing Page Strategy

The landing page at `/` is critical for organic traffic. Target keywords:
- "particle effect generator"
- "particle background for website"
- "free particle system for Elementor"
- "HTML particle effect"
- "Three.js particle playground"
- "animated background generator"

The landing page should have:
- Live particle demo as hero background
- Clear value prop: "Create stunning particle effects. Export. Paste. Done."
- Three-step visual: Choose → Customize → Export
- Gallery preview of 6 best effects
- SEO-optimized copy targeting the above keywords
- Fast LCP (particle demo can load after first paint)

---

## File Structure

```
prtcl/
├── app/
│   ├── layout.tsx              # Root layout with fonts, metadata
│   ├── page.tsx                # Landing page
│   ├── create/
│   │   └── page.tsx            # Main editor (client component boundary)
│   ├── gallery/
│   │   ├── page.tsx            # Gallery grid
│   │   └── [slug]/
│   │       └── page.tsx        # Individual effect
│   ├── docs/
│   │   └── page.tsx            # API docs
│   └── about/
│       └── page.tsx            # Credits
├── components/
│   ├── editor/
│   │   ├── EditorLayout.tsx    # Three-panel layout
│   │   ├── EffectBrowser.tsx   # Left panel
│   │   ├── Viewport.tsx        # Center panel (R3F canvas)
│   │   ├── ControlPanel.tsx    # Right panel
│   │   ├── ExportModal.tsx     # Export dialog
│   │   └── CodeEditor.tsx      # Inline code editor
│   ├── particles/
│   │   ├── ParticleSystem.tsx  # Core R3F particle component
│   │   ├── PointMaterial.tsx   # Custom shader material
│   │   ├── compiler.ts         # Effect compilation + validation
│   │   └── text-sampler.ts     # Canvas text → point cloud
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── GalleryPreview.tsx
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── effects/
│   │   ├── types.ts            # Effect, Control, ExportConfig types
│   │   ├── presets.ts          # Built-in effects
│   │   ├── validator.ts        # Security + stability validation
│   │   └── export-templates.ts # HTML generation for all export modes
│   ├── store.ts                # Zustand store
│   ├── fonts.ts                # Google Fonts loader utility
│   └── utils.ts
├── public/
│   ├── gallery/                # Gallery JSON files
│   └── og/                     # OG images
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Implementation Order

### Phase 1 — Core Engine (Week 1)
1. Next.js 15 project scaffolding with Tailwind + shadcn/ui
2. `ParticleSystem` R3F component with custom shader
3. Effect compiler with validation + security scanning
4. Zustand store for app state
5. Three-panel editor layout (responsive)
6. Dynamic control system (sliders from `addControl`)
7. 4 built-in presets (Nebula, Lorenz, Galaxy, Starfield)

### Phase 2 — Export System (Week 2)
8. Full HTML export template
9. Headless/embeddable export template
10. Code copy + JSON export
11. Export modal UI
12. Background color picker for preview/export

### Phase 3 — Text-to-Particles (Week 2-3)
13. Canvas text sampling engine
14. Google Fonts dynamic loader
15. 3 text effects (Dissolve, Wave, Matrix)
16. Text controls in right panel (font picker, input, size)

### Phase 4 — Polish & Gallery (Week 3-4)
17. Landing page with live demo
18. Gallery page with curated presets
19. Fork/duplicate system
20. Custom effect editor with syntax highlighting
21. Mobile responsive layout
22. OG images for gallery sharing
23. Performance optimization pass

### Phase 5 — Launch
24. Deploy to Vercel
25. Register prtcl.es, point DNS
26. GitHub repo public
27. Submit to Product Hunt, Reddit (r/webdev, r/threejs), Twitter

---

## Design Direction

### Visual Identity
- **Dark-first** — deep space blacks (#050510) with electric accent
- **Accent color**: electric blue (#7aa2f7) with cyan/green variants
- **Typography**: JetBrains Mono for code/UI, a clean geometric sans for marketing (Geist, Satoshi, or similar)
- **Aesthetic**: mission control meets creative tool — think Figma's precision with a demo-scene edge
- **Logo**: "PRTCL" in a monospace typeface with a subtle particle scatter effect on hover

### UI Principles
- Controls should feel immediate — no submit buttons, everything is live
- Export should be frictionless — two clicks maximum from "I like this" to "it's on my clipboard"
- The 3D viewport should feel premium — smooth orbit, nice bloom, responsive
- Dark mode only for v1 (the effects look better on dark)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Particles @ 60fps (desktop) | 20,000 |
| Particles @ 60fps (mobile) | 5,000–8,000 |
| Time to interactive (editor) | < 2s |
| Export snippet size | < 15KB (minified, before CDN import) |
| Lighthouse score (landing) | > 90 |

---

## Claude Code Instructions

When building this project with Claude Code:

1. **Start with `npx create-next-app@latest prtcl`** — use App Router, TypeScript, Tailwind, ESLint
2. **Install core deps**: `three @react-three/fiber @react-three/drei zustand`
3. **Install shadcn/ui**: follow their Next.js setup, add components as needed
4. **Build incrementally** — follow the phase order above
5. **Test each component in isolation** before integrating
6. **The particle system is the heart** — get it running with one preset before anything else
7. **Export templates should be tested** by actually opening the generated HTML in a browser
8. **Use TypeScript strictly** — proper types for Effect, Control, ExportConfig
9. **Performance is non-negotiable** — profile with Chrome DevTools, optimize the hot loop

---

## Notes

- The project name in package.json should be `prtcl`
- The GitHub repo should be `enuzzo/prtcl` (domain prtcl.es confirmed and registered)
- All built-in presets should have credits: "PRTCL Team" or "Netmilk Studio"
- The export snippet should include a small comment: `/* Made with PRTCL — prtcl.es */`
- Keep Three.js version pinned in exports for CDN stability (currently 0.170.0)
- Google Fonts should be loaded dynamically only when the text feature is used
- The validator should be strict — we're running user code, security matters
