# PRTCL Phase 1: Core Engine — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core particle engine, compiler, editor layout, and 4 presets — producing a working editor at `/create` where users can browse effects, tweak parameters, and see particles render at 60fps.

**Architecture:** Vite 6 + React 19 SPA. React Three Fiber for 3D rendering. Zustand flat store with direct `getState()` reads in the render loop (no React re-renders in hot path). Tweakpane for creative controls. shadcn/ui + Tailwind 4 for structural UI. Static `index.html` landing placeholder.

**Tech Stack:** Vite 6, React 19, TypeScript (strict), React Three Fiber, drei, Three.js, Tweakpane, Zustand, shadcn/ui, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-16-prtcl-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `index.html` | Landing page entry + Vite SPA mount point |
| `src/main.tsx` | React 19 SPA entry, mounts `<App>` |
| `src/App.tsx` | Router: `/create` → Editor, `/gallery` → placeholder |
| `src/engine/types.ts` | `Effect`, `EffectContext`, `Control`, `CompiledEffect` interfaces |
| `src/engine/validator.ts` | Static analysis — forbidden pattern scanner (security boundary) |
| `src/engine/compiler.ts` | `new Function()` compilation + dry run + NaN guard |
| `src/engine/ShaderMaterial.ts` | Custom vertex/fragment shader, additive blending |
| `src/engine/ParticleSystem.tsx` | R3F component: BufferGeometry + useFrame hot loop |
| `src/engine/adaptive-quality.ts` | Frame time monitor, particle count scaling |
| `src/store.ts` | Zustand store: selected effect, compiled fn, controls, settings |
| `src/editor/EditorLayout.tsx` | Three-panel shell (280px / flex / 320px) |
| `src/editor/EffectBrowser.tsx` | Left sidebar: category tree, preset list, search |
| `src/editor/Viewport.tsx` | Center panel: R3F Canvas + OrbitControls |
| `src/editor/ControlPanel.tsx` | Right panel: Tweakpane wrapper + global controls |
| `src/editor/StatusBar.tsx` | Bottom bar: FPS, particle count, effect name |
| `src/editor/TopBar.tsx` | Logo + Export button placeholder |
| `src/effects/presets/nebula.ts` | Nebula Organica preset |
| `src/effects/presets/lorenz.ts` | Lorenz Attractor preset |
| `src/effects/presets/galaxy.ts` | Spiral Galaxy preset |
| `src/effects/presets/starfield.ts` | Starfield preset |
| `src/effects/presets/index.ts` | Re-exports all presets as array |
| `vite.config.ts` | Vite config with React plugin |
| `tailwind.config.ts` | Tailwind 4 config with design tokens |
| `tsconfig.json` | TypeScript strict config |
| `vercel.json` | SPA rewrites for /create, /gallery |
| `src/test/validator.test.ts` | Validator tests |
| `src/test/compiler.test.ts` | Compiler tests |
| `src/test/adaptive-quality.test.ts` | Adaptive quality tests |

---

## Chunk 1: Project Scaffold + Types + Validator

### Task 1: Vite + React + Tailwind Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Initialize Vite project with React + TypeScript**

```bash
cd /Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/prtcl
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, allow overwrite (only CLAUDE.md and docs exist).

- [ ] **Step 2: Install core dependencies**

```bash
npm install three @react-three/fiber @react-three/drei zustand tweakpane
npm install -D @types/three tailwindcss @tailwindcss/vite vitest
```

- [ ] **Step 3: Configure Vite with Tailwind plugin**

Replace `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: Configure TypeScript strict mode**

Update `tsconfig.json` — ensure these are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Set up Tailwind with design tokens**

Create `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #050510;
  --color-surface: #0d0d1a;
  --color-border: #1a1a2e;
  --color-accent: #7aa2f7;
  --color-text: #e0e0e0;
  --color-text-muted: #8b8fa3;
  --font-mono: "JetBrains Mono", monospace;
}
```

- [ ] **Step 6: Create minimal App with router placeholder**

