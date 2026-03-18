# Export System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Export System (Phase 2) — 3 export modes (Website Embed, React Component, Iframe), an export modal with live preview, and an embed route.

**Architecture:** Pure generator functions produce code strings from effect + settings. An ExportModal component with tabbed UI orchestrates the experience. A standalone ExportPreview component (isolated from the global store) shows a live mini-canvas. The `/embed` route renders a stripped-down canvas for iframe embeds.

**Tech Stack:** React 19, TypeScript strict, Zustand, React Three Fiber, Three.js (CDN v0.170.0 for exports), Tailwind CSS 4, Vite 6.

**Spec:** `docs/superpowers/specs/2026-03-18-export-system-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/export/types.ts` | `ExportSettings` and `ExportMode` interfaces |
| `src/export/templates/credits.ts` | Standard comment header (MIT, enuzzo, repo link) |
| `src/export/templates/shader-strings.ts` | Vertex + fragment shaders as embeddable strings |
| `src/export/generators/html-generator.ts` | Generates self-contained HTML embed snippet |
| `src/export/generators/react-generator.ts` | Generates React/R3F component `.tsx` |
| `src/export/generators/iframe-generator.ts` | Generates iframe snippet + URL |
| `src/export/CodeBlock.tsx` | Syntax-highlighted code display + copy/download |
| `src/export/ExportSettings.tsx` | Settings panel (particles, height, bg, toggles) |
| `src/export/IsolatedParticleSystem.tsx` | Shared standalone particle renderer (props-driven, no store) |
| `src/export/ExportPreview.tsx` | Isolated mini R3F canvas matching export settings |
| `src/export/tabs/WebsiteEmbedTab.tsx` | Website Embed tab layout |
| `src/export/tabs/ReactTab.tsx` | React Component tab layout |
| `src/export/tabs/IframeTab.tsx` | Iframe tab layout |
| `src/export/ExportModal.tsx` | Modal overlay with tabs, preview, settings, code |
| `src/embed/EmbedView.tsx` | `/embed` route — URL params → stripped canvas |
| `src/__tests__/export/html-generator.test.ts` | Tests for HTML generator |
| `src/__tests__/export/react-generator.test.ts` | Tests for React generator |
| `src/__tests__/export/iframe-generator.test.ts` | Tests for iframe generator |

### Modified files

| File | Change |
|------|--------|
| `src/store.ts` | Add `exportModalOpen` + `setExportModalOpen` |
| `src/editor/TopBar.tsx` | Wire Export button onClick |
| `src/editor/EditorLayout.tsx` | Mount `ExportModal` |
| `src/App.tsx` | Add `/embed` route |

---

## Task 1: Foundation — Types, Credits, Store

**Files:**
- Create: `src/export/types.ts`
- Create: `src/export/templates/credits.ts`
- Modify: `src/store.ts:6,30-31,97`

- [ ] **Step 1: Create export types**

```typescript
// src/export/types.ts
import type { Effect, Control } from '../engine/types'

export type ExportMode = 'website' | 'react' | 'iframe'

export interface ExportSettings {
  particleCount: number
  pointSize: number
  height: string           // '400px', '500px', '100vh', etc.
  backgroundColor: string  // hex e.g. '#08040E'
  autoRotateSpeed: number  // 0 = off
  orbitControls: boolean
  pointerReactive: boolean
  showBadge: boolean
}

/** Everything a generator needs to produce output */
export interface ExportPayload {
  effect: Effect
  controls: Record<string, number>  // baked control values
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  settings: ExportSettings
}
```

- [ ] **Step 2: Create credits template**

```typescript
// src/export/templates/credits.ts
export const CREDITS_COMMENT = `/* Made with PRTCL — prtcl.es
 * https://github.com/enuzzo/prtcl
 * MIT License © enuzzo
 */`

export const CREDITS_HTML_COMMENT = `<!-- Made with PRTCL — prtcl.es | https://github.com/enuzzo/prtcl | MIT License © enuzzo -->`
```

- [ ] **Step 3: Add export state to Zustand store**

In `src/store.ts`, add to `PrtclState` interface (after line 30 `isFullscreen: boolean`):

```typescript
  // Export
  exportModalOpen: boolean
```

Add action (after line 61 `setIsFullscreen`):

```typescript
  setExportModalOpen: (open: boolean) => void
```

Add implementation in `create()` (after line 133 `setIsFullscreen`):

```typescript
  // Export
  exportModalOpen: false,
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc -b`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/export/types.ts src/export/templates/credits.ts src/store.ts
git commit -m "feat(export): add types, credits template, store state"
```

---

## Task 2: Shader Strings

**Files:**
- Create: `src/export/templates/shader-strings.ts`

- [ ] **Step 1: Create shader-strings.ts**

Extract the exact shaders from `src/engine/ShaderMaterial.ts` as embeddable template literals:

```typescript
// src/export/templates/shader-strings.ts

/** Vertex shader — perspective-scaled point sprites with custom color attribute */
export const VERTEX_SHADER = `
attribute vec3 customColor;
varying vec3 vColor;
uniform float uPointSize;

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uPointSize * (20.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}`.trim()

/** Fragment shader — soft circle with additive blending */
export const FRAGMENT_SHADER = `
varying vec3 vColor;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, dist);
  gl_FragColor = vec4(vColor, alpha);
}`.trim()
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/export/templates/shader-strings.ts
git commit -m "feat(export): extract shader strings for embedding"
```

---

## Task 3: HTML Generator (TDD)

The core of the export system. Pure function: payload → HTML string.

