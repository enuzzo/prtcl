# PROMPT: Integrate "The Spirit" by Edan Kwan into PRTCL

## CRITICAL RULE — READ THIS FIRST

**DO NOT MODIFY THE ORIGINAL CODE. DO NOT ADAPT IT. DO NOT "PORT" IT. DO NOT REWRITE IT. DO NOT IMPROVE IT. DO NOT OPTIMIZE IT. DO NOT MODERNIZE IT.**

The previous attempt spent 80 minutes rewriting the shaders, the rendering pipeline, the background system, the lighting, and the controls — and produced a completely broken, non-functional result. A gray screen with no shadows, no ground, no atmosphere, no resemblance whatsoever to the original.

**THE ONLY CORRECT APPROACH: Run the original code AS-IS inside an isolated Three.js renderer that has NOTHING to do with PRTCL's R3F Canvas.**

## What "The Spirit" is

A standalone Three.js application by Edan Kwan (MIT License). It creates 65,536 particles via GPGPU curl noise simulation on a light gray (#dfdfdf) background with a floor plane, fog, point light shadows, and orbit controls. It is beautiful, self-contained, and requires ZERO modifications.

- **GitHub**: https://github.com/edankwan/The-Spirit
- **Live demo**: http://edankwan.com/experiments/the-spirit/
- **CodePen**: The bundled JS is at `incoming/effects/the-spirit/` (extracted from the CodePen export)

## Source files location

The complete original source is at:
- `incoming/effects/the-spirit/dist/script.js` — the full bundled application
- `incoming/effects/the-spirit/dist/style.css` — the original CSS
- `incoming/effects/the-spirit/dist/index.html` — the original HTML

**READ THESE FILES FIRST. Study them. Understand that this is a COMPLETE, SELF-CONTAINED Three.js application that creates its own renderer, camera, scene, controls, lights, floor, fog, and particle system.**

## WHY the previous attempt failed

1. **Tried to use PRTCL's R3F Canvas** — The Spirit needs its OWN Three.js renderer, scene, camera. R3F's Canvas fights with it over scene.background, fog, clear color, shadow maps, and camera controls.

2. **Rewrote the shaders** — The original shaders use THREE.ShaderChunk includes for shadow mapping (`// chunk(shadowmap_pars_vertex)` etc). The port stripped these out, removing all shadows.

3. **Changed the background system** — The original uses `renderer.setClearColor('#dfdfdf')` + `scene.fog = FogExp2('#dfdfdf')` + floor color lerp. The port tried to use PRTCL's scene.background system, which is a completely different mechanism that doesn't work the same way.

4. **Changed the lighting** — Added directional lights that don't exist in the original. Changed shadow map sizes. Changed floor material properties.

5. **Changed the orbit and speed** — Added a "speed" control that doesn't exist. Changed orbit radius, height, and speed multipliers.

6. **Pretended it worked when it clearly didn't** — Saw a gray screen with no particles visible and called it "ottimo".

## THE CORRECT INTEGRATION APPROACH

### Architecture: Dedicated DOM element with its own WebGL renderer

The Spirit custom renderer component in PRTCL must:

1. **Create a dedicated `<div>` that overlays the R3F Canvas** (or replaces it visually)
2. **Create its own `THREE.WebGLRenderer`** inside that div — completely separate from R3F
3. **Run the original application code VERBATIM** inside this separate renderer
4. **Read PRTCL control values from Zustand** and map them to the original `settings` object
5. **Clean up on unmount** — dispose renderer, stop animation loop, remove DOM element

### DO NOT:
- ❌ Use R3F's `<Canvas>`, `useFrame`, `useThree`, or any R3F component
- ❌ Modify ANY shader code — not one character
- ❌ Change the background color, fog density, floor material, light positions, or shadow settings
- ❌ Change the camera FOV, near, far, or position
- ❌ Change the orbit radius, height, speed, or easing
- ❌ Add bloom, tone mapping, or any post-processing
- ❌ Change `blending: THREE.NoBlending` to anything else
- ❌ Remove or modify the `customDistanceMaterial` (this is what creates shadows)
- ❌ Remove or modify the `shaderParse` function (this replaces `// chunk()` with THREE.ShaderChunk)
- ❌ Remove or modify the floor, fog, or clear color system
- ❌ Try to make it "fit" PRTCL's dark theme — the original is LIGHT GRAY and that's correct

### DO:
- ✅ Read the ENTIRE original source code before writing a single line
- ✅ Create a self-contained component that manages its own WebGL context
- ✅ Copy the original `shaderParse` function EXACTLY
- ✅ Copy ALL shader strings EXACTLY as they appear in the original
- ✅ Copy the `settings` object EXACTLY with original default values
- ✅ Copy the `simulator`, `particles`, `lights`, `floor` modules EXACTLY
- ✅ Copy the OrbitControls configuration EXACTLY (rotateEaseRatio, zoomEaseRatio, maxDistance, minPolarAngle, maxPolarAngle, noPan)
- ✅ Use `dat.GUI` controls mapping: the original has `dieSpeed`, `radius`, `attraction`, `followMouse`, `shadowDarkness`, `useTriangleParticles`, `color1`, `color2`, `bgColor`
- ✅ Map PRTCL Tweakpane controls to the original settings object
- ✅ Handle resize events for the dedicated renderer
- ✅ Verify BY LOOKING AT THE RESULT that it matches the original CodePen EXACTLY

### Implementation skeleton

```typescript
// src/engine/Spirit.tsx
export function Spirit() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // === CREATE EVERYTHING THE ORIGINAL CREATES ===
    // Own renderer (NOT R3F's)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setClearColor('#dfdfdf')
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    // Own scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#dfdfdf', 0.001)

    // Own camera (original values EXACTLY)
    const camera = new THREE.PerspectiveCamera(45, w/h, 10, 3000)
    camera.position.set(300, 60, 300).normalize().multiplyScalar(1000)

    // Own OrbitControls (original values EXACTLY)
    // ... maxDistance, minPolarAngle, maxPolarAngle, noPan, rotateEaseRatio, zoomEaseRatio

    // Floor (original values EXACTLY)
    // PlaneBufferGeometry(4500, 4500, 10, 10), roughness 0.4, metalness 0.4

    // Lights (original values EXACTLY)
    // AmbientLight(0x333333) + PointLight(0xffffff, 1, 700) with shadow

    // GPGPU simulator (COPY VERBATIM from original modules 17)
    // Particles (COPY VERBATIM from original module 16)
    // shaderParse function (COPY VERBATIM from original module 21)

    // Animation loop (COPY VERBATIM from original _render function)

    return () => {
      // Cleanup: stop loop, dispose renderer, remove DOM element
    }
  }, [])

  // This div sits ON TOP of the R3F canvas, hiding it completely
  return <div ref={containerRef} style={{
    position: 'absolute', inset: 0, zIndex: 10
  }} />
}
```

### Viewport integration

In `Viewport.tsx`, when Spirit is the active custom renderer, it renders its own `<div>` that covers the Canvas. The R3F Canvas still exists underneath but is invisible. This is the ONLY way to make it work because The Spirit needs its own WebGL context with its own settings.

### VERIFICATION CHECKLIST

Before declaring it done, visually confirm ALL of these:

- [ ] Background is uniformly light gray (#dfdfdf) — NO dark areas, NO black, NO gradients
- [ ] Floor is visible as a subtle horizontal plane with the same gray tone
- [ ] Particles cast shadows ON THE FLOOR — visible as darker areas under the particle cloud
- [ ] Fog creates depth — distant particles fade into the gray background
- [ ] Particles are white, not colored
- [ ] The particle cloud follows a smooth Lissajous orbit
- [ ] OrbitControls work — drag to rotate, scroll to zoom
- [ ] The orbit has EASED rotation (rotateEaseRatio: 0.02) — it should feel floaty, not snappy
- [ ] Switching TO another effect hides Spirit and shows the R3F canvas again
- [ ] Switching FROM another effect to Spirit hides the R3F canvas and shows Spirit

**If ANY of these checks fail, DO NOT declare success. Fix it or admit you can't.**

## Original settings.js values (module 19) — COPY EXACTLY

```javascript
exports.useStats = false;
exports.simulatorTextureWidth = 256;
exports.simulatorTextureHeight = 256;
exports.useTriangleParticles = true;
exports.followMouse = true;
exports.dieSpeed = 0.015;
exports.radius = 0.6;
exports.attraction = 1;
exports.shadowDarkness = 0.45;
exports.bgColor = '#dfdfdf';
exports.color1 = '#ffffff';
exports.color2 = '#ffffff';
```

## License

MIT License — Edan Kwan (http://edankwan.com/)
Original source: https://github.com/edankwan/The-Spirit
