# Share Button Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Share button to the TopBar that serializes the entire editor state into a URL hash, copies it to clipboard, and restores state from hash on page load.

**Architecture:** Hash-based state encoding (`prtcl.es/create#effect=frequency&p=20000&...`). Pure-function serializer/deserializer with short param keys. On mount, hash is parsed and a modified effect copy (with overridden camera/settings) is passed to `handleSelectEffect`, so the splash explosion naturally morphs to the shared camera position. Toast notification confirms clipboard copy.

**Tech Stack:** React, Zustand, react-router-dom (useLocation), Clipboard API, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/share/types.ts` | `ShareState` interface |
| Create | `src/share/serialize.ts` | `encodeShareState()` → hash string, `parseShareHash()` → ShareState or null |
| Create | `src/share/index.ts` | Barrel export |
| Create | `src/components/Toast.tsx` | Auto-dismiss toast notification |
| Create | `src/test/share-serialize.test.ts` | Round-trip serialization tests |
| Modify | `src/store.ts` | Add `toastMessage` + `showToast()` + `clearToast()` |
| Modify | `src/editor/TopBar.tsx` | Add Share button (desktop + mobile) |
| Modify | `src/editor/EditorLayout.tsx` | Parse hash on mount, apply share state |

---

## URL Format

Short-but-readable param keys. Controls as JSON. Camera as comma-separated floats (3 decimals).

```
prtcl.es/create#effect=frequency&p=20000&ps=1&ar=2.5&z=1&cam=1.837,0,3.063&tgt=0,0,0&bg=nebula&c=%7B%22freq%22%3A2.5%7D
```

| Key | Field | Example |
|-----|-------|---------|
| `effect` | Effect ID | `frequency` |
| `p` | particleCount | `20000` |
| `ps` | pointSize | `1.0` |
| `ar` | autoRotateSpeed | `2.5` |
| `z` | cameraZoom | `1` |
| `cam` | Camera position (x,y,z) | `1.837,0,3.063` |
| `tgt` | Camera target (x,y,z) | `0,0,0` |
| `bg` | Background preset ID | `nebula` |
| `bgc` | Custom bg color (hex, no #) | `ff00ff` |
| `c` | Controls JSON | `{"freq":2.5}` |
| `txt` | Text input (for text effects) | `Hello` |
| `font` | Font family | `Pacifico` |
| `w` | Font weight | `700` |
| `ls` | Line spacing | `1.2` |

---

## Restore Flow (Critical Timing)

The splash screen plays on every load, including share URLs. The trick: create a modified effect copy with shared camera/settings, so `handleExplodeStart` in App.tsx naturally reads the shared camera position from `selectedEffect.cameraPosition`.

```
1. EditorLayout mounts
2. Parse hash → ShareState
3. Find effect by ID in ALL_PRESETS (fall back to ALL_PRESETS[0])
4. Create modified effect copy: { ...effect, cameraPosition: shared, particleCount: shared, ... }
5. handleSelectEffect(modifiedEffect, { skipCamera: true })
6. Override control values via updateControlValue() for each shared control
7. Set background, text params
8. Splash plays → explosion → handleExplodeStart reads selectedEffect.cameraPosition (= shared) → camera morphs to shared position
9. Splash completes → UI reveals → user sees exact shared state
```

No changes to App.tsx needed. The explosion callback naturally uses the stored effect's camera position.

---

## Task 1: ShareState Type

**Files:**
- Create: `src/share/types.ts`

- [ ] **Step 1: Create ShareState interface**

```typescript
// src/share/types.ts