**Files:**
- Create: `src/export/generators/html-generator.ts`
- Create: `src/__tests__/export/html-generator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/export/html-generator.test.ts
import { describe, it, expect } from 'vitest'
import { generateHtmlEmbed } from '../../export/generators/html-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'test-effect',
    slug: 'test-effect',
    name: 'Test Effect',
    description: 'A test',
    author: 'PRTCL Team',
    code: 'target.set(Math.sin(i + time), Math.cos(i + time), 0); color.set(1, 0.5, 0);',
    tags: ['test'],
    category: 'math',
    particleCount: 5000,
    pointSize: 3,
    cameraDistance: 5,
    cameraPosition: [0, 0, 5],
    cameraTarget: [0, 0, 0],
    autoRotateSpeed: 0.5,
    createdAt: '2026-01-01',
  },
  controls: { speed: 1.2, size: 0.5 },
  cameraPosition: [0, 2, 8],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 5000,
    pointSize: 3,
    height: '400px',
    backgroundColor: '#08040E',
    autoRotateSpeed: 0.5,
    orbitControls: true,
    pointerReactive: false,
    showBadge: true,
  },
}

describe('generateHtmlEmbed', () => {
  it('includes PRTCL credits comment', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('Made with PRTCL')
    expect(html).toContain('github.com/enuzzo/prtcl')
    expect(html).toContain('MIT License © enuzzo')
  })

  it('generates a self-contained div with unique id', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('<div id="prtcl-test-effect"')
    expect(html).toContain('</div>')
  })

  it('includes Three.js CDN import pinned to v0.170.0', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('cdn.jsdelivr.net/npm/three@0.170.0')
    expect(html).toContain('three.module.min.js')
  })

  it('includes OrbitControls import when enabled', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('OrbitControls')
    expect(html).toContain('controls/OrbitControls.js')
  })

  it('omits OrbitControls when disabled', () => {
    const noOrbit = {
      ...mockPayload,
      settings: { ...mockPayload.settings, orbitControls: false },
    }
    const html = generateHtmlEmbed(noOrbit)
    expect(html).not.toContain('OrbitControls')
  })

  it('inlines the vertex and fragment shaders', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('gl_PointSize')
    expect(html).toContain('gl_PointCoord')
    expect(html).toContain('smoothstep')
  })

  it('bakes effect code into a new Function()', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('new Function(')
    expect(html).toContain("'addControl'")
    expect(html).toContain(mockPayload.effect.code)
  })

  it('bakes control values', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('"speed": 1.2')
    expect(html).toContain('"size": 0.5')
  })

  it('sets camera position and target', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('0, 2, 8')  // camera position
    expect(html).toContain('target.set(0, 0, 0)') // orbit target
  })

  it('includes container height and background', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('height:400px')
    expect(html).toContain('#08040E')
  })

  it('includes PRTCL badge when enabled', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('prtcl.es')
    expect(html).toContain('Made with PRTCL')
  })

  it('omits badge when disabled', () => {
    const noBadge = {
      ...mockPayload,
      settings: { ...mockPayload.settings, showBadge: false },
    }
    const html = generateHtmlEmbed(noBadge)
    // Credits comment stays, but badge link is removed
    expect(html).not.toContain('target="_blank"')
  })

  it('includes NaN guard in render loop', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('isFinite')
  })

  it('includes ResizeObserver', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('ResizeObserver')
  })

  it('uses addControl parameter name (not getControl)', () => {
    const html = generateHtmlEmbed(mockPayload)
    // The new Function() param list must use 'addControl'
    expect(html).toMatch(/'addControl'/)
    // The runtime lookup function is also named addControl
    expect(html).toContain('const addControl = (id')
  })

  it('includes auto-rotate speed when set', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('autoRotate = true')
    expect(html).toContain('autoRotateSpeed = 0.5')
  })

  it('includes pointer tracking when enabled', () => {
    const withPointer = {
      ...mockPayload,
      settings: { ...mockPayload.settings, pointerReactive: true },
    }
    const html = generateHtmlEmbed(withPointer)
    expect(html).toContain('Raycaster')
    expect(html).toContain('mousemove')
  })

  it('omits pointer tracking when disabled', () => {
    const noPointer = {
      ...mockPayload,
      settings: { ...mockPayload.settings, pointerReactive: false },
    }
    const html = generateHtmlEmbed(noPointer)
    expect(html).not.toContain('Raycaster')
    expect(html).not.toContain('mousemove')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/export/html-generator.test.ts`
Expected: All tests FAIL (module not found)

- [ ] **Step 3: Implement HTML generator**

Create `src/export/generators/html-generator.ts`. This is the largest single file in the export system. It assembles the HTML string from template parts.

```typescript
// src/export/generators/html-generator.ts
import { CREDITS_COMMENT } from '../templates/credits'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../templates/shader-strings'
import type { ExportPayload } from '../types'

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0'

export function generateHtmlEmbed(payload: ExportPayload): string {
  const { effect, controls, cameraPosition, cameraTarget, settings } = payload
  const {
    particleCount, pointSize, height, backgroundColor,
    autoRotateSpeed, orbitControls, pointerReactive, showBadge,
  } = settings

  const id = `prtcl-${effect.id}`
  const controlsJson = JSON.stringify(controls, null, 2).replace(/\n/g, '\n    ')

  // --- Build imports ---
  const imports = [
    `import * as THREE from '${THREE_CDN}/build/three.module.min.js';`,
  ]
  if (orbitControls) {
    imports.push(`import { OrbitControls } from '${THREE_CDN}/examples/jsm/controls/OrbitControls.js';`)
  }

  // --- Build OrbitControls setup ---
  const orbitSetup = orbitControls ? `
    // OrbitControls
    const orbit = new OrbitControls(camera, canvas);
    orbit.target.set(${cameraTarget.join(', ')});
    orbit.enableDamping = true;${autoRotateSpeed ? `
    orbit.autoRotate = true;
    orbit.autoRotateSpeed = ${autoRotateSpeed};` : ''}
    orbit.update();` : ''

  const orbitUpdate = orbitControls ? '\n      orbit.update();' : ''

  // --- Build pointer tracking ---
  const pointerSetup = pointerReactive ? `
    // Pointer tracking
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointerWorld = new THREE.Vector3();
    let pX = 0, pY = 0, pZ = 0;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(pointerPlane, pointerWorld)) {
        pX = pointerWorld.x; pY = pointerWorld.y; pZ = pointerWorld.z;
      }
    });
    canvas.addEventListener('mouseleave', () => { pX = 0; pY = 0; pZ = 0; });` : `
    let pX = 0, pY = 0, pZ = 0;`

  // --- Build badge ---
  const badgeHtml = showBadge ? `
    // Badge
    const badge = document.createElement('a');
    badge.href = 'https://prtcl.es';
    badge.target = '_blank';
    badge.rel = 'noopener';
    badge.textContent = 'Made with PRTCL';
    badge.style.cssText = 'position:absolute;bottom:8px;right:8px;font:10px/1 monospace;color:rgba(249,244,255,0.4);text-decoration:none;pointer-events:auto;z-index:1';
    container.appendChild(badge);` : ''

  // --- Assemble full HTML ---
  return `${CREDITS_COMMENT}
<div id="${id}" style="width:100%;height:${height};position:relative;background:${backgroundColor}">
<script type="module">
${imports.join('\n')}

