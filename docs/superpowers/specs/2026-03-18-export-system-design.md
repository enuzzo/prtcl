# Phase 2: Export System — Design Spec

## Overview

The Export System turns PRTCL from a demo into a product. Users tweak an effect in the editor, click Export, and get a self-contained snippet to embed anywhere. The primary audience is website builders using Elementor, Webflow, Wix, and WordPress — people searching Google for "particle effects for Elementor" should land on PRTCL and be exporting within minutes.

**Scope note**: The original CLAUDE.md mentions "4 modes" — Video/GIF was the 4th. This has been deliberately dropped from Phase 2. Recording/encoding is a fundamentally different feature from code export, and nobody needs a gif of particles when screen recording exists. Phase 2 ships 3 stellar code-export modes. Video/GIF may be revisited in a future phase if there's demand.

## Export Modes

### 1. Website Embed (default tab)

Self-contained HTML snippet: a single `<div>` containing an inline `<script type="module">` that loads Three.js from CDN (v0.170.0), sets up the scene, compiles the effect, and runs the particle render loop. Copy-paste into any HTML widget on any platform.

**Tab subtitle**: "Works with Elementor, Webflow, Wix, WordPress & any HTML site"

**Generated output structure**:

```html
/* Made with PRTCL — prtcl.es
 * https://github.com/enuzzo/prtcl
 * MIT License © enuzzo
 */
<div id="prtcl-[effect-id]" style="width:100%;height:[height];position:relative;background:[bg]">
<script type="module">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

(function() {
  const container = document.getElementById('prtcl-[effect-id]');
  const COUNT = [particleCount];
  const POINT_SIZE = [pointSize];
  const BG = '[backgroundColor]';
  const AUTO_ROTATE = [autoRotateSpeed];
  const CAMERA_POS = [[camX], [camY], [camZ]];
  const CAMERA_TARGET = [[targetX], [targetY], [targetZ]];
  const CONTROLS = { [bakedControlValues] };

  // Vertex shader
  const vertexShader = `[inline vertex shader]`;

  // Fragment shader
  const fragmentShader = `[inline fragment shader]`;

  // Effect function (pre-validated, built-in preset)
  // Parameter name is 'addControl' to match how effects are authored.
  // In export context, addControl(id, ...) simply returns the baked value.
  const effectFn = new Function(
    'i','count','target','color','time','THREE','addControl','setInfo',
    'textPoints','camX','camY','camZ','pointerX','pointerY','pointerZ',
    'bass','mids','highs','energy','beat',
    `[effect code body]`
  );

  // Scene setup
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(...CAMERA_POS);

  // OrbitControls (conditional)
  [if orbitControls: const controls = new OrbitControls(camera, canvas);
   controls.target.set(...CAMERA_TARGET); controls.update();]
  [if autoRotate: controls.autoRotate = true; controls.autoRotateSpeed = AUTO_ROTATE;]

  // BufferGeometry + ShaderMaterial
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uPointSize: { value: POINT_SIZE } },
    vertexShader, fragmentShader,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(geometry, material));

  // Reusable objects (zero allocations in hot loop)
  const target = new THREE.Vector3();
  const color = new THREE.Color();
  // addControl(id, label, min, max, initial) → returns baked value, ignoring declaration args
  const addControl = (id) => CONTROLS[id] ?? 0;
  const setInfo = () => {};
  let pointer = { x: 0, y: 0, z: 0 };
  const startTime = performance.now();

  // Pointer tracking (conditional)
  [if pointerReactive: raycaster + mousemove handler]

  // Resize observer
  const ro = new ResizeObserver(() => { ... });
  ro.observe(container);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    const time = (performance.now() - startTime) / 1000;
    for (let i = 0; i < COUNT; i++) {
      target.set(0, 0, 0);
      color.set(1, 1, 1);
      effectFn(i, COUNT, target, color, time, THREE, addControl, setInfo,
        undefined, camera.position.x, camera.position.y, camera.position.z,
        pointer.x, pointer.y, pointer.z, 0, 0, 0, 0, 0);
      if (!isFinite(target.x)) { target.set(0, 0, 0); }
      positions[i*3] = target.x; positions[i*3+1] = target.y; positions[i*3+2] = target.z;
      colors[i*3] = color.r; colors[i*3+1] = color.g; colors[i*3+2] = color.b;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.customColor.needsUpdate = true;
    [if orbitControls: controls.update();]
    renderer.render(scene, camera);
  }
  animate();

  // Badge (conditional)
  [if badge: append small "Made with PRTCL" overlay]
})();
</script>
</div>
```