/** Decoded share state from URL hash. All fields optional except effect. */
export interface ShareState {
  effect: string                            // Effect ID (required)
  p?: number                                // particleCount
  ps?: number                               // pointSize
  ar?: number                               // autoRotateSpeed
  z?: number                                // cameraZoom
  cam?: [number, number, number]            // cameraPosition
  tgt?: [number, number, number]            // cameraTarget
  bg?: string                               // backgroundPreset ID
  bgc?: string                              // custom background color (hex, no #)
  c?: Record<string, number>                // control values { id: value }
  txt?: string                              // textInput
  font?: string                             // textFont
  w?: string                                // textWeight
  ls?: number                               // textLineSpacing
}
```

- [ ] **Step 2: Commit**

```bash
git add src/share/types.ts
git commit -m "feat(share): add ShareState type"
```

---

## Task 2: Serialize / Deserialize Pure Functions

**Files:**
- Create: `src/share/serialize.ts`
- Create: `src/share/index.ts`

- [ ] **Step 1: Write encodeShareState**

This function takes the current editor state + live camera snapshot and returns a hash string.

```typescript
// src/share/serialize.ts
import type { ShareState } from './types'

const R = (n: number) => Math.round(n * 1000) / 1000

function encodeVec3(v: [number, number, number]): string {
  return `${R(v[0])},${R(v[1])},${R(v[2])}`
}

function decodeVec3(s: string): [number, number, number] | undefined {
  const parts = s.split(',').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return undefined
  return parts as [number, number, number]
}

/**
 * Encode editor state into a URL hash string (without the leading #).
 */
export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams()

  params.set('effect', state.effect)
  if (state.p != null) params.set('p', String(state.p))
  if (state.ps != null) params.set('ps', String(R(state.ps)))
  if (state.ar != null) params.set('ar', String(R(state.ar)))
  if (state.z != null) params.set('z', String(R(state.z)))
  if (state.cam) params.set('cam', encodeVec3(state.cam))
  if (state.tgt) params.set('tgt', encodeVec3(state.tgt))
  if (state.bg) params.set('bg', state.bg)
  if (state.bgc) params.set('bgc', state.bgc)
  if (state.c && Object.keys(state.c).length > 0) {
    // Round control values to 3 decimals
    const rounded: Record<string, number> = {}
    for (const [k, v] of Object.entries(state.c)) rounded[k] = R(v)
    params.set('c', JSON.stringify(rounded))
  }
  if (state.txt) params.set('txt', state.txt)
  if (state.font) params.set('font', state.font)
  if (state.w) params.set('w', state.w)
  if (state.ls != null) params.set('ls', String(R(state.ls)))

  return params.toString()
}

/**
 * Parse a URL hash string into ShareState. Returns null if no valid effect found.
 */
export function parseShareHash(hash: string): ShareState | null {
  // Strip leading # if present
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const effect = params.get('effect')
  if (!effect) return null

  const state: ShareState = { effect }

  const p = parseInt(params.get('p') ?? '')
  if (!isNaN(p) && p > 0) state.p = p

  const ps = parseFloat(params.get('ps') ?? '')
  if (!isNaN(ps) && ps > 0) state.ps = ps

  const ar = parseFloat(params.get('ar') ?? '')
  if (!isNaN(ar)) state.ar = ar

  const z = parseFloat(params.get('z') ?? '')
  if (!isNaN(z) && z > 0) state.z = z

  const cam = params.get('cam')
  if (cam) {
    const v = decodeVec3(cam)
    if (v) state.cam = v
  }

  const tgt = params.get('tgt')
  if (tgt) {
    const v = decodeVec3(tgt)
    if (v) state.tgt = v
  }

  const bg = params.get('bg')
  if (bg) state.bg = bg

  const bgc = params.get('bgc')
  if (bgc) state.bgc = bgc

  const c = params.get('c')
  if (c) {
    try {
      const parsed = JSON.parse(c)
      if (typeof parsed === 'object' && parsed !== null) {
        state.c = parsed as Record<string, number>
      }
    } catch { /* ignore malformed controls */ }
  }

  const txt = params.get('txt')
  if (txt) state.txt = txt

  const font = params.get('font')
  if (font) state.font = font

  const w = params.get('w')
  if (w) state.w = w

  const ls = parseFloat(params.get('ls') ?? '')
  if (!isNaN(ls)) state.ls = ls

  return state
}
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/share/index.ts
export { encodeShareState, parseShareHash } from './serialize'
export type { ShareState } from './types'
```

- [ ] **Step 3: Commit**

```bash
git add src/share/
git commit -m "feat(share): serialize/deserialize pure functions"
```

---

## Task 3: Tests for Serialize / Deserialize

**Files:**
- Create: `src/test/share-serialize.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/test/share-serialize.test.ts
import { describe, it, expect } from 'vitest'
import { encodeShareState, parseShareHash } from '../share/serialize'
import type { ShareState } from '../share/types'