(function() {
  const container = document.getElementById('${id}');
  if (!container) return;

  const COUNT = ${particleCount};
  const POINT_SIZE = ${pointSize};
  const CONTROLS = ${controlsJson};

  // Shaders
  const vertexShader = \`${VERTEX_SHADER}\`;
  const fragmentShader = \`${FRAGMENT_SHADER}\`;

  // Effect: ${effect.name} by ${effect.author}
  const effectFn = new Function(
    'i', 'count', 'target', 'color', 'time', 'THREE',
    'addControl', 'setInfo', 'textPoints',
    'camX', 'camY', 'camZ',
    'pointerX', 'pointerY', 'pointerZ',
    'bass', 'mids', 'highs', 'energy', 'beat',
    ${JSON.stringify(effect.code)}
  );

  // Scene
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('${backgroundColor}');
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(${cameraPosition.join(', ')});
${orbitSetup}

  // Particles
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uPointSize: { value: POINT_SIZE } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geometry, material));

  // Reusable objects
  const target = new THREE.Vector3();
  const color = new THREE.Color();
  const addControl = (id) => CONTROLS[id] ?? 0;
  const setInfo = () => {};
  const startTime = performance.now();
${pointerSetup}

  // Resize
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  // Animate
  function animate() {
    requestAnimationFrame(animate);
    const time = (performance.now() - startTime) / 1000;
    for (let i = 0; i < COUNT; i++) {
      target.set(0, 0, 0);
      color.set(1, 1, 1);
      effectFn(i, COUNT, target, color, time, THREE, addControl, setInfo,
        undefined, camera.position.x, camera.position.y, camera.position.z,
        pX, pY, pZ, 0, 0, 0, 0, 0);
      if (!isFinite(target.x)) { target.set(0, 0, 0); }
      const idx = i * 3;
      positions[idx] = target.x; positions[idx+1] = target.y; positions[idx+2] = target.z;
      colors[idx] = color.r; colors[idx+1] = color.g; colors[idx+2] = color.b;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.customColor.needsUpdate = true;${orbitUpdate}
    renderer.render(scene, camera);
  }
  animate();
${badgeHtml}
})();
</script>
</div>`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/export/html-generator.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/export/generators/html-generator.ts src/__tests__/export/html-generator.test.ts
git commit -m "feat(export): HTML embed generator with tests"
```

---

## Task 4: React Generator (TDD)

**Files:**
- Create: `src/export/generators/react-generator.ts`
- Create: `src/__tests__/export/react-generator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/export/react-generator.test.ts
import { describe, it, expect } from 'vitest'
import { generateReactComponent } from '../../export/generators/react-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'frequency',
    slug: 'frequency',
    name: 'Fractal Frequency',
    description: 'Audio-reactive fractal',
    author: 'PRTCL Team',
    code: 'target.set(i * 0.01, 0, 0);',
    tags: ['math'],
    category: 'math',
    particleCount: 10000,
    pointSize: 4,
    cameraDistance: 5,
    cameraPosition: [0, 0, 5],
    cameraTarget: [0, 0, 0],
    autoRotateSpeed: 0.5,
    createdAt: '2026-01-01',
  },
  controls: { speed: 1.0 },
  cameraPosition: [0, 0, 5],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 10000,
    pointSize: 4,
    height: '400px',
    backgroundColor: '#08040E',
    autoRotateSpeed: 0.5,
    orbitControls: true,
    pointerReactive: false,
    showBadge: true,
  },
}

describe('generateReactComponent', () => {
  it('includes PRTCL credits comment', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('Made with PRTCL')
    expect(code).toContain('MIT License © enuzzo')
  })

  it('includes dependency comment', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('@react-three/fiber')
    expect(code).toContain('@react-three/drei')
  })

  it('exports a default PrtclEffect component', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('export default function PrtclEffect')
  })

  it('includes PrtclEffectProps interface', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('interface PrtclEffectProps')
    expect(code).toContain('count?: number')
    expect(code).toContain('pointSize?: number')
  })

  it('uses addControl parameter name', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toMatch(/'addControl'/)
  })

  it('includes OrbitControls with camera target', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('<OrbitControls')
    expect(code).toContain('target={[0, 0, 0]}')
  })

  it('bakes control defaults', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('speed: 1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/export/react-generator.test.ts`
Expected: All FAIL

- [ ] **Step 3: Implement React generator**

```typescript
// src/export/generators/react-generator.ts
import { CREDITS_COMMENT } from '../templates/credits'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../templates/shader-strings'
import type { ExportPayload } from '../types'

export function generateReactComponent(payload: ExportPayload): string {
  const { effect, controls, cameraPosition, cameraTarget, settings } = payload
  const { particleCount, pointSize, backgroundColor, autoRotateSpeed, orbitControls, showBadge } = settings

  const controlsStr = JSON.stringify(controls, null, 2)

  return `${CREDITS_COMMENT}

// Effect: ${effect.name} by ${effect.author}
// Dependencies: three, @react-three/fiber, @react-three/drei

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const EFFECT_CODE = ${JSON.stringify(effect.code)}

const VERTEX_SHADER = \`${VERTEX_SHADER}\`

const FRAGMENT_SHADER = \`${FRAGMENT_SHADER}\`

const DEFAULT_CONTROLS: Record<string, number> = ${controlsStr}

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
  count = ${particleCount},
  pointSize = ${pointSize},
  controls = DEFAULT_CONTROLS,
}: {
  count: number
  pointSize: number
  controls: Record<string, number>
}) {
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
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo', 'textPoints',
      'camX', 'camY', 'camZ',
      'pointerX', 'pointerY', 'pointerZ',
      'bass', 'mids', 'highs', 'energy', 'beat',
      EFFECT_CODE
    ) as (
      i: number, count: number, target: THREE.Vector3, color: THREE.Color,
      time: number, lib: typeof THREE, addControl: (id: string) => number,
      setInfo: () => void, textPoints: undefined,
      camX: number, camY: number, camZ: number,
      pX: number, pY: number, pZ: number,
      bass: number, mids: number, highs: number, energy: number, beat: number,
    ) => void
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
      effectFn(
        i, count, target, color, time, THREE, addControl, () => {},
        undefined, camera.position.x, camera.position.y, camera.position.z,
        0, 0, 0, 0, 0, 0, 0, 0
      )
      if (!isFinite(target.x)) target.set(0, 0, 0)
      const idx = i * 3
      positions[idx] = target.x; positions[idx+1] = target.y; positions[idx+2] = target.z
      colors[idx] = color.r; colors[idx+1] = color.g; colors[idx+2] = color.b
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.customColor.needsUpdate = true
  })

  return <points geometry={geometry} material={material} />
}

export default function PrtclEffect({
  count = ${particleCount},
  pointSize = ${pointSize},
  background = '${backgroundColor}',
  autoRotate = ${autoRotateSpeed > 0},
  autoRotateSpeed = ${autoRotateSpeed},
  controls = DEFAULT_CONTROLS,
  style,
}: PrtclEffectProps) {
  return (
    <Canvas
      camera={{ position: [${cameraPosition.join(', ')}], fov: 60 }}
      style={{ background, ...style }}
    >
      <ParticleCloud count={count} pointSize={pointSize} controls={controls} />${orbitControls ? `
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        target={[${cameraTarget.join(', ')}]}
        enableDamping
      />` : ''}
    </Canvas>
  )
}
`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/export/react-generator.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/export/generators/react-generator.ts src/__tests__/export/react-generator.test.ts
git commit -m "feat(export): React component generator with tests"
```

---

## Task 5: Iframe Generator (TDD)

**Files:**
- Create: `src/export/generators/iframe-generator.ts`
- Create: `src/__tests__/export/iframe-generator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/export/iframe-generator.test.ts
import { describe, it, expect } from 'vitest'
import { generateIframeEmbed, buildEmbedUrl } from '../../export/generators/iframe-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'nebula', slug: 'nebula', name: 'Nebula', description: '', author: 'PRTCL Team',
    code: '', tags: [], category: 'organic', particleCount: 10000, cameraDistance: 5,
    cameraPosition: [0, 0, 5], cameraTarget: [0, 0, 0], createdAt: '2026-01-01',
  },
  controls: { density: 2.0 },
  cameraPosition: [0, 0, 5],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 8000, pointSize: 3, height: '500px',
    backgroundColor: '#08040E', autoRotateSpeed: 1,
    orbitControls: true, pointerReactive: false, showBadge: true,
  },
}