**Key decisions**:
- ES modules (`type="module"`) for clean CDN imports. All modern browsers support this.
- Container found via `document.getElementById()` with a unique ID. (`document.currentScript` is null in module scripts — cannot be used.)
- Parameter name is `addControl` (not `getControl`) to match how effects are authored. In export, the function simply returns the baked value and ignores declaration args (label, min, max, initial).
- Both `cameraPosition` AND `cameraTarget` are captured and applied to OrbitControls. Effects like Black Hole or Starfield may have non-origin targets.
- NaN guard in the hot loop (same as ParticleSystem.tsx).
- Audio params passed as 0 — no mic access in embed.
- Pointer tracking is opt-in: only included when the effect uses `pointerX/Y/Z` and user enables it.
- ResizeObserver keeps canvas responsive to container size changes.
- **Security note**: Currently only built-in presets (authored by PRTCL Team, pre-validated) are exported. If user-authored effects become exportable in a future phase, the security model will need revisiting (e.g., running the validator pipeline in the export generator).

### 2. React Component

Generates a `.tsx` file using React Three Fiber and drei. For React/Next.js developers.

**Generated output structure**:

```tsx
/* Made with PRTCL — prtcl.es
 * https://github.com/enuzzo/prtcl
 * MIT License © enuzzo
 */

// Effect: [Effect Name] by [Author]
// Dependencies: three, @react-three/fiber, @react-three/drei

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const EFFECT_CODE = `[effect code body]`

const VERTEX_SHADER = `[vertex shader]`
const FRAGMENT_SHADER = `[fragment shader]`

const DEFAULT_CONTROLS = { [bakedControlValues] }

interface PrtclEffectProps {
  count?: number
  pointSize?: number
  background?: string
  autoRotate?: boolean
  autoRotateSpeed?: number
  controls?: Record<string, number>
  style?: React.CSSProperties
}

function ParticleCloud({
  count = [count],
  pointSize = [pointSize],
  controls = DEFAULT_CONTROLS,
}: { count: number; pointSize: number; controls: Record<string, number> }) {
  const meshRef = useRef<THREE.Points>(null!)
  const { camera } = useThree()

  const { positions, colors, geometry, material, effectFn, target, color } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: { uPointSize: { value: pointSize } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const effectFn = new Function(
      'i','count','target','color','time','THREE','addControl','setInfo',
      'textPoints','camX','camY','camZ','pointerX','pointerY','pointerZ',
      'bass','mids','highs','energy','beat',
      EFFECT_CODE
    )
    const target = new THREE.Vector3()
    const color = new THREE.Color()
    return { positions, colors, geometry, material, effectFn, target, color }
  }, [count, pointSize])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    const addControl = (id: string) => controls[id] ?? 0
    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      effectFn(i, count, target, color, time, THREE, addControl, () => {},
        undefined, camera.position.x, camera.position.y, camera.position.z,
        0, 0, 0, 0, 0, 0, 0, 0)
      if (!isFinite(target.x)) target.set(0, 0, 0)
      positions[i*3] = target.x; positions[i*3+1] = target.y; positions[i*3+2] = target.z
      colors[i*3] = color.r; colors[i*3+1] = color.g; colors[i*3+2] = color.b
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.customColor.needsUpdate = true
  })

  return <points ref={meshRef} geometry={geometry} material={material} />
}

export default function PrtclEffect({
  count = [count],
  pointSize = [pointSize],
  background = '[bg]',
  autoRotate = [bool],
  autoRotateSpeed = [speed],
  controls = DEFAULT_CONTROLS,
  style,
}: PrtclEffectProps) {
  return (
    <Canvas
      camera={{ position: [[camX], [camY], [camZ]], fov: 60 }}
      style={{ background, ...style }}
    >
      <ParticleCloud count={count} pointSize={pointSize} controls={controls} />
      <OrbitControls
        autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed}
        target={[[targetX], [targetY], [targetZ]]}
      />
    </Canvas>
  )
}
```

**Key decisions**:
- Exports a single default component with configurable props.
- Uses `useMemo` for allocations, `useFrame` for hot loop — same zero-allocation pattern as PRTCL's own ParticleSystem.
- Peer dependencies: `three`, `@react-three/fiber`, `@react-three/drei` (noted in comment header).
- Controls are overridable via props.
- Camera target baked from preset (important for effects with non-origin targets).
- PRTCL badge optionally included as an absolute-positioned HTML overlay via `<Html>` from drei or a CSS overlay on the wrapping div.