describe('encodeShareState', () => {
  it('encodes minimal state (effect only)', () => {
    const hash = encodeShareState({ effect: 'frequency' })
    expect(hash).toContain('effect=frequency')
  })

  it('encodes full state with all fields', () => {
    const state: ShareState = {
      effect: 'perlin-noise',
      p: 20000,
      ps: 2.5,
      ar: 1.5,
      z: 1.2,
      cam: [1.837, 0.5, 3.063],
      tgt: [0, 0.1, 0],
      bg: 'plasma',
      c: { velocity: 0.001, turbulence: 0.5 },
      txt: 'Hello World',
      font: 'Orbitron',
      w: '700',
      ls: 1.5,
    }
    const hash = encodeShareState(state)
    expect(hash).toContain('effect=perlin-noise')
    expect(hash).toContain('p=20000')
    expect(hash).toContain('ps=2.5')
    expect(hash).toContain('cam=1.837%2C0.5%2C3.063')
    expect(hash).toContain('bg=plasma')
  })

  it('rounds floats to 3 decimals', () => {
    const hash = encodeShareState({
      effect: 'test',
      ps: 1.23456789,
      cam: [1.111111, 2.222222, 3.333333],
    })
    expect(hash).toContain('ps=1.235')
    expect(hash).toContain('cam=1.111%2C2.222%2C3.333')
  })

  it('omits undefined optional fields', () => {
    const hash = encodeShareState({ effect: 'frequency' })
    expect(hash).not.toContain('p=')
    expect(hash).not.toContain('cam=')
    expect(hash).not.toContain('c=')
  })
})

describe('parseShareHash', () => {
  it('returns null for empty hash', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#')).toBeNull()
  })

  it('returns null if no effect param', () => {
    expect(parseShareHash('#p=20000&ps=2.5')).toBeNull()
  })

  it('parses minimal state', () => {
    const result = parseShareHash('#effect=frequency')
    expect(result).toEqual({ effect: 'frequency' })
  })

  it('parses all fields', () => {
    const hash = '#effect=nebula&p=15000&ps=1.5&ar=2&z=1.2&cam=1,2,3&tgt=0,0.5,0&bg=aurora&c=%7B%22speed%22%3A0.5%7D&txt=Test&font=Pacifico&w=400&ls=1.2'
    const result = parseShareHash(hash)
    expect(result).toEqual({
      effect: 'nebula',
      p: 15000,
      ps: 1.5,
      ar: 2,
      z: 1.2,
      cam: [1, 2, 3],
      tgt: [0, 0.5, 0],
      bg: 'aurora',
      c: { speed: 0.5 },
      txt: 'Test',
      font: 'Pacifico',
      w: '400',
      ls: 1.2,
    })
  })

  it('handles hash with and without leading #', () => {
    const withHash = parseShareHash('#effect=frequency')
    const withoutHash = parseShareHash('effect=frequency')
    expect(withHash).toEqual(withoutHash)
  })

  it('ignores invalid vec3 values', () => {
    const result = parseShareHash('#effect=test&cam=bad,data')
    expect(result?.cam).toBeUndefined()
  })

  it('ignores malformed controls JSON', () => {
    const result = parseShareHash('#effect=test&c=not-json')
    expect(result?.c).toBeUndefined()
  })

  it('ignores negative particleCount', () => {
    const result = parseShareHash('#effect=test&p=-100')
    expect(result?.p).toBeUndefined()
  })
})