describe('buildEmbedUrl', () => {
  it('encodes effect id', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).toContain('effect=nebula')
  })

  it('encodes particle count', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).toContain('particles=8000')
  })

  it('encodes controls as JSON', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).toContain('controls=')
    const parsed = new URL(url, 'https://prtcl.es')
    const ctrlParam = parsed.searchParams.get('controls')
    expect(JSON.parse(ctrlParam!)).toEqual({ density: 2.0 })
  })
})

describe('generateIframeEmbed', () => {
  it('generates an iframe tag', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('<iframe')
    expect(html).toContain('</iframe>')
  })

  it('includes credits comment', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('Made with PRTCL')
  })

  it('includes the embed URL', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('prtcl.es/embed')
    expect(html).toContain('effect=nebula')
  })

  it('sets height from settings', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('height="500"')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/export/iframe-generator.test.ts`
Expected: All FAIL

- [ ] **Step 3: Implement iframe generator**

```typescript
// src/export/generators/iframe-generator.ts
import { CREDITS_HTML_COMMENT } from '../templates/credits'
import type { ExportPayload } from '../types'

const BASE_URL = 'https://prtcl.es/embed'

export function buildEmbedUrl(payload: ExportPayload): string {
  const { effect, controls, settings } = payload
  const params = new URLSearchParams()
  params.set('effect', effect.id)
  params.set('particles', String(settings.particleCount))
  params.set('pointSize', String(settings.pointSize))
  params.set('bg', settings.backgroundColor.replace('#', ''))
  params.set('rotate', String(settings.autoRotateSpeed))
  params.set('orbit', settings.orbitControls ? '1' : '0')
  if (Object.keys(controls).length > 0) {
    params.set('controls', JSON.stringify(controls))
  }
  if (!settings.showBadge) {
    params.set('badge', '0')
  }
  return `${BASE_URL}?${params.toString()}`
}

export function generateIframeEmbed(payload: ExportPayload): string {
  const url = buildEmbedUrl(payload)
  // Handle '100vh' → '100%', otherwise parse numeric px value
  const h = payload.settings.height
  const heightAttr = h === '100vh' ? '100%' : String(parseInt(h) || 400)

  return `${CREDITS_HTML_COMMENT}
<iframe
  src="${url}"
  width="100%" height="${heightAttr}"
  frameborder="0" allow="autoplay"
  style="border:none;border-radius:8px"
></iframe>`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/export/iframe-generator.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/export/generators/iframe-generator.ts src/__tests__/export/iframe-generator.test.ts
git commit -m "feat(export): iframe generator with tests"
```

---

## Task 6: CodeBlock Component

Syntax-highlighted code display with copy and download buttons.

**Files:**
- Create: `src/export/CodeBlock.tsx`

- [ ] **Step 1: Create CodeBlock component**

```typescript
// src/export/CodeBlock.tsx
import { useState, useCallback, useMemo } from 'react'

interface CodeBlockProps {
  code: string
  language: 'html' | 'tsx'
  filename: string
}

/** Single-pass tokenizer for acid-pop syntax highlighting.
 *  Avoids cascading regex corruption by yielding non-overlapping tokens. */
function highlightCode(escaped: string): string {
  // Token patterns — order matters (first match wins)
  const TOKEN_PATTERNS: [RegExp, string][] = [
    [/\/\/.*$/gm, 'text-[#A98ED1]'],                                  // line comments
    [/\/\*[\s\S]*?\*\//g, 'text-[#A98ED1]'],                          // block comments
    [/(&lt;!--[\s\S]*?--&gt;)/g, 'text-[#A98ED1]'],                    // HTML comments
    [/(["'`])(?:(?!\1|\\).|\\.)*\1/g, 'text-[#FF2BD6]'],              // strings
    [/\b(import|export|from|const|let|var|function|return|if|else|for|new|default|typeof|void|null|undefined|true|false|interface|type)\b/g, 'text-[#7CFF00]'], // keywords
    [/\b(\d+\.?\d*)\b/g, 'text-[#FFD553]'],                           // numbers
  ]

  // Build one combined regex with named groups
  let result = ''
  let lastIndex = 0

  // Simple approach: iterate character by character using exec on a combined pattern
  const combined = TOKEN_PATTERNS.map(([re], i) => `(?<t${i}>${re.source})`).join('|')
  const flags = 'gm'
  const master = new RegExp(combined, flags)

  let match: RegExpExecArray | null
  while ((match = master.exec(escaped)) !== null) {
    // Find which group matched
    let colorClass = ''
    for (let i = 0; i < TOKEN_PATTERNS.length; i++) {
      if (match.groups?.[`t${i}`] !== undefined) {
        colorClass = TOKEN_PATTERNS[i]![1]
        break
      }
    }
    // Append text before match (unhighlighted)
    result += escaped.slice(lastIndex, match.index)
    // Append highlighted match
    result += `<span class="${colorClass}">${match[0]}</span>`
    lastIndex = match.index + match[0].length
  }
  result += escaped.slice(lastIndex)
  return result
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const lines = code.split('\n')
  const lineCount = lines.length
  const byteSize = new Blob([code]).size
  const sizeStr = byteSize > 1024
    ? `${(byteSize / 1024).toFixed(1)} KB`
    : `${byteSize} B`

  const highlighted = useMemo(() => {
    // Escape HTML first, then apply highlights
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return highlightCode(escaped)
  }, [code])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [code, filename])

  return (
    <div className="flex flex-col h-full">
      {/* Code area */}
      <div className="flex-1 overflow-auto bg-bg rounded-lg border border-border">
        <pre className="p-4 text-xs font-mono leading-relaxed text-text">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>

      {/* Footer: actions + stats */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded text-sm font-mono font-bold transition-colors ${
              copied
                ? 'bg-success/20 text-success border border-success/40'
                : 'bg-accent2/15 text-accent2 border border-accent2/40 hover:bg-accent2/25'
            }`}
          >
            {copied ? 'Copied!' : '📋 Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 rounded text-sm font-mono text-text-secondary border border-border hover:bg-elevated transition-colors"
            title={`Download ${filename}`}
          >
            ⬇
          </button>
        </div>
        <span className="text-xs font-mono text-text-muted">
          ~{sizeStr} · {lineCount} lines
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/export/CodeBlock.tsx
git commit -m "feat(export): CodeBlock component with syntax highlight + copy"
```

---

## Task 7: Export Settings Panel

**Files:**
- Create: `src/export/ExportSettings.tsx`

- [ ] **Step 1: Create ExportSettings component**

```typescript
// src/export/ExportSettings.tsx
import type { ExportSettings as ExportSettingsType, ExportMode } from './types'

interface ExportSettingsProps {
  settings: ExportSettingsType
  onChange: (settings: ExportSettingsType) => void
  mode: ExportMode
  effectUsesPointer: boolean
}

const HEIGHT_OPTIONS = ['300px', '400px', '500px', '600px', '100vh']

export function ExportSettingsPanel({ settings, onChange, mode, effectUsesPointer }: ExportSettingsProps) {
  const update = <K extends keyof ExportSettingsType>(key: K, value: ExportSettingsType[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4 text-sm font-mono">
      <h3 className="text-text-secondary uppercase tracking-wider text-xs">Settings</h3>

      {/* Particle Count */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Particles</span>
          <span className="text-text">{settings.particleCount.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={1000} max={20000} step={500}
          value={settings.particleCount}
          onChange={(e) => update('particleCount', parseInt(e.target.value))}
          className="w-full accent-accent2"
        />
      </div>

      {/* Point Size */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Point Size</span>
          <span className="text-text">{settings.pointSize}</span>
        </label>
        <input
          type="range"
          min={1} max={12} step={0.5}
          value={settings.pointSize}
          onChange={(e) => update('pointSize', parseFloat(e.target.value))}
          className="w-full accent-accent2"
        />
      </div>

      {/* Height — only for Website Embed */}
      {mode === 'website' && (
        <div>
          <label className="block text-text-secondary mb-1">Height</label>
          <select
            value={settings.height}
            onChange={(e) => update('height', e.target.value)}
            className="w-full bg-elevated border border-border rounded px-2 py-1.5 text-text"
          >
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h} value={h}>{h === '100vh' ? 'Full viewport' : h}</option>
            ))}
          </select>
        </div>
      )}

      {/* Background Color */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Background</span>
          <span className="text-text">{settings.backgroundColor}</span>
        </label>
        <input
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => update('backgroundColor', e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer"
        />
      </div>

      {/* Auto-rotate */}
      <div>
        <label className="flex items-center justify-between text-text-secondary mb-1">
          <span>Auto-rotate</span>
          <span className="text-text">{settings.autoRotateSpeed || 'Off'}</span>
        </label>
        <input
          type="range"
          min={0} max={5} step={0.1}
          value={settings.autoRotateSpeed}
          onChange={(e) => update('autoRotateSpeed', parseFloat(e.target.value))}
          className="w-full accent-accent2"
        />
      </div>

      {/* Toggles */}
      <Toggle label="Orbit controls" checked={settings.orbitControls} onChange={(v) => update('orbitControls', v)} />
      {effectUsesPointer && (
        <Toggle label="Pointer reactive" checked={settings.pointerReactive} onChange={(v) => update('pointerReactive', v)} />
      )}
      <Toggle label="PRTCL badge" checked={settings.showBadge} onChange={(v) => update('showBadge', v)} />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-text-secondary">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-accent2' : 'bg-elevated border border-border'}`}
      >
        <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 3: Commit**

```bash
git add src/export/ExportSettings.tsx
git commit -m "feat(export): settings panel with sliders and toggles"
```

---

## Task 8: Export Preview

Isolated mini R3F canvas. Does NOT use global store — all settings via props.

**Files:**
- Create: `src/export/ExportPreview.tsx`

- [ ] **Step 1: Create ExportPreview component**

This component creates its own particle system in a mini `<Canvas>`, independent from the editor's `ParticleSystem`. It reads everything from props, never from the Zustand store.

```typescript
// src/export/ExportPreview.tsx
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { VERTEX_SHADER, FRAGMENT_SHADER } from './templates/shader-strings'
import type { Effect, CompiledEffectFn, Control } from '../engine/types'

interface PreviewParticlesProps {
  compiledFn: CompiledEffectFn
  controls: Record<string, number>
  particleCount: number
  pointSize: number
}

function PreviewParticles({ compiledFn, controls, particleCount, pointSize }: PreviewParticlesProps) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const { geometry, material, positions, colors } = useMemo(() => {
    const count = Math.min(particleCount, 20000)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: { uPointSize: { value: pointSize } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry, material, positions, colors }
  }, [particleCount, pointSize])

  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime()
    const count = Math.min(particleCount, 20000)
    const addControl = (id: string) => controls[id] ?? 0
    const camX = camera.position.x, camY = camera.position.y, camZ = camera.position.z

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      try {
        compiledFn(i, count, target, color, time, THREE, addControl, () => {},
          undefined, camX, camY, camZ, 0, 0, 0, 0, 0, 0, 0, 0)
      } catch { /* skip */ }
      if (!isFinite(target.x)) target.set(0, 0, 0)
      const idx = i * 3
      positions[idx] = target.x; positions[idx+1] = target.y; positions[idx+2] = target.z
      colors[idx] = color.r; colors[idx+1] = color.g; colors[idx+2] = color.b
    }

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colAttr = geometry.getAttribute('customColor') as THREE.BufferAttribute
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, count)
    material.uniforms['uPointSize']!.value = pointSize
  })

  return <points geometry={geometry} material={material} />
}

interface ExportPreviewProps {
  compiledFn: CompiledEffectFn | null
  controls: Record<string, number>
  particleCount: number
  pointSize: number
  backgroundColor: string
  autoRotateSpeed: number
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

export function ExportPreview({
  compiledFn, controls, particleCount, pointSize,
  backgroundColor, autoRotateSpeed, cameraPosition, cameraTarget,
}: ExportPreviewProps) {
  if (!compiledFn) return null

  return (
    <div className="rounded-lg overflow-hidden border border-border" style={{ background: backgroundColor }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        style={{ height: 260 }}
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[backgroundColor]} />
        <PreviewParticles
          compiledFn={compiledFn}
          controls={controls}
          particleCount={particleCount}
          pointSize={pointSize}
        />
        <OrbitControls
          target={cameraTarget}
          autoRotate={autoRotateSpeed > 0}
          autoRotateSpeed={autoRotateSpeed}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 3: Commit**

```bash
git add src/export/ExportPreview.tsx
git commit -m "feat(export): isolated preview canvas component"
```

---

## Task 9: Tab Components

Three thin tab wrappers — each composes CodeBlock with a generator.

**Files:**
- Create: `src/export/tabs/WebsiteEmbedTab.tsx`
- Create: `src/export/tabs/ReactTab.tsx`
- Create: `src/export/tabs/IframeTab.tsx`

- [ ] **Step 1: Create WebsiteEmbedTab**

```typescript
// src/export/tabs/WebsiteEmbedTab.tsx
import { useMemo } from 'react'
import { generateHtmlEmbed } from '../generators/html-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props {
  payload: ExportPayload
}

export function WebsiteEmbedTab({ payload }: Props) {
  const code = useMemo(() => generateHtmlEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}.html`

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        Works with Elementor, Webflow, Wix, WordPress &amp; any HTML site
      </p>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
```

- [ ] **Step 2: Create ReactTab**

```typescript
// src/export/tabs/ReactTab.tsx
import { useMemo } from 'react'
import { generateReactComponent } from '../generators/react-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props {
  payload: ExportPayload
}

export function ReactTab({ payload }: Props) {
  const code = useMemo(() => generateReactComponent(payload), [payload])

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        React Three Fiber component · Requires: three, @react-three/fiber, @react-three/drei
      </p>
      <CodeBlock code={code} language="tsx" filename="PrtclEffect.tsx" />
    </div>
  )
}
```

- [ ] **Step 3: Create IframeTab**

```typescript
// src/export/tabs/IframeTab.tsx
import { useMemo } from 'react'
import { generateIframeEmbed, buildEmbedUrl } from '../generators/iframe-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props {
  payload: ExportPayload
}

export function IframeTab({ payload }: Props) {
  const code = useMemo(() => generateIframeEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}-embed.html`

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        Zero-code embed · Works with built-in presets only
      </p>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 5: Commit**

```bash
git add src/export/tabs/
git commit -m "feat(export): tab components for all 3 export modes"
```

---

## Task 10: Export Modal

The main modal orchestrating everything: tabs, preview, settings, code.

**Files:**
- Create: `src/export/ExportModal.tsx`

- [ ] **Step 1: Create ExportModal**

```typescript
// src/export/ExportModal.tsx
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { ExportPreview } from './ExportPreview'
import { ExportSettingsPanel } from './ExportSettings'
import { WebsiteEmbedTab } from './tabs/WebsiteEmbedTab'
import { ReactTab } from './tabs/ReactTab'
import { IframeTab } from './tabs/IframeTab'
import type { ExportMode, ExportSettings, ExportPayload } from './types'

const TABS: { mode: ExportMode; label: string }[] = [
  { mode: 'website', label: 'Website Embed' },
  { mode: 'react', label: 'React Component' },
  { mode: 'iframe', label: 'Iframe' },
]

export function ExportModal() {
  const isOpen = useStore((s) => s.exportModalOpen)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const compiledFn = useStore((s) => s.compiledFn)
  const storeControls = useStore((s) => s.controls)
  const particleCount = useStore((s) => s.particleCount)
  const pointSize = useStore((s) => s.pointSize)
  const backgroundColor = useStore((s) => s.backgroundColor)
  const autoRotateSpeed = useStore((s) => s.autoRotateSpeed)

  const [activeTab, setActiveTab] = useState<ExportMode>('website')

  // Check if effect uses pointer (search for pointerX/Y/Z in code)
  // Declared early because the settings sync useEffect below depends on it
  const effectUsesPointer = useMemo(() => {
    if (!selectedEffect) return false
    return /pointer[XYZ]/i.test(selectedEffect.code)
  }, [selectedEffect])

  const [settings, setSettings] = useState<ExportSettings>({
    particleCount: 10000,
    pointSize: 4,
    height: '400px',
    backgroundColor: '#08040E',
    autoRotateSpeed: 0,
    orbitControls: true,
    pointerReactive: true,
    showBadge: true,
  })

  // Sync settings from editor state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings({
        particleCount: Math.min(particleCount, 15000),
        pointSize,
        height: '400px',
        backgroundColor,
        autoRotateSpeed,
        orbitControls: true,
        pointerReactive: effectUsesPointer,
        showBadge: true,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const close = useCallback(() => {
    useStore.getState().setExportModalOpen(false)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  // Build baked control values
  const controlValues = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of storeControls) {
      map[c.id] = Math.round(c.value * 1000) / 1000
    }
    return map
  }, [storeControls])

  // Get camera snapshot
  const cameraState = useMemo(() => {
    if (!isOpen) return { position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
    const snap = getCameraSnapshot()
    return snap ?? {
      position: selectedEffect?.cameraPosition ?? [0, 0, 5],
      target: selectedEffect?.cameraTarget ?? [0, 0, 0],
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Memoize payload so tab useMemo deps are stable
  const payload: ExportPayload = useMemo(() => ({
    effect: selectedEffect!,
    controls: controlValues,
    cameraPosition: cameraState.position,
    cameraTarget: cameraState.target,
    settings,
  }), [selectedEffect, controlValues, cameraState, settings])

  if (!isOpen || !selectedEffect) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="relative z-10 bg-surface border border-border rounded-xl shadow-2xl w-[90vw] max-w-[1100px] h-[80vh] max-h-[700px] flex flex-col overflow-hidden"
        style={{ animation: 'fadeInScale 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="export-title" className="text-lg font-mono font-bold text-text">
            Export <span className="text-accent">"{selectedEffect.name}"</span>
          </h2>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-elevated transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-border">
          {TABS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`px-4 py-1.5 rounded text-sm font-mono transition-colors ${
                activeTab === mode
                  ? 'bg-accent2/15 text-accent2 border border-accent2/40'
                  : 'text-text-muted hover:text-text hover:bg-elevated'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body: preview + settings | code */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: preview + settings */}
          <div className="w-[320px] shrink-0 border-r border-border p-4 overflow-y-auto space-y-4">
            <ExportPreview
              compiledFn={compiledFn}
              controls={controlValues}
              particleCount={settings.particleCount}
              pointSize={settings.pointSize}
              backgroundColor={settings.backgroundColor}
              autoRotateSpeed={settings.autoRotateSpeed}
              cameraPosition={cameraState.position}
              cameraTarget={cameraState.target}
            />
            <ExportSettingsPanel
              settings={settings}
              onChange={setSettings}
              mode={activeTab}
              effectUsesPointer={effectUsesPointer}
            />
          </div>

          {/* Right: code */}
          <div className="flex-1 p-4 overflow-hidden">
            {activeTab === 'website' && <WebsiteEmbedTab payload={payload} />}
            {activeTab === 'react' && <ReactTab payload={payload} />}
            {activeTab === 'iframe' && <IframeTab payload={payload} />}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add modal animation keyframe to `src/index.css`**

Add at the end of the file (after existing animations):

```css
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 4: Commit**

```bash
git add src/export/ExportModal.tsx src/index.css
git commit -m "feat(export): main modal with tabs, preview, settings"
```

---

## Task 11: Wire Up — TopBar + EditorLayout

**Files:**
- Modify: `src/editor/TopBar.tsx:189-192`
- Modify: `src/editor/EditorLayout.tsx:7,155`

- [ ] **Step 1: Wire Export button in TopBar**

In `src/editor/TopBar.tsx`, replace the Export button (lines 189-192):

```typescript
          {/* Export — desktop only */}
          {!isMobile && selectedEffect?.renderer !== 'custom' && (
            <button
              onClick={() => useStore.getState().setExportModalOpen(true)}
              className="px-4 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded text-sm font-mono hover:bg-accent2/20 transition-colors"
            >
              Export
            </button>
          )}
          {!isMobile && selectedEffect?.renderer === 'custom' && (
            <button
              className="px-4 py-1.5 bg-elevated text-text-muted border border-border rounded text-sm font-mono cursor-not-allowed opacity-50"
              title="Export not available for custom renderer effects"
              disabled
            >
              Export
            </button>
          )}
```

- [ ] **Step 2: Mount ExportModal in EditorLayout**

In `src/editor/EditorLayout.tsx`, add import (after line 7):

```typescript
import { ExportModal } from '../export/ExportModal'
```

Add render (before `</div>` at line 155, after `<StatusBar>`):

```typescript
      <ExportModal />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
- Click Export button → modal should open
- Switch tabs → code should regenerate
- Change settings → preview should update
- Click Copy → snippet in clipboard
- Click ✕ / Escape / backdrop → modal closes
- Switch to Paper Fleet → Export button should be disabled

- [ ] **Step 5: Commit**

```bash
git add src/editor/TopBar.tsx src/editor/EditorLayout.tsx
git commit -m "feat(export): wire export button and mount modal"
```

---

## Task 12: Embed Route

**Files:**
- Create: `src/embed/EmbedView.tsx`
- Modify: `src/App.tsx:3,17-18`

- [ ] **Step 1: Create EmbedView**

First, extract the shared particle system used by both ExportPreview and EmbedView.

Create `src/export/IsolatedParticleSystem.tsx` — the shared props-driven particle renderer:

```typescript
// src/export/IsolatedParticleSystem.tsx
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VERTEX_SHADER, FRAGMENT_SHADER } from './templates/shader-strings'
import type { CompiledEffectFn } from '../engine/types'

interface Props {
  compiledFn: CompiledEffectFn
  controls: Record<string, number>
  particleCount: number
  pointSize: number
}

export function IsolatedParticleSystem({ compiledFn, controls, particleCount, pointSize }: Props) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const { geometry, material, positions, colors } = useMemo(() => {
    const count = Math.min(particleCount, 20000)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: { uPointSize: { value: pointSize } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry, material, positions, colors }
  }, [particleCount, pointSize])

  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime()
    const count = Math.min(particleCount, 20000)
    const addControl = (id: string) => controls[id] ?? 0

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      try {
        compiledFn(i, count, target, color, time, THREE, addControl, () => {},
          undefined, camera.position.x, camera.position.y, camera.position.z,
          0, 0, 0, 0, 0, 0, 0, 0)
      } catch { /* skip */ }
      if (!isFinite(target.x)) target.set(0, 0, 0)
      const idx = i * 3
      positions[idx] = target.x; positions[idx+1] = target.y; positions[idx+2] = target.z
      colors[idx] = color.r; colors[idx+1] = color.g; colors[idx+2] = color.b
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.customColor.needsUpdate = true
    geometry.setDrawRange(0, count)
    material.uniforms['uPointSize']!.value = pointSize
  })

  return <points geometry={geometry} material={material} />
}
```

Then update **ExportPreview.tsx** (Task 8) to import `IsolatedParticleSystem` instead of defining its own `PreviewParticles`. Replace the inline `PreviewParticles` with:

```typescript
import { IsolatedParticleSystem } from './IsolatedParticleSystem'
// ... and use <IsolatedParticleSystem ... /> inside the Canvas
```

Now create `EmbedView.tsx`:

```typescript
// src/embed/EmbedView.tsx
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ALL_PRESETS } from '../effects/presets'
import { compileEffect } from '../engine/compiler'
import { IsolatedParticleSystem } from '../export/IsolatedParticleSystem'

export function EmbedView() {
  const [searchParams] = useSearchParams()

  const effectId = searchParams.get('effect') ?? ''
  const particleCount = parseInt(searchParams.get('particles') ?? '') || undefined
  const pointSize = parseFloat(searchParams.get('pointSize') ?? '') || undefined
  const bgParam = searchParams.get('bg')
  const backgroundColor = bgParam ? `#${bgParam.replace('#', '')}` : '#08040E'
  const autoRotateSpeed = parseFloat(searchParams.get('rotate') ?? '0')
  const orbitEnabled = searchParams.get('orbit') !== '0'
  const showBadge = searchParams.get('badge') !== '0'

  // Parse control overrides
  const controlOverrides = useMemo(() => {
    const raw = searchParams.get('controls')
    if (!raw) return {}
    try { return JSON.parse(raw) as Record<string, number> } catch { return {} }
  }, [searchParams])

  // Find and compile the preset
  const { compiledFn, controlValues, effect } = useMemo(() => {
    const preset = ALL_PRESETS.find((p) => p.id === effectId)
    if (!preset) return { compiledFn: null, controlValues: {}, effect: null }

    const result = compileEffect(preset)
    if (!result.ok) return { compiledFn: null, controlValues: {}, effect: preset }

    // Build control values: preset defaults → compiled defaults → URL overrides
    const vals: Record<string, number> = {}
    for (const c of result.value.controls) {
      vals[c.id] = controlOverrides[c.id] ?? c.initial
    }

    return { compiledFn: result.value.fn, controlValues: vals, effect: preset }
  }, [effectId, controlOverrides])

  if (!effect) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#08040E] text-white font-mono">
        <div className="text-center">
          <p className="text-lg mb-2">Effect not found</p>
          <a href="https://prtcl.es" className="text-[#7CFF00] hover:underline">Go to prtcl.es</a>
        </div>
      </div>
    )
  }

  if (!compiledFn) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#08040E] text-white font-mono">
        <p>Failed to compile effect</p>
      </div>
    )
  }

  const count = particleCount ?? effect.particleCount
  const size = pointSize ?? (effect.pointSize ?? 4)
  const camPos = effect.cameraPosition ?? [0, 0, 5]
  const camTarget = effect.cameraTarget ?? [0, 0, 0]

  return (
    <div className="relative w-full h-dvh" style={{ background: backgroundColor }}>
      <Canvas
        camera={{ position: camPos as [number, number, number], fov: 60 }}
        gl={{ antialias: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[backgroundColor]} />
        <IsolatedParticleSystem
          compiledFn={compiledFn}
          controls={controlValues}
          particleCount={count}
          pointSize={size}
        />
        {orbitEnabled && (
          <OrbitControls
            target={camTarget as [number, number, number]}
            autoRotate={autoRotateSpeed > 0}
            autoRotateSpeed={autoRotateSpeed}
            enableDamping
          />
        )}
      </Canvas>
      {showBadge && (
        <a
          href="https://prtcl.es"
          target="_blank"
          rel="noopener"
          className="absolute bottom-2 right-3 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors no-underline"
        >
          Made with PRTCL
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add embed route to App.tsx**

In `src/App.tsx`, add import (after line 3):

```typescript
import { EmbedView } from './embed/EmbedView'
```

Add route (before the catch-all `*` route, after line 18):

```typescript
        <Route path="/embed" element={<EmbedView />} />
```

Ensure the splash screen does NOT show on the embed route. Add `useLocation` import and check:

```typescript
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
```

Then inside the `App` component, add:
```typescript
const location = useLocation()
const isEmbed = location.pathname === '/embed'
```

And update the splash conditional:
```typescript
{showSplash && !isEmbed && <SplashScreen onComplete={handleSplashComplete} />}
```

Note: Since `useLocation` requires being inside `<BrowserRouter>`, the `App` component will need to be split: `BrowserRouter` wraps an inner component that uses `useLocation`. Alternatively, move the splash check into a wrapper component.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc -b`

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Navigate to: `http://localhost:5173/embed?effect=frequency&particles=5000&bg=08040E&rotate=1`
Expected: Fractal Frequency renders fullscreen with auto-rotation, no UI chrome.

Navigate to: `http://localhost:5173/embed?effect=nonexistent`
Expected: "Effect not found" with link to prtcl.es.

- [ ] **Step 5: Commit**

```bash
git add src/embed/EmbedView.tsx src/App.tsx
git commit -m "feat(export): embed route for iframe embeds"
```

---

## Task 13: Full Integration Test

Run the complete flow end-to-end.

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All pass (existing + new generator tests)

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc -b
```
Expected: No errors

- [ ] **Step 3: Run production build**

```bash
npm run build
```
Expected: Build succeeds, no errors

- [ ] **Step 4: Manual E2E — Website Embed**

1. `npm run dev`
2. Select "Fractal Frequency"
3. Click Export → modal opens
4. Verify live preview shows the effect
5. Adjust particle count slider → preview updates
6. Click "Copy to Clipboard"
7. Open a new blank HTML file, paste the snippet
8. Open the HTML file in a browser
9. Verify: particles render, orbit controls work, auto-rotate works, PRTCL badge visible

- [ ] **Step 5: Manual E2E — React Component**

1. In Export modal, click "React Component" tab
2. Verify code shows a valid `.tsx` component
3. Verify imports include three, @react-three/fiber, @react-three/drei
4. Click Download → `PrtclEffect.tsx` downloads

- [ ] **Step 6: Manual E2E — Iframe**

1. Click "Iframe" tab
2. Verify iframe snippet shows with prtcl.es URL
3. Open the URL from the snippet directly in browser
4. Verify embed route renders the effect

- [ ] **Step 7: Edge cases**

- Select Paper Fleet → Export button is disabled with tooltip
- Open modal → press Escape → modal closes
- Open modal → click backdrop → modal closes
- Toggle badge off → verify badge code removed from snippet
- Toggle orbit controls off → verify OrbitControls import removed

- [ ] **Step 8: Final commit**

If any fixes were needed during testing, commit them:

```bash
git add -u
git commit -m "fix(export): integration test fixes"
```

---

## Task 14: Update CLAUDE.md

- [ ] **Step 1: Mark Phase 2 as complete in CLAUDE.md**

In `CLAUDE.md`, change:

```markdown
- [ ] **Phase 2**: Export system — 4 modes + modal + live preview
```

to:

```markdown
- [x] **Phase 2**: Export system — 3 modes (Website Embed, React Component, Iframe) + modal + live preview
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Phase 2 Export System complete"
```