### 3. Iframe Embed

An `<iframe>` pointing to a lightweight embed route on prtcl.es. Simplest option — zero code.

**Generated output**:

```html
<!-- Made with PRTCL — prtcl.es | MIT License © enuzzo -->
<iframe
  src="https://prtcl.es/embed?effect=[id]&particles=[count]&pointSize=[size]&bg=[color]&rotate=[speed]&controls=[jsonEncoded]"
  width="100%" height="400"
  frameborder="0" allow="autoplay"
  style="border:none;border-radius:8px"
></iframe>
```

**Embed route** (`/embed`):
- New lightweight component `EmbedView.tsx` rendered at `/embed`.
- Reads URL search params, resolves preset by ID from `ALL_PRESETS`.
- Renders a stripped-down R3F canvas: no TopBar, no panels, no splash, no hand tracking, no audio.
- Overrides particle count, point size, background, auto-rotate, and control values from URL params.
- Optional `badge=0` param to hide the PRTCL watermark.
- Works only for built-in presets (no custom code in URL — security boundary).
- **URL length note**: Effects with many controls could approach browser URL limits (~2000 chars for safe cross-browser compatibility). Current presets have 2-5 controls with short IDs, so this is not an issue now. If future presets have many controls, the generator should warn or truncate.

**URL params**:
| Param | Type | Description |
|-------|------|-------------|
| `effect` | string | Preset ID (e.g., `frequency`, `hopf`, `nebula`) |
| `particles` | number | Particle count override |
| `pointSize` | number | Point size override |
| `bg` | string | Background color (hex without #) |
| `rotate` | number | Auto-rotate speed (0 = off) |
| `orbit` | 0\|1 | Enable orbit controls (default 1) |
| `controls` | string | URL-encoded JSON of control values |
| `badge` | 0\|1 | Show PRTCL badge (default 1) |

## Export Modal

### Entry Point

The existing Export button in TopBar (desktop only). Click opens the modal overlay.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Export "[Effect Name]"                                [✕]  │
├─────────────────────────────────────────────────────────────┤
│  [● Website Embed]  [ React Component ]  [ Iframe ]         │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   ┌──────────────┐   │  SETTINGS                            │
│   │              │   │                                      │
│   │  Live        │   │  Particles    [========●=] 10000    │
│   │  Preview     │   │  Height       [400px        ▾]      │
│   │  (mini R3F   │   │  Background   [■ #08040E    ]       │
│   │   canvas)    │   │  Auto-rotate  [●] 0.5              │
│   │              │   │  Orbit ctrl   [●] On                │
│   │              │   │  Pointer      [●] On                │
│   │              │   │  PRTCL badge  [●] On                │
│   └──────────────┘   │                                      │
│                      ├──────────────────────────────────────┤
│   Effect controls    │                                      │
│   are frozen at      │  ┌────────────────────────────────┐ │
│   current values     │  │ /* Made with PRTCL ...  */     │ │
│                      │  │ <div id="prtcl-frequency" ...> │ │
│                      │  │   <script type="module">       │ │
│                      │  │     import * as THREE ...      │ │
│                      │  │     ...                        │ │
│                      │  │   </script>                    │ │
│                      │  │ </div>                         │ │
│                      │  └────────────────────────────────┘ │
│                      │                                      │
│                      │  [  📋 Copy to Clipboard  ] [ ⬇ ]  │
│                      │  ~4.2 KB · 142 lines                │
└──────────────────────┴──────────────────────────────────────┘
```

### Live Preview

A mini R3F canvas (~300x300 or responsive to modal width) running the effect with the exact export settings. When the user changes particle count, the preview updates in real-time. Gives confidence that what you see is what you export.

The preview uses the same `ParticleSystem` component from the engine but with overridden settings (reduced count, export bg color, etc.).

### Settings Panel

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Particles | slider | Effect default (capped at 15000) | Range: 1000-20000 |
| Height | dropdown | 400px | Options: 300px, 400px, 500px, 600px, Full viewport |
| Background | color input | Current editor bg (#08040E) | Hex color |
| Auto-rotate | slider | Current value | 0 = off |
| Orbit controls | toggle | On | Viewer can drag to rotate |
| Pointer reactive | toggle | On (if effect uses pointer) | Hidden if effect doesn't use pointer |
| PRTCL badge | toggle | On | Small "Made with PRTCL" in corner |

Settings that don't apply to a specific mode are hidden. For example, "Height" doesn't apply to React (the component fills its container) or Iframe (set via iframe attributes).

### Code Display

- Syntax-highlighted code block with monospace font (Inconsolata).
- Line numbers on the left.
- Copy to Clipboard button (primary CTA, large, accent2 color).
- Download button (secondary, downloads as file). Filenames: `prtcl-[effect-slug].html` (Website), `PrtclEffect.tsx` (React), `prtcl-[effect-slug]-embed.html` (Iframe).
- File size estimate and line count shown below.
- Tab key switches between modes; code regenerates when settings change.

### Code Highlighting

Lightweight CSS-based highlighting — no external dependency. Token-based coloring for HTML/JSX/JS. Matches the acid-pop theme:
- **Comments**: `#A98ED1` (muted purple)
- **Strings**: `#FF2BD6` (accent1 hot pink)
- **Keywords** (import, const, function, if, return): `#7CFF00` (accent2 lime)
- **HTML tags**: `#2CF4FF` (info cyan)
- **Numbers**: `#FFD553` (warning gold)
- **Default text**: `#F9F4FF` (primary text)

### Interactions

- **Open**: Export button click → modal fades in (300ms, same as panel transitions).
- **Close**: Click ✕, click backdrop, or press Escape.
- **Copy**: Click copy → button text changes to "Copied!" (2s) with success color.
- **Download**: Triggers browser download of the generated file.
- **Tab switch**: Instant code regeneration. Preview stays the same (effect doesn't change).
- **Settings change**: Code regenerates, preview updates in real-time.

### Unavailable Effects

If the current effect uses `renderer: 'custom'` (Paper Fleet), the Export button shows a tooltip: "Export not available for custom renderer effects." Modal doesn't open. This is a known limitation documented in the UI.

## File Architecture

```
src/export/
  ExportModal.tsx             — Modal overlay, tab navigation, backdrop
  ExportPreview.tsx           — Mini R3F canvas matching export settings
  ExportSettings.tsx          — Settings panel (shared across tabs)
  CodeBlock.tsx               — Syntax-highlighted code display + copy/download
  tabs/
    WebsiteEmbedTab.tsx       — Website embed tab layout
    ReactTab.tsx              — React component tab layout
    IframeTab.tsx             — Iframe tab layout
  generators/
    html-generator.ts         — Generates complete HTML embed snippet
    react-generator.ts        — Generates React/R3F component code
    iframe-generator.ts       — Generates iframe snippet + embed URL
  templates/
    shader-strings.ts         — Vertex + fragment shaders as template strings
    html-shell.ts             — HTML wrapper template
    credits.ts                — Comment header with credits/license
  types.ts                    — ExportSettings, ExportMode interfaces

src/embed/
  EmbedView.tsx               — /embed route: URL params → stripped canvas
```

### Module Responsibilities

**ExportModal.tsx**: Top-level container. Rendered inside `EditorLayout.tsx` as a sibling to the three-panel layout (not inside any panel). Uses a portal or absolute positioning to overlay the entire viewport. Manages modal open/close state (from Zustand store), active tab, and passes settings to child components. Renders backdrop with click-to-close. Keyboard: Escape to close. Focus is trapped inside the modal when open (Tab cycles through settings, tabs, and buttons). `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the title.

**ExportPreview.tsx**: Self-contained R3F `<Canvas>` that mirrors export settings. Accepts particle count, point size, background, auto-rotate as props. Does NOT reuse the global Zustand store — instead, creates an isolated mini particle renderer that accepts all settings as props. This avoids polluting the editor state when the user adjusts export-specific settings (e.g., lower particle count). The preview component contains its own `useFrame` loop with the same hot-loop pattern as `ParticleSystem.tsx` but reads from props, not the store.

**ExportSettings.tsx**: Form controls for export configuration. Reads current editor state as initial values. Emits settings changes upward. Hides irrelevant settings per tab (e.g., "Height" hidden for React tab).

**CodeBlock.tsx**: Receives a code string and language type. Renders with syntax highlighting, line numbers, copy button, download button, file size. Uses a simple tokenizer (regex-based) for HTML/JSX/JS highlighting in acid-pop theme colors.

**generators/html-generator.ts**: Pure function. Takes `ExportSettings` + `Effect` + current control values → returns a complete HTML string. This is the core of the export system. It inlines the shader code, effect function body, all configuration, and the render loop. Handles conditional sections (OrbitControls import, pointer tracking, badge overlay) via template assembly.

**generators/react-generator.ts**: Pure function. Takes same inputs → returns a `.tsx` file string. Generates a typed React component with props interface. Includes dependency comment header.

**generators/iframe-generator.ts**: Pure function. Takes same inputs → returns iframe HTML snippet + the embed URL. Encodes settings as URL search params.

**templates/shader-strings.ts**: Exports `VERTEX_SHADER` and `FRAGMENT_SHADER` as string constants. These are the exact same shaders from `ShaderMaterial.ts`, extracted as embeddable strings.

**templates/credits.ts**: Exports the standard credit comment block:
```
/* Made with PRTCL — prtcl.es
 * https://github.com/enuzzo/prtcl
 * MIT License © enuzzo
 */
```

**src/embed/EmbedView.tsx**: A new route component for `/embed`. Reads URL search params (`effect`, `particles`, `pointSize`, `bg`, `rotate`, `orbit`, `controls`, `badge`). Resolves the preset from `ALL_PRESETS` by ID. Renders a minimal R3F scene: just `Canvas` + `ParticleSystem` + optional `OrbitControls` + optional PRTCL badge. No TopBar, no editor panels, no splash screen. Full viewport.

Error handling:
- Invalid effect ID → renders "Effect not found" message with link to prtcl.es.
- Malformed numeric params (non-numeric `particles`, etc.) → falls back to preset defaults via `parseInt(value) || presetDefault`.
- Invalid hex color for `bg` → falls back to `#08040E`.
- Malformed `controls` JSON → falls back to preset control defaults (try/catch around `JSON.parse`).

## Store Changes

Add to Zustand store (`src/store.ts`):

```typescript
// Export modal state
exportModalOpen: boolean
setExportModalOpen: (open: boolean) => void
```

No other store changes needed. Export settings are local to the modal (React state), not persisted in the global store. The modal reads current effect, controls, and camera state from the existing store.

## Routing Changes

Update `src/App.tsx` to add:

```typescript
'/embed' → <EmbedView />
```

The embed route should NOT show the splash screen or any editor UI.

## What Is NOT Exported

- **Hand tracking**: Requires MediaPipe WASM (~4MB). Too heavy for an embed.
- **Audio reactivity**: Requires `getUserMedia` mic access. Inappropriate for passive embeds.
- **Paper Fleet**: Custom renderer using instanced mesh. Fundamentally different from particle system. Modal shows "Export not available" for custom renderer effects.
- **Morph transitions**: Export is a single effect, no switching.
- **Adaptive quality**: Export uses a fixed particle count. No framerate detection needed.
- **Splash screen**: Not relevant for embeds.
- **Text effects**: Phase 3 feature. When text effects are built, export will need updating.

## Pointer Tracking in Exports

Effects that use `pointerX/Y/Z` (Magnetic Dust, Fibonacci Crystal) get pointer tracking in HTML exports when the "Pointer reactive" toggle is on. Implementation:

- A `Raycaster` + invisible plane at z=0 for hit testing.
- `mousemove` event on the container updates pointer coordinates.
- Lightweight — adds ~15 lines to the export.
- Defaults to (0, 0, 0) when no mouse interaction (effects must handle this gracefully — they already do).

React exports include pointer tracking via R3F's built-in pointer events.
Iframe embeds inherit pointer from the parent embed route.

## PRTCL Badge

A small semi-transparent badge positioned at bottom-right of the canvas container. Links to prtcl.es. Styled to be unobtrusive but visible.

```html
<a href="https://prtcl.es" target="_blank" rel="noopener"
   style="position:absolute;bottom:8px;right:8px;
          font:10px/1 'Inconsolata',monospace;
          color:rgba(249,244,255,0.4);text-decoration:none;
          pointer-events:auto;z-index:1">
  Made with PRTCL
</a>
```

Default ON. When toggled off, only the code comment credits remain.

## Performance Targets

- **Export modal open**: < 200ms (preview canvas initializes lazily).
- **Code generation**: < 50ms (string templates, no heavy computation).
- **Preview FPS**: 60fps at export particle count on desktop.
- **Generated snippet size**: ~3-5 KB minified for typical effects.
- **Iframe load**: < 1s on broadband (loads Three.js from CDN, which is usually cached).

## Testing Strategy

- **Generator unit tests**: Each generator function tested with mock effect data. Verify output contains required elements (CDN URLs, shader code, effect body, credits comment).
- **Snapshot tests**: Generated code snapshots to catch unintended changes.
- **Integration test**: Export modal opens, settings change code, copy works.
- **Manual E2E**: Paste HTML export into a blank page, verify it renders. Paste into Elementor HTML widget, verify it works.