describe('round-trip', () => {
  it('encode then decode preserves all values', () => {
    const original: ShareState = {
      effect: 'fractal-frequency',
      p: 20000,
      ps: 1.5,
      ar: 2.5,
      z: 1,
      cam: [1.837, 0, 3.063],
      tgt: [0, 0, 0],
      bg: 'nebula',
      c: { freq: 2.5, amp: 15, pulse: 0.633 },
      txt: 'PRTCL',
      font: 'Orbitron',
      w: '700',
      ls: 1.0,
    }
    const hash = encodeShareState(original)
    const decoded = parseShareHash('#' + hash)
    expect(decoded).toEqual(original)
  })

  it('round-trip with special chars in text', () => {
    const original: ShareState = {
      effect: 'text-wave',
      txt: 'Hello & World!',
    }
    const hash = encodeShareState(original)
    const decoded = parseShareHash('#' + hash)
    expect(decoded?.txt).toBe('Hello & World!')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail (no implementation yet — but implementation was in Task 2)**

If Task 2 was completed first:

```bash
npx vitest run src/test/share-serialize.test.ts
```

Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/test/share-serialize.test.ts
git commit -m "test(share): serialize/deserialize round-trip tests"
```

---

## Task 4: Store — Toast State

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Add toast fields to PrtclState interface**

After the `exportModalOpen` field (line 38), add:

```typescript
  // Toast
  toastMessage: string | null
```

After `setExportModalOpen` action (line 82), add:

```typescript
  showToast: (message: string) => void
  clearToast: () => void
```

- [ ] **Step 2: Add initial values and actions to the store**

After `exportModalOpen: false,` (line 133), add:

```typescript
  // Toast
  toastMessage: null,
```

After `setExportModalOpen: (open) => set({ exportModalOpen: open }),` (line 185), add:

```typescript
  showToast: (message) => {
    if (_toastTimer) clearTimeout(_toastTimer)
    set({ toastMessage: message })
    _toastTimer = setTimeout(() => {
      set({ toastMessage: null })
      _toastTimer = null
    }, 2500)
  },
  clearToast: () => {
    if (_toastTimer) clearTimeout(_toastTimer)
    _toastTimer = null
    set({ toastMessage: null })
  },
```

Also add this module-level variable near the top of the file, next to the existing `_lastPerfUpdate` and `_pendingParticleCount` (around line 98):

```typescript
/** Timer ID for auto-dismissing toast */
let _toastTimer: ReturnType<typeof setTimeout> | null = null
```

- [ ] **Step 3: Commit**

```bash
git add src/store.ts
git commit -m "feat(store): add toast message state"
```

---

## Task 5: Toast Component

**Files:**
- Create: `src/components/Toast.tsx`

- [ ] **Step 1: Create the Toast component**

Minimal, auto-dismiss, acid-pop styled. Positioned top-center, slides down from above.

```typescript
// src/components/Toast.tsx
import { useStore } from '../store'

export function Toast() {
  const message = useStore((s) => s.toastMessage)

  if (!message) return null

  return (
    <div className="fixed top-16 left-0 right-0 mx-auto w-fit z-[100]
      px-5 py-2.5 rounded-lg
      bg-elevated border border-accent/30
      text-text text-sm font-mono
      shadow-[0_4px_24px_rgba(255,43,214,0.15)]
      animate-[toastSlideDown_300ms_ease-out]
      pointer-events-none"
    >
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Add toastSlideDown keyframe to `src/index.css`**

**Important:** There is an existing `@keyframes slideDown` at line ~160 used by mobile dropdown. Do NOT overwrite it. Use a unique name.

After the existing `slideDown` animation block (around line 172), add:

```css
/* Toast notification slide-in */
@keyframes toastSlideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Mount Toast in EditorLayout**

In `src/editor/EditorLayout.tsx`, import and render `<Toast />` at the end of the root div (after `<ExportModal />`):

```typescript
import { Toast } from '../components/Toast'
```

```tsx
      <ExportModal />
      <Toast />
    </div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast.tsx src/index.css src/editor/EditorLayout.tsx
git commit -m "feat(ui): add Toast notification component"
```

---

## Task 6: Share Button in TopBar

**Files:**
- Modify: `src/editor/TopBar.tsx`

- [ ] **Step 1: Add share handler**

Import the share utilities and camera bridge at the top of `TopBar.tsx`:

```typescript
import { encodeShareState } from '../share'
import { getCameraSnapshot } from '../engine/camera-bridge'
import { getBackgroundPreset } from './background-presets'
```

Add the share callback inside the component, after the existing `handleMobileSelect` callback:

```typescript
  const handleShare = useCallback(async () => {
    const store = useStore.getState()
    const effect = store.selectedEffect
    if (!effect) return

    const camSnap = getCameraSnapshot()
    const isTextEffect = effect.category === 'text'

    // Build control values map
    const controlValues: Record<string, number> = {}
    for (const ctrl of store.controls) {
      controlValues[ctrl.id] = ctrl.value
    }

    // Determine background: preset ID if known, otherwise custom hex
    const bgPreset = getBackgroundPreset(store.backgroundPreset) ? store.backgroundPreset : undefined
    const bgCustom = !bgPreset ? store.backgroundColor.replace(/^#/, '') : undefined

    const hash = encodeShareState({
      effect: effect.id,
      p: store.particleCount,
      ps: store.pointSize,
      ar: store.autoRotateSpeed,
      z: store.cameraZoom,
      cam: camSnap?.position,
      tgt: camSnap?.target,
      bg: bgPreset,
      bgc: bgCustom,
      c: controlValues,
      txt: isTextEffect ? store.textInput : undefined,
      font: isTextEffect ? store.textFont : undefined,
      w: isTextEffect ? store.textWeight : undefined,
      ls: isTextEffect ? store.textLineSpacing : undefined,
    })

    const url = `${window.location.origin}/create#${hash}`

    try {
      await navigator.clipboard.writeText(url)
      store.showToast('Link copied. Deploy at will.')
    } catch {
      // Fallback for older browsers / iframe restrictions
      store.showToast('Could not copy — check browser permissions.')
    }
  }, [])
```

- [ ] **Step 2: Add Share button to the JSX**

Insert the Share button BEFORE the Export button, inside the right-side actions div. After the Fullscreen button (line 186), before the Export conditional (line 188):

```tsx
          {/* Share */}
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors"
            title="Copy share link"
          >
            Share
          </button>
```

Note: This button renders for both desktop and mobile (Share is useful everywhere, unlike Export which needs the full editor).

- [ ] **Step 3: Commit**

```bash
git add src/editor/TopBar.tsx
git commit -m "feat(share): add Share button to TopBar"
```

---

## Task 7: Hash Restore on Mount

**Files:**
- Modify: `src/editor/EditorLayout.tsx`

This is the most critical task. On mount, parse the URL hash and use it to override the initial effect selection.

- [ ] **Step 1: Import share utilities**

At the top of `EditorLayout.tsx`, add:

```typescript
import { parseShareHash } from '../share'
import { getBackgroundPreset } from './background-presets'
```

- [ ] **Step 2: Modify the initial effect selection useEffect**

Replace the existing mount effect (lines 100-105):

```typescript
  useEffect(() => {
    if (!selectedEffect && ALL_PRESETS.length > 0) {
      // Skip camera on initial load — explosion callback will trigger the zoom-in
      handleSelectEffect(ALL_PRESETS[0]!, { skipCamera: true })
    }
  }, [selectedEffect, handleSelectEffect])
```

With:

```typescript
  useEffect(() => {
    if (selectedEffect || !ALL_PRESETS.length) return

    // Parse hash for share state
    const shareState = parseShareHash(window.location.hash)

    // Find the effect to load
    let effectToLoad = ALL_PRESETS[0]!
    if (shareState) {
      const found = ALL_PRESETS.find((e) => e.id === shareState.effect)
      if (found) {
        // Create modified copy with shared camera/settings so the explosion
        // callback in App.tsx reads the shared camera position from selectedEffect
        effectToLoad = {
          ...found,
          particleCount: shareState.p ?? found.particleCount,
          pointSize: shareState.ps ?? found.pointSize,
          autoRotateSpeed: shareState.ar ?? found.autoRotateSpeed,
          cameraPosition: shareState.cam ?? found.cameraPosition,
          cameraTarget: shareState.tgt ?? found.cameraTarget,
        }
      }
    }

    // Skip camera on initial load — explosion callback will trigger the zoom-in
    handleSelectEffect(effectToLoad, { skipCamera: true })

    // Apply remaining share overrides (controls, background, text, zoom)
    if (shareState) {
      const store = useStore.getState()

      // Override control values
      if (shareState.c) {
        for (const [id, value] of Object.entries(shareState.c)) {
          store.updateControlValue(id, value)
        }
      }

      // Camera zoom — must come AFTER handleSelectEffect which resets zoom to 1
      if (shareState.z != null) store.setCameraZoom(shareState.z)

      // Background
      if (shareState.bg && getBackgroundPreset(shareState.bg)) {
        store.setBackgroundPreset(shareState.bg)
      } else if (shareState.bgc) {
        store.setBackgroundColor(`#${shareState.bgc}`)
      }

      // Text params (for text effects)
      if (shareState.txt) store.setTextInput(shareState.txt)
      if (shareState.font) store.setTextFont(shareState.font)
      if (shareState.w) store.setTextWeight(shareState.w)
      if (shareState.ls != null) store.setTextLineSpacing(shareState.ls)

      // Clean up hash from URL bar (state is restored, hash is now stale)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedEffect, handleSelectEffect])
```

Note: No new imports needed beyond `parseShareHash` and `getBackgroundPreset`. After restore, the hash is cleaned from the URL bar via `replaceState` so stale state doesn't confuse users.

- [ ] **Step 3: Commit**

```bash
git add src/editor/EditorLayout.tsx
git commit -m "feat(share): restore state from URL hash on mount"
```

---

## Task 8: Verify & Polish

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All pass (existing + new share tests).

- [ ] **Step 2: Run type check**

```bash
npx tsc -b
```

Expected: No errors.

- [ ] **Step 3: Manual testing checklist**

Run `npm run dev` and verify:

1. **Share button visible** — in TopBar, next to fullscreen/export
2. **Click Share** — toast appears "Link copied. Deploy at will."
3. **Paste URL** — hash contains all current state params
4. **Open share URL in new tab** — splash plays, then shared effect renders with correct:
   - Effect (correct preset loaded)
   - Camera position (shared angle, not preset default)
   - Particle count and point size
   - Control values (sliders show shared values in Tweakpane)
   - Background (correct preset or custom color)
   - Auto-rotate speed
5. **Text effect share** — share a text effect with custom text/font → URL restores text
6. **Invalid hash** — `#effect=nonexistent` → falls back to Fractal Frequency
7. **Empty hash** — normal behavior, no errors
8. **Mobile** — Share button works, copies URL

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: Clean build, no warnings.

- [ ] **Step 5: Final commit (if any polish changes)**

```bash
git add -A
git commit -m "feat(share): Phase 3.9 complete — share button with URL state"
```

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| Unknown effect ID in URL | Falls back to ALL_PRESETS[0] (Fractal Frequency) |
| Invalid control values | Ignored, uses compiled defaults |
| Malformed controls JSON | Ignored gracefully (try/catch) |
| Invalid vec3 (camera/target) | Skipped, uses effect preset position |
| Custom renderer effects (Paper Fleet, Text Terrain) | Share works normally (share is not export) |
| No clipboard API (old browser) | Toast shows permission error message |
| Special chars in text input | URL-encoded by URLSearchParams automatically |
| Hash without leading # | Handled (stripped in parseShareHash) |
| Negative/zero particle count | Ignored (validation: p > 0) |