`src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create" element={<div>Editor</div>} />
        <Route path="/gallery" element={<div>Gallery</div>} />
        <Route path="*" element={<div>PRTCL</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 7: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 8: Create vercel.json for SPA routing**

```json
{
  "rewrites": [
    { "source": "/create", "destination": "/index.html" },
    { "source": "/gallery", "destination": "/index.html" },
    { "source": "/gallery/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, browser shows "Editor" at `/create`.

- [ ] **Step 10: Commit scaffold**

```bash
git add -A
git commit -m "feat: scaffold Vite + React 19 + Tailwind 4 + routing"
```

---

### Task 2: Effect Types

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: Define core type interfaces**

`src/engine/types.ts`:

```typescript
import type { Vector3, Color } from 'three'
import * as THREE from 'three'

export interface EffectContext {
  i: number
  count: number
  target: Vector3
  color: Color
  time: number
  THREE: typeof THREE
  addControl: (id: string, label: string, min: number, max: number, initial: number) => number
  setInfo: (title: string, description: string) => void
  textPoints?: Float32Array
}

export interface Control {
  id: string
  label: string
  min: number
  max: number
  initial: number
  value: number
}

export interface Effect {
  id: string
  slug: string
  name: string
  description: string
  author: string
  code: string
  tags: string[]
  category: 'organic' | 'math' | 'text' | 'abstract'
  particleCount: number
  cameraDistance: number
  createdAt: string
  controls?: Record<string, number>
}

export type CompiledEffectFn = (
  i: number,
  count: number,
  target: Vector3,
  color: Color,
  time: number,
  THREE: typeof THREE,
  getControl: (id: string) => number,
  setInfo: (title: string, description: string) => void,
  textPoints?: Float32Array,
) => void

export interface CompiledEffect {
  fn: CompiledEffectFn
  controls: Control[]
  info: { title: string; description: string }
}
```

- [ ] **Step 2: Commit types**

```bash
git add src/engine/types.ts
git commit -m "feat: define Effect, Control, and CompiledEffect type interfaces"
```

---

### Task 3: Validator (Security Boundary)

**Files:**
- Create: `src/engine/validator.ts`, `src/test/validator.test.ts`

- [ ] **Step 1: Write failing validator tests**

`src/test/validator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateEffectCode } from '../engine/validator'

describe('validateEffectCode', () => {
  it('accepts valid effect code', () => {
    const code = `
      const speed = addControl('speed', 'Speed', 0, 5, 1);
      const angle = i / count * Math.PI * 2;
      target.set(Math.cos(angle + time * speed), Math.sin(angle + time * speed), 0);
      color.setHSL(i / count, 0.8, 0.6);
    `
    const result = validateEffectCode(code)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects code with document access', () => {
    const result = validateEffectCode('document.createElement("div")')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('document')
  })

  it('rejects code with window access', () => {
    const result = validateEffectCode('window.location.href')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('window')
  })

  it('rejects code with fetch', () => {
    const result = validateEffectCode('fetch("https://evil.com")')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('fetch')
  })

  it('rejects code with eval', () => {
    const result = validateEffectCode('eval("alert(1)")')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('eval')
  })

  it('rejects code with import statements', () => {
    const result = validateEffectCode('import("malicious")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with Function constructor', () => {
    const result = validateEffectCode('new Function("return this")()')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Function')
  })

  it('rejects code with globalThis', () => {
    const result = validateEffectCode('globalThis.fetch("evil")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with setTimeout', () => {
    const result = validateEffectCode('setTimeout(() => {}, 1000)')
    expect(result.valid).toBe(false)
  })

  it('rejects code with localStorage', () => {
    const result = validateEffectCode('localStorage.getItem("key")')
    expect(result.valid).toBe(false)
  })

  it('allows THREE usage', () => {
    const code = 'target.set(THREE.MathUtils.lerp(0, 1, time), 0, 0)'
    const result = validateEffectCode(code)
    expect(result.valid).toBe(true)
  })

  it('allows Math usage', () => {
    const code = 'target.set(Math.sin(time), Math.cos(time), 0)'
    const result = validateEffectCode(code)
    expect(result.valid).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/validator.test.ts
```

Expected: FAIL — `validateEffectCode` not found.

- [ ] **Step 3: Implement validator**

`src/engine/validator.ts`:

```typescript
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bdocument\b/, name: 'document' },
  { pattern: /\bwindow\b/, name: 'window' },
  { pattern: /\bfetch\b/, name: 'fetch' },
  { pattern: /\beval\b/, name: 'eval' },
  { pattern: /\bimport\b/, name: 'import' },
  { pattern: /\brequire\b/, name: 'require' },
  { pattern: /\bXMLHttpRequest\b/, name: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/, name: 'WebSocket' },
  { pattern: /\bglobalThis\b/, name: 'globalThis' },
  { pattern: /\bself\b/, name: 'self' },
  { pattern: /\btop\b/, name: 'top' },
  { pattern: /\bparent\b/, name: 'parent' },
  { pattern: /\bopener\b/, name: 'opener' },
  { pattern: /\blocation\b/, name: 'location' },
  { pattern: /\bcookie\b/, name: 'cookie' },
  { pattern: /\blocalStorage\b/, name: 'localStorage' },
  { pattern: /\bsessionStorage\b/, name: 'sessionStorage' },
  { pattern: /\bsetTimeout\b/, name: 'setTimeout' },
  { pattern: /\bsetInterval\b/, name: 'setInterval' },
  { pattern: /\bFunction\b/, name: 'Function' },
]

export function validateEffectCode(code: string): ValidationResult {
  const errors: string[] = []

  for (const { pattern, name } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Forbidden pattern detected: ${name}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/validator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit validator**

```bash
git add src/engine/validator.ts src/test/validator.test.ts
git commit -m "feat: add effect code validator with forbidden pattern scanning"
```

---

### Task 4: Compiler

**Files:**
- Create: `src/engine/compiler.ts`, `src/test/compiler.test.ts`

- [ ] **Step 1: Write failing compiler tests**

`src/test/compiler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { compileEffect } from '../engine/compiler'
import type { Effect } from '../engine/types'

const makeEffect = (code: string): Effect => ({
  id: 'test',
  slug: 'test',
  name: 'Test',
  description: 'Test effect',
  author: 'Test',
  code,
  tags: [],
  category: 'abstract',
  particleCount: 100,
  cameraDistance: 5,
  createdAt: new Date().toISOString(),
})

describe('compileEffect', () => {
  it('compiles valid effect code', () => {
    const effect = makeEffect(`
      target.set(Math.cos(i), Math.sin(i), 0);
      color.setHSL(i / count, 0.8, 0.6);
    `)
    const result = compileEffect(effect)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(typeof result.value.fn).toBe('function')
    }
  })

  it('rejects code that fails validation', () => {
    const effect = makeEffect('document.body.innerHTML = "hacked"')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('document')
    }
  })

  it('rejects code with runtime errors', () => {
    const effect = makeEffect('undefinedVariable.foo()')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
  })

  it('rejects code that produces NaN positions', () => {
    const effect = makeEffect('target.set(NaN, 0, 0)')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('NaN')
    }
  })

  it('collects controls from addControl calls', () => {
    const effect = makeEffect(`
      const speed = addControl('speed', 'Speed', 0, 5, 1);
      target.set(speed * i, 0, 0);
      color.set(1, 1, 1);
    `)
    const result = compileEffect(effect)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.controls).toHaveLength(1)
      expect(result.value.controls[0]!.id).toBe('speed')
      expect(result.value.controls[0]!.initial).toBe(1)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/compiler.test.ts
```

Expected: FAIL — `compileEffect` not found.

- [ ] **Step 3: Implement compiler**

`src/engine/compiler.ts`:

```typescript
import * as THREE from 'three'
import { Vector3, Color } from 'three'
import { validateEffectCode } from './validator'
import type { Effect, CompiledEffect, CompiledEffectFn, Control } from './types'

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function compileEffect(effect: Effect): Result<CompiledEffect> {
  // Step 1: Static analysis
  const validation = validateEffectCode(effect.code)
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join('; ') }
  }

  // Step 2: Compile function
  let fn: CompiledEffectFn
  try {
    fn = new Function(
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo', 'textPoints',
      effect.code,
    ) as CompiledEffectFn
  } catch (e) {
    return { ok: false, error: `Compilation error: ${(e as Error).message}` }
  }

  // Step 3: Dry run to collect controls and catch runtime errors
  const controls: Control[] = []
  const controlSet = new Set<string>()
  let info = { title: effect.name, description: effect.description }

  const addControl = (id: string, label: string, min: number, max: number, initial: number): number => {
    if (!controlSet.has(id)) {
      controlSet.add(id)
      controls.push({ id, label, min, max, initial, value: initial })
    }
    return initial
  }

  const setInfo = (title: string, description: string) => {
    info = { title, description }
  }

  const target = new Vector3()
  const color = new Color()

  try {
    for (let i = 0; i < Math.min(effect.particleCount, 100); i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      fn(i, 100, target, color, 0, THREE, addControl, setInfo, undefined)
    }
  } catch (e) {
    return { ok: false, error: `Runtime error: ${(e as Error).message}` }
  }

  // Step 4: NaN guard
  target.set(0, 0, 0)
  color.set(1, 1, 1)
  try {
    fn(0, 100, target, color, 0, THREE, addControl, setInfo, undefined)
  } catch (e) {
    return { ok: false, error: `Runtime error: ${(e as Error).message}` }
  }

  if (!isFinite(target.x) || !isFinite(target.y) || !isFinite(target.z)) {
    return { ok: false, error: 'Effect produces NaN/Infinity positions' }
  }

  return {
    ok: true,
    value: { fn, controls, info },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/compiler.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit compiler**

```bash
git add src/engine/compiler.ts src/test/compiler.test.ts
git commit -m "feat: add effect compiler with dry run and NaN guard"
```

---

## Chunk 2: Shader + Particle System + Adaptive Quality

### Task 5: Custom ShaderMaterial

**Files:**
- Create: `src/engine/ShaderMaterial.ts`

- [ ] **Step 1: Implement custom particle shader**

`src/engine/ShaderMaterial.ts`:

```typescript
import { ShaderMaterial, AdditiveBlending } from 'three'

const vertexShader = /* glsl */ `
  attribute vec3 customColor;
  varying vec3 vColor;
  uniform float uPointSize;

  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`

export function createParticleShaderMaterial(pointSize: number = 4.0): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uPointSize: { value: pointSize },
    },
    vertexShader,
    fragmentShader,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}
```

- [ ] **Step 2: Commit shader**

```bash
git add src/engine/ShaderMaterial.ts
git commit -m "feat: add custom particle ShaderMaterial with additive blending"
```

---

### Task 6: Adaptive Quality

**Files:**
- Create: `src/engine/adaptive-quality.ts`, `src/test/adaptive-quality.test.ts`

- [ ] **Step 1: Write failing adaptive quality tests**

`src/test/adaptive-quality.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { AdaptiveQuality } from '../engine/adaptive-quality'

describe('AdaptiveQuality', () => {
  it('returns base count when performance is good', () => {
    const aq = new AdaptiveQuality(15000)
    // Simulate good frames (delta = 0.016 = 60fps)
    for (let i = 0; i < 10; i++) {
      aq.update(0.016)
    }
    expect(aq.getParticleCount()).toBe(15000)
  })

  it('reduces count when frame time exceeds threshold', () => {
    const aq = new AdaptiveQuality(15000)
    // Simulate bad frames (delta = 0.025 = 40fps)
    for (let i = 0; i < 10; i++) {
      aq.update(0.025)
    }
    expect(aq.getParticleCount()).toBeLessThan(15000)
  })

  it('never goes below floor of 1000', () => {
    const aq = new AdaptiveQuality(15000)
    // Simulate very bad frames
    for (let i = 0; i < 200; i++) {
      aq.update(0.1)
    }
    expect(aq.getParticleCount()).toBeGreaterThanOrEqual(1000)
  })

  it('recovers count after sustained good performance', () => {
    const aq = new AdaptiveQuality(15000)
    // Drop performance
    for (let i = 0; i < 30; i++) {
      aq.update(0.03)
    }
    const reduced = aq.getParticleCount()
    expect(reduced).toBeLessThan(15000)
    // Recover with 60+ good frames at >70fps
    for (let i = 0; i < 70; i++) {
      aq.update(0.013)
    }
    expect(aq.getParticleCount()).toBeGreaterThan(reduced)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/adaptive-quality.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement adaptive quality**

`src/engine/adaptive-quality.ts`:

```typescript
const DOWNSCALE_THRESHOLD = 0.020 // below 50fps
const RECOVERY_THRESHOLD = 0.014  // above 70fps
const RECOVERY_FRAMES = 60
const FLOOR = 1000
const SCALE_FACTOR = 0.9
const RECOVERY_FACTOR = 1.05

export class AdaptiveQuality {
  private baseCount: number
  private currentCount: number
  private goodFrames = 0

  constructor(baseCount: number) {
    this.baseCount = baseCount
    this.currentCount = baseCount
  }

  update(delta: number): void {
    if (delta > DOWNSCALE_THRESHOLD) {
      this.currentCount = Math.max(
        FLOOR,
        Math.floor(this.currentCount * SCALE_FACTOR),
      )
      this.goodFrames = 0
    } else if (delta < RECOVERY_THRESHOLD) {
      this.goodFrames++
      if (this.goodFrames >= RECOVERY_FRAMES && this.currentCount < this.baseCount) {
        this.currentCount = Math.min(
          this.baseCount,
          Math.floor(this.currentCount * RECOVERY_FACTOR),
        )
        this.goodFrames = 0
      }
    } else {
      this.goodFrames = 0
    }
  }

  getParticleCount(): number {
    return this.currentCount
  }

  setBaseCount(count: number): void {
    this.baseCount = count
    this.currentCount = Math.min(this.currentCount, count)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/adaptive-quality.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit adaptive quality**

```bash
git add src/engine/adaptive-quality.ts src/test/adaptive-quality.test.ts
git commit -m "feat: add adaptive quality system with frame time monitoring"
```

---

### Task 7: Zustand Store

**Files:**
- Create: `src/store.ts`

- [ ] **Step 1: Implement the store**

`src/store.ts`:

```typescript
import { create } from 'zustand'
import type { Effect, CompiledEffectFn, Control } from './engine/types'

interface PrtclState {
  // Effect
  selectedEffect: Effect | null
  compiledFn: CompiledEffectFn | null
  controls: Control[]
  info: { title: string; description: string }

  // Settings
  particleCount: number
  pointSize: number
  backgroundColor: string
  bloomEnabled: boolean

  // Performance
  fps: number
  actualParticleCount: number

  // Actions
  setSelectedEffect: (effect: Effect) => void
  setCompiledFn: (fn: CompiledEffectFn, controls: Control[], info: { title: string; description: string }) => void
  setControl: (id: string, value: number) => void
  setParticleCount: (count: number) => void
  setPointSize: (size: number) => void
  setBackgroundColor: (color: string) => void
  setBloomEnabled: (enabled: boolean) => void
  setFps: (fps: number) => void
  setActualParticleCount: (count: number) => void
}

export const useStore = create<PrtclState>((set) => ({
  selectedEffect: null,
  compiledFn: null,
  controls: [],
  info: { title: '', description: '' },

  particleCount: 15000,
  pointSize: 4.0,
  backgroundColor: '#050510',
  bloomEnabled: false,

  fps: 0,
  actualParticleCount: 0,

  setSelectedEffect: (effect) => set({ selectedEffect: effect }),
  setCompiledFn: (fn, controls, info) => set({ compiledFn: fn, controls, info }),
  setControl: (id, value) =>
    set((state) => ({
      controls: state.controls.map((c) =>
        c.id === id ? { ...c, value } : c,
      ),
    })),
  setParticleCount: (count) => set({ particleCount: count }),
  setPointSize: (size) => set({ pointSize: size }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
  setFps: (fps) => set({ fps }),
  setActualParticleCount: (count) => set({ actualParticleCount: count }),
}))
```

- [ ] **Step 2: Commit store**

```bash
git add src/store.ts
git commit -m "feat: add Zustand store for effect state and settings"
```

---

### Task 8: ParticleSystem R3F Component

**Files:**
- Create: `src/engine/ParticleSystem.tsx`

- [ ] **Step 1: Implement ParticleSystem component**

`src/engine/ParticleSystem.tsx`:

```typescript
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Points, Vector3, Color } from 'three'
import * as THREE from 'three'
import { createParticleShaderMaterial } from './ShaderMaterial'
import { AdaptiveQuality } from './adaptive-quality'
import { useStore } from '../store'

const MAX_PARTICLES = 30000

export function ParticleSystem() {
  const pointsRef = useRef<Points>(null)
  const adaptiveRef = useRef(new AdaptiveQuality(15000))

  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3).fill(1)
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new Float32BufferAttribute(colors, 3))
    const mat = createParticleShaderMaterial(4.0)
    return { geometry: geo, material: mat }
  }, [])

  // Reusable objects — never allocate in the loop
  const target = useMemo(() => new Vector3(), [])
  const color = useMemo(() => new Color(), [])

  useFrame((_state, delta) => {
    const { compiledFn, controls, particleCount, pointSize } = useStore.getState()
    if (!compiledFn) return

    // Update adaptive quality
    const aq = adaptiveRef.current
    aq.setBaseCount(particleCount)
    aq.update(delta)
    const activeCount = aq.getParticleCount()

    // Update store for status bar
    useStore.getState().setFps(Math.round(1 / delta))
    useStore.getState().setActualParticleCount(activeCount)

    // Build control lookup
    const controlValues: Record<string, number> = {}
    for (const c of controls) {
      controlValues[c.id] = c.value
    }
    const getControl = (id: string): number => controlValues[id] ?? 0

    const setInfo = () => {} // no-op in render loop

    // Update shader uniform
    material.uniforms.uPointSize!.value = pointSize

    const positions = geometry.attributes.position!.array as Float32Array
    const colors = geometry.attributes.customColor!.array as Float32Array
    const time = _state.clock.elapsedTime

    for (let i = 0; i < activeCount; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      compiledFn(i, activeCount, target, color, time, THREE, getControl, setInfo, undefined)

      const i3 = i * 3
      positions[i3] = isFinite(target.x) ? target.x : 0
      positions[i3 + 1] = isFinite(target.y) ? target.y : 0
      positions[i3 + 2] = isFinite(target.z) ? target.z : 0
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    // Zero out unused particles
    for (let i = activeCount; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      positions[i3] = 0
      positions[i3 + 1] = 0
      positions[i3 + 2] = 0
    }

    geometry.attributes.position!.needsUpdate = true
    geometry.attributes.customColor!.needsUpdate = true
    geometry.setDrawRange(0, activeCount)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (or only non-critical warnings from external libs).

- [ ] **Step 3: Commit ParticleSystem**

```bash
git add src/engine/ParticleSystem.tsx
git commit -m "feat: add ParticleSystem R3F component with zero-alloc render loop"
```

---

## Chunk 3: Editor Layout + Presets

### Task 9: Three-Panel Editor Layout

**Files:**
- Create: `src/editor/TopBar.tsx`, `src/editor/StatusBar.tsx`, `src/editor/EditorLayout.tsx`, `src/editor/Viewport.tsx`, `src/editor/EffectBrowser.tsx`, `src/editor/ControlPanel.tsx`

- [ ] **Step 1: Create TopBar**

`src/editor/TopBar.tsx`:

```typescript
export function TopBar() {
  return (
    <div className="flex items-center justify-between h-12 px-4 bg-surface border-b border-border">
      <span className="font-mono text-accent font-bold tracking-wider">PRTCL</span>
      <button className="px-4 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors">
        Export
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create StatusBar**

`src/editor/StatusBar.tsx`:

```typescript
import { useStore } from '../store'

export function StatusBar() {
  const fps = useStore((s) => s.fps)
  const particleCount = useStore((s) => s.actualParticleCount)
  const info = useStore((s) => s.info)

  return (
    <div className="flex items-center gap-4 h-8 px-4 bg-surface border-t border-border text-xs font-mono text-text-muted">
      <span>{fps} fps</span>
      <span className="text-border">|</span>
      <span>{particleCount.toLocaleString()} particles</span>
      <span className="text-border">|</span>
      <span className="text-text">{info.title}</span>
    </div>
  )
}
```

- [ ] **Step 3: Create Viewport**

`src/editor/Viewport.tsx`:

```typescript
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ParticleSystem } from '../engine/ParticleSystem'
import { useStore } from '../store'

export function Viewport() {
  const backgroundColor = useStore((s) => s.backgroundColor)

  return (
    <div className="flex-1 min-w-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: backgroundColor }}
        gl={{ antialias: false, alpha: false }}
      >
        <ParticleSystem />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 4: Create EffectBrowser placeholder**

`src/editor/EffectBrowser.tsx`:

```typescript
import type { Effect } from '../engine/types'

interface EffectBrowserProps {
  effects: Effect[]
  selectedId: string | null
  onSelect: (effect: Effect) => void
}

export function EffectBrowser({ effects, selectedId, onSelect }: EffectBrowserProps) {
  const categories = ['organic', 'math', 'text', 'abstract'] as const
  const grouped = categories.map((cat) => ({
    category: cat,
    effects: effects.filter((e) => e.category === cat),
  }))

  return (
    <div className="w-[280px] bg-surface border-r border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search effects..."
          className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.map(({ category, effects: catEffects }) =>
          catEffects.length > 0 ? (
            <div key={category} className="mb-3">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-mono px-2 mb-1">
                {category}
              </div>
              {catEffects.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => onSelect(effect)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
                    selectedId === effect.id
                      ? 'bg-accent/15 text-accent'
                      : 'text-text hover:bg-border/30'
                  }`}
                >
                  {effect.name}
                </button>
              ))}
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create ControlPanel with Tweakpane**

`src/editor/ControlPanel.tsx`:

```typescript
import { useEffect, useRef } from 'react'
import { Pane } from 'tweakpane'
import { useStore } from '../store'

export function ControlPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const controls = useStore((s) => s.controls)
  const particleCount = useStore((s) => s.particleCount)
  const pointSize = useStore((s) => s.pointSize)

  useEffect(() => {
    if (!containerRef.current) return

    // Destroy previous pane
    paneRef.current?.dispose()

    const pane = new Pane({ container: containerRef.current })
    paneRef.current = pane

    // Global controls
    const globals = pane.addFolder({ title: 'Global' })
    const globalParams = { particleCount, pointSize }

    globals.addBinding(globalParams, 'particleCount', {
      min: 1000, max: 30000, step: 1000, label: 'Particles',
    }).on('change', (ev) => useStore.getState().setParticleCount(ev.value))

    globals.addBinding(globalParams, 'pointSize', {
      min: 1, max: 20, step: 0.5, label: 'Point Size',
    }).on('change', (ev) => useStore.getState().setPointSize(ev.value))

    // Effect controls
    if (controls.length > 0) {
      const effectFolder = pane.addFolder({ title: 'Effect' })
      const params: Record<string, number> = {}
      for (const c of controls) {
        params[c.id] = c.value
        effectFolder.addBinding(params, c.id, {
          min: c.min, max: c.max, label: c.label,
        }).on('change', (ev) => useStore.getState().setControl(c.id, ev.value))
      }
    }

    return () => {
      pane.dispose()
      paneRef.current = null
    }
  }, [controls, particleCount, pointSize])

  return (
    <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
      <div ref={containerRef} className="p-2" />
    </div>
  )
}
```

- [ ] **Step 6: Create EditorLayout combining all panels**

`src/editor/EditorLayout.tsx`:

```typescript
import { useCallback } from 'react'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { EffectBrowser } from './EffectBrowser'
import { Viewport } from './Viewport'
import { ControlPanel } from './ControlPanel'
import { useStore } from '../store'
import { compileEffect } from '../engine/compiler'
import { ALL_PRESETS } from '../effects/presets'
import type { Effect } from '../engine/types'

export function EditorLayout() {
  const selectedEffect = useStore((s) => s.selectedEffect)

  const handleSelectEffect = useCallback((effect: Effect) => {
    const result = compileEffect(effect)
    if (result.ok) {
      useStore.getState().setSelectedEffect(effect)
      useStore.getState().setCompiledFn(result.value.fn, result.value.controls, result.value.info)
      useStore.getState().setParticleCount(effect.particleCount)
    } else {
      console.error('Failed to compile effect:', result.error)
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-bg text-text">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <EffectBrowser
          effects={ALL_PRESETS}
          selectedId={selectedEffect?.id ?? null}
          onSelect={handleSelectEffect}
        />
        <Viewport />
        <ControlPanel />
      </div>
      <StatusBar />
    </div>
  )
}
```

- [ ] **Step 7: Wire EditorLayout into App router**

Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EditorLayout } from './editor/EditorLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/gallery" element={<div className="h-screen bg-bg text-text flex items-center justify-center font-mono">Gallery — coming soon</div>} />
        <Route path="*" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 8: Commit editor layout**

```bash
git add src/editor/ src/App.tsx
git commit -m "feat: add three-panel editor layout with Tweakpane controls"
```

---

### Task 10: Four Built-in Presets

**Files:**
- Create: `src/effects/presets/nebula.ts`, `src/effects/presets/lorenz.ts`, `src/effects/presets/galaxy.ts`, `src/effects/presets/starfield.ts`, `src/effects/presets/index.ts`

- [ ] **Step 1: Create Nebula Organica preset**

`src/effects/presets/nebula.ts`:

```typescript
import type { Effect } from '../../engine/types'

export const nebula: Effect = {
  id: 'nebula',
  slug: 'nebula-organica',
  name: 'Nebula Organica',
  description: 'Volumetric gas cloud with FBM turbulence and breathing',
  author: 'PRTCL Team',
  category: 'organic',
  tags: ['organic', 'nebula', 'volumetric'],
  particleCount: 15000,
  cameraDistance: 5,
  createdAt: '2026-03-16T00:00:00.000Z',
  code: `
const speed = addControl('speed', 'Speed', 0.1, 3, 0.8);
const scale = addControl('scale', 'Scale', 0.5, 5, 2.5);
const turbulence = addControl('turbulence', 'Turbulence', 0, 2, 0.8);

const phi = (i / count) * Math.PI * 2 * 100;
const theta = Math.acos(2 * (i / count) - 1);
const r = scale * Math.cbrt(i / count);

const noiseX = Math.sin(phi * 1.3 + time * speed) * turbulence;
const noiseY = Math.cos(theta * 1.7 + time * speed * 0.7) * turbulence;
const noiseZ = Math.sin((phi + theta) * 0.9 + time * speed * 0.5) * turbulence;

const breathe = 1 + Math.sin(time * speed * 0.3) * 0.15;

target.set(
  (Math.sin(theta) * Math.cos(phi) * r + noiseX) * breathe,
  (Math.sin(theta) * Math.sin(phi) * r + noiseY) * breathe,
  (Math.cos(theta) * r + noiseZ) * breathe
);

const hue = 0.6 + Math.sin(phi + time * 0.2) * 0.1;
color.setHSL(hue, 0.7, 0.5 + Math.sin(i * 0.01 + time) * 0.2);
`,
}
```

- [ ] **Step 2: Create Lorenz Attractor preset**

`src/effects/presets/lorenz.ts`:

```typescript
import type { Effect } from '../../engine/types'

export const lorenz: Effect = {
  id: 'lorenz',
  slug: 'lorenz-attractor',
  name: 'Lorenz Attractor',
  description: 'Strange attractor with chaotic trajectories',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['math', 'attractor', 'chaotic'],
  particleCount: 12000,
  cameraDistance: 50,
  createdAt: '2026-03-16T00:00:00.000Z',
  code: `
const sigma = addControl('sigma', 'Sigma', 1, 20, 10);
const rho = addControl('rho', 'Rho', 10, 40, 28);
const beta = addControl('beta', 'Beta', 0.5, 5, 2.667);
const speed = addControl('speed', 'Speed', 0.1, 3, 1);

const seed = i * 0.001;
let x = 0.1 + seed;
let y = 0;
let z = 0;
const dt = 0.005 * speed;
const steps = Math.floor(time * 100) % 500 + i % 200;

for (let s = 0; s < steps; s++) {
  const dx = sigma * (y - x) * dt;
  const dy = (x * (rho - z) - y) * dt;
  const dz = (x * y - beta * z) * dt;
  x += dx;
  y += dy;
  z += dz;
}

target.set(x * 0.1, y * 0.1, (z - 25) * 0.1);

const hue = (Math.atan2(y, x) / Math.PI + 1) * 0.5;
color.setHSL(hue * 0.3 + 0.55, 0.9, 0.55);
`,
}
```

- [ ] **Step 3: Create Spiral Galaxy preset**

`src/effects/presets/galaxy.ts`:

```typescript
import type { Effect } from '../../engine/types'

export const galaxy: Effect = {
  id: 'galaxy',
  slug: 'spiral-galaxy',
  name: 'Spiral Galaxy',
  description: 'Logarithmic spiral arms with orbital dynamics',
  author: 'PRTCL Team',
  category: 'math',
  tags: ['math', 'galaxy', 'spiral'],
  particleCount: 18000,
  cameraDistance: 8,
  createdAt: '2026-03-16T00:00:00.000Z',
  code: `
const arms = addControl('arms', 'Arms', 2, 8, 4);
const spin = addControl('spin', 'Spin', 0.1, 3, 1.2);
const spread = addControl('spread', 'Spread', 0, 1, 0.4);

const arm = i % arms;
const posInArm = Math.floor(i / arms) / (count / arms);

const angle = posInArm * Math.PI * 4 + (arm / arms) * Math.PI * 2 + time * spin * 0.1;
const radius = posInArm * 3.5;

const spiralX = Math.cos(angle) * radius;
const spiralZ = Math.sin(angle) * radius;

const jitterX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453 % 1 - 0.5) * spread * posInArm;
const jitterY = (Math.cos(i * 63.7264 + 10.873) * 43758.5453 % 1 - 0.5) * spread * 0.3;
const jitterZ = (Math.sin(i * 39.3468 + 47.135) * 43758.5453 % 1 - 0.5) * spread * posInArm;

target.set(spiralX + jitterX, jitterY, spiralZ + jitterZ);

const hue = 0.6 - posInArm * 0.15;
const lightness = 0.5 + (1 - posInArm) * 0.3;
color.setHSL(hue, 0.7, lightness);
`,
}
```

- [ ] **Step 4: Create Starfield preset**

`src/effects/presets/starfield.ts`:

```typescript
import type { Effect } from '../../engine/types'

export const starfield: Effect = {
  id: 'starfield',
  slug: 'starfield',
  name: 'Starfield',
  description: 'Classic warp-speed star tunnel',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['abstract', 'starfield', 'warp'],
  particleCount: 10000,
  cameraDistance: 1,
  createdAt: '2026-03-16T00:00:00.000Z',
  code: `
const speed = addControl('speed', 'Warp Speed', 0.1, 5, 1.5);
const spread = addControl('spread', 'Spread', 1, 10, 4);

const hash = Math.sin(i * 12.9898 + 78.233) * 43758.5453 % 1;
const hash2 = Math.cos(i * 63.7264 + 10.873) * 43758.5453 % 1;

const angle = hash * Math.PI * 2;
const radius = Math.sqrt(hash2) * spread;
const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius;

const z = ((hash * 20 + time * speed * 3) % 20) - 10;

target.set(x, y, z);

const brightness = 0.3 + (1 - (z + 10) / 20) * 0.7;
color.setHSL(0.6 + hash * 0.1, 0.1 + hash2 * 0.3, brightness);
`,
}
```

- [ ] **Step 5: Create preset index**

`src/effects/presets/index.ts`:

```typescript
import { nebula } from './nebula'
import { lorenz } from './lorenz'
import { galaxy } from './galaxy'
import { starfield } from './starfield'
import type { Effect } from '../../engine/types'

export const ALL_PRESETS: Effect[] = [nebula, lorenz, galaxy, starfield]
```

- [ ] **Step 6: Verify everything compiles and dev server works**

```bash
npx tsc --noEmit && npm run dev
```

Expected: No type errors. Dev server starts. Navigate to `/create` — should see three-panel layout with effect list on left. Click "Nebula Organica" — particles should appear in viewport.

- [ ] **Step 7: Commit presets**

```bash
git add src/effects/
git commit -m "feat: add 4 built-in presets (Nebula, Lorenz, Galaxy, Starfield)"
```

---

### Task 11: Auto-select First Effect on Load

**Files:**
- Modify: `src/editor/EditorLayout.tsx`

- [ ] **Step 1: Add useEffect to auto-select first preset**

Add to `EditorLayout.tsx` after the `handleSelectEffect` callback:

```typescript
import { useCallback, useEffect } from 'react'
// ... existing imports ...

// Inside EditorLayout component, after handleSelectEffect:
useEffect(() => {
  if (!selectedEffect && ALL_PRESETS.length > 0) {
    handleSelectEffect(ALL_PRESETS[0]!)
  }
}, [selectedEffect, handleSelectEffect])
```

- [ ] **Step 2: Verify particles render on page load**

```bash
npm run dev
```

Navigate to `/create`. Particles should render immediately without needing to click.

- [ ] **Step 3: Commit**

```bash
git add src/editor/EditorLayout.tsx
git commit -m "feat: auto-select first preset on editor load"
```

---

### Task 12: End-to-End Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual verification in browser**

Open `http://localhost:5173/create` and verify:
1. Three-panel layout renders (sidebar, canvas, control panel)
2. Four effects listed in sidebar
3. Nebula auto-selected and particles visible
4. Clicking different effects switches the particle system
5. Tweakpane sliders appear and changing values updates particles in real-time
6. FPS counter shows in status bar
7. Orbit controls work (drag to rotate, scroll to zoom)

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: Successful production build.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found in e2e verification"
```

(Skip if no fixes needed.)
