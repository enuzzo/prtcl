# PRTCL

[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0F9D58?style=for-the-badge&logo=google)](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
[![License](https://img.shields.io/badge/License-MIT-7CFF00?style=for-the-badge)](./LICENSE)

GPU-accelerated particle effects you can drop into any website. Pick a preset, twist a few sliders, copy the snippet. Elementor, Webflow, Next.js, React, plain HTML — it doesn't care. Your friends will think you understand 4D stereographic projections. You don't. Neither do I. But the particles don't know that, and they look incredible anyway.

<div align="center">

<img src="docs/assets/prtcl-hero.png" alt="PRTCL editor — Fractal Frequency effect with 20,000 particles" width="800" style="border-radius:8px;" />

<br />

<sub>Fractal Frequency at 20k particles. The sliders are optional. The jaw-dropping part isn't.</sub>
</div>

**PRTCL** is a free, open-source particle effects editor that runs entirely in the browser. 8 built-in presets — from Hopf fibrations to 4D Clifford tori — each with real-time sliders and smooth morph transitions between them. Zero accounts, zero backend, zero npm install on the consumer side.

Hand tracking via webcam. Adaptive quality that silently drops particles before your GPU cries. An export button that gives you a self-contained snippet you can paste anywhere.

**[prtcl.es](https://prtcl.es)**

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Architecture](#architecture)
- [Effects](#effects)
- [Hand Tracking](#hand-tracking)
- [The Splash Screen](#the-splash-screen)
- [Quick Start](#quick-start)
- [Controls](#controls)
- [Notes](#notes)
- [Credits & Acknowledgments](#credits--acknowledgments)
- [License](#license)

---

## Why This Exists

Every creative project starts the same way: *"I just want some particles in the background."*

Then you Google "particle effects javascript" and get 47 results that look like a screensaver from 2003. So you reach for Three.js, write a custom shader, discover that BufferGeometry attribute updates need `needsUpdate = true`, spend a week tuning easing functions, and eventually arrive at something that looks decent but lives in a repo nobody else can use without reading your code.

At some point you think: what if there was a tool where you just pick an effect, adjust the sliders, and copy-paste the result? What if it ran at 60fps with 20,000 particles and didn't require a PhD in WebGL? What if you could control the camera *by waving your hand* instead of dragging a mouse like it's 2004?

That's PRTCL.

---

## Architecture

```
src/
├── engine/                 The core. Zero allocations. Zero apologies.
│   ├── ParticleSystem.tsx   BufferGeometry + useFrame hot loop
│   ├── compiler.ts          4-stage sandboxed compilation pipeline
│   ├── validator.ts         Security boundary — 20 forbidden patterns
│   ├── adaptive-quality.ts  Auto-scales particle count to maintain 60fps
│   ├── camera-bridge.ts     Module-level refs for cross-component camera access
│   └── ShaderMaterial.ts    Additive blending, soft point sprites
├── editor/                 Three-panel UI: browse, view, tweak
├── effects/presets/        The good stuff
├── tracking/               Hand tracking: gesture → camera controller
├── components/             Splash screen (1,200 particles forming text)
└── store.ts                Zustand — flat, granular, getState() in the loop
```

Effects are JavaScript function bodies stored as strings and compiled at runtime via `new Function()`. Each effect receives the particle index, a target Vector3, a Color, elapsed time, the THREE library, and an `addControl()` function for declaring sliders.

Before any user code touches the GPU, it passes through a 4-stage security pipeline:

1. **Static analysis** — regex scan for 20 forbidden patterns (`document`, `window`, `fetch`, `eval`, `Function`, `globalThis`...)
2. **Compilation** — `new Function()` with a strict argument list
3. **Dry run** — execute with i=0..99 to catch runtime errors and collect controls
4. **NaN guard** — fallback to origin if output is NaN/Infinity

The renderer pre-allocates all buffers, reuses Vector3/Color objects, builds the control map once per frame, and reads the store via `getState()` — zero React re-renders in the hot loop. The adaptive quality system watches frame deltas and silently scales particle count between 5,000 and 30,000 to maintain 60fps. You'll never notice it working. That's the point.

---

## Effects

Eight built-in presets, each with tunable parameters:

| Preset | Category | What It Does |
|---|---|---|
| **Fractal Frequency** | Math | Pulsing 3D harmonic structure. Sound waves meet fractal oscillations. The default, and the one people screenshot. |
| **Hopf Fibration** | Math | Stereographic projection of a 4D hypersphere. Interlocking tori from S3 fibers. Yes, it's exactly as wild as it sounds. |
| **Spiral Galaxy** | Math | Logarithmic spiral arms, dust lanes, central bulge. Billions of years of physics in 16ms per frame. |
| **4D Clifford Torus** | Math | A torus living natively in 4D, rotating through six orthogonal planes and projected into 3D. Brightness, hue, and W-distance sliders. |
| **Nebula Organica** | Organic | Volumetric gas cloud with breathing animation and turbulent motion. Calm until you crank the amplitude. |
| **Cumulonimbus Storm** | Organic | Ocean, rain, lightning bolts, and volumetric storm clouds. All particles. No textures. No regrets. |
| **Starfield** | Abstract | Warp-speed stars streaking through space. Simple premise, mesmerizing result. |
| **Black Hole** | Abstract | Accretion disk, gravitational lensing, relativistic jets. 25,000 particles pretending to be a supermassive singularity. |

Every parameter is live — move a slider, see the result. Switching between effects triggers a smooth 2-second morph: particles glide from one shape to the next while the camera tracks along. No submit buttons, no preview delays. Export is max two clicks.

---

## Hand Tracking

Toggle the hand icon in the top bar. PRTCL loads MediaPipe Hands WASM (~4MB, lazy-loaded — zero impact on initial page load) and opens your webcam. The thumbnail in the corner shows a mirrored feed with a green skeleton overlay. Like a mirror, not like a security camera.

**One gesture. All control.** Show an open palm and the camera responds:

| Input | Effect |
|---|---|
| Palm moves left/right | Camera orbits horizontally |
| Palm moves up/down | Camera orbits vertically |
| Hand closer to monitor | Shape pushes away (zoom out) |
| Hand farther from monitor | Shape pulls closer (zoom in) |

The push/pull zoom is deliberate — it mimics physically pushing or pulling an object through the screen. Move your hand toward the monitor and the shape retreats. Pull back and it comes to you.

All inputs are smoothed via exponential lerp to prevent jerks when tracking flickers. A dead zone in the center prevents drift when your hand is still. If your hand leaves the frame, the camera holds position for 5 seconds — enough time to scratch your nose — then smoothly returns home.

The gesture classifier requires 3 of 4 fingers extended, deliberately excluding the thumb because its detection is unreliable across camera angles. Achieving this reliability took longer than writing the camera controller itself. Worth it.

---

## The Splash Screen

Every page load starts with 1,200 particles morphing through three text phases:

```
scattered dots → "PRTCL" → "PRTCL.ES" → "PARTICLES" → explode
```

The explosion sends particles flying past the screen edges while the PRTCL editor crossfades in underneath. Total runtime: ~5 seconds. Text sampling uses offscreen canvas → `getImageData()` → X-sorted spatial coherence, so particles on the "P" in PRTCL naturally map to the "P" in PARTICLES.

Is it skippable? No. Is it vibe coded? Yes. Is it random? Absolutely not.

---

## Quick Start

**Prerequisites:** Node.js 18+, npm.

```bash
# Clone and install
git clone https://github.com/enuzzo/prtcl.git
cd prtcl
npm install

# Development server (port 5173)
npm run dev
```

Open [localhost:5173](http://localhost:5173). The splash screen plays. Then you're in.

```bash
# Other commands
npm run build        # Production build to dist/
npm run preview      # Preview production build
npx vitest run       # Run tests (29 pass, 1 has opinions)
npx tsc -b           # Type check (strict mode, no mercy)
```

---

## Controls

### Global

| Parameter | Range | What It Does |
|---|---|---|
| Particles | 1,000 – 30,000 | More particles = more detail = more GPU. The adaptive quality system will quietly override you if your hardware disagrees. |
| Point Size | 0.5 – 25 | Particle radius. Larger = softer, more nebula-like. Smaller = sharper, more digital. |

### Camera

| Parameter | Range | What It Does |
|---|---|---|
| Auto Rotate | -10 to 10 | Continuous orbit speed. Negative = counter-clockwise. Zero = manual only. |
| Zoom | 0.2 – 10 | Camera distance relative to preset default. Or just use your hand. |

### Effect

Each preset declares its own sliders via `addControl()`. Frequency, amplitude, pulse speed, fractal depth, color speed — whatever the effect needs. The Tweakpane panel rebuilds automatically when you switch presets.

### Tools

**Copy Params** exports a JSON snapshot of every slider value plus camera position and orientation. Paste it into a preset file to save your tuning. This is how every built-in preset was calibrated — no magic, just obsessive tweaking and a clipboard.

---

## Notes

**Effect code is sandboxed.** The compiler scans for 20 forbidden patterns before compilation. Then it dry-runs the code on 100 particles. Then it NaN-guards every output. User code never touches the DOM. The validator is a security boundary — it must remain strict.

**The render loop allocates zero memory.** All Vector3, Color, and Spherical objects are pre-allocated at module level. The control map is built once per frame, not per particle. React never re-renders during animation — everything reads from `getState()`.

**Three.js is pinned to v0.170.0 for CDN exports.** When the export system ships, snippets will load Three.js from a CDN. Pinning ensures exported effects don't break when Three.js pushes a new version with breaking changes (which they do, regularly, with the confidence of someone who has never had to maintain a production CDN link).

**The hand tracking camera controller runs after OrbitControls.** `HandCameraSync` is rendered as a sibling component after `CameraSync` in the R3F tree. This means its `useFrame` callback registers later, so camera modifications stick after OrbitControls' `update()` has already run. Getting this right involved discovering that `useFrame` priority 1 disables auto-rendering entirely. It's fine. We're fine. Deep breaths.

---

## Credits & Acknowledgments

PRTCL was inspired by [particles.casberry.in](https://particles.casberry.in/) by [CasberryIndia](https://github.com/CasberryIndia) — a WebGL particle simulation platform for creative computational artists. Some effect presets were adapted from community contributions, refined and extended for the PRTCL engine.

We've done our best to credit every original author. If you created one of these effects — or know who did — open an issue or email us and we'll happily add your name.

### Effect credits

| Effect | Original credit | Notes |
|---|---|---|
| Hopf Fibration | [CasberryIndia](https://github.com/CasberryIndia) | Stereographic projection of a 4D hypersphere |
| Black Hole | [CasberryIndia](https://github.com/CasberryIndia) | Gargantua-style accretion disk simulation |
| Cumulonimbus Storm | [CasberryIndia](https://github.com/CasberryIndia) | Full storm system with ocean, rain, lightning |
| Fractal Frequency | Gabi | Harmonic structure with fractal wave layering |
| Nebula Organica | PRTCL Team | Original preset |
| Starfield | PRTCL Team | Original preset |
| Spiral Galaxy | PRTCL Team | Logarithmic spiral arms |
| 4D Clifford Torus | [CasberryIndia](https://github.com/CasberryIndia) | Stereographic projection from 4D with six rotation planes |

### Tech

- [MediaPipe Hands](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) — 21 landmarks at 30fps in a WASM bundle. The future of input is your actual hands.
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) — React's reconciler applied to Three.js. Sounds cursed. Works brilliantly.
- [Tweakpane](https://tweakpane.github.io/docs/) — The control panel that creative coders deserve.
- [vibemilk](https://github.com/enuzzo/vibemilk) acid-pop theme — the design system that gave PRTCL its palette and its personality.
- [Inconsolata](https://github.com/googlefonts/Inconsolata) by Raph Levien, patched with [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts).

---

## License

[MIT](./LICENSE) — © 2026 [Netmilk Studio](https://netmilk.studio). Use it, fork it, embed it in your client's Webflow site and charge them for it.
Just keep the copyright notice. No warranty. No hard feelings.

---

<div align="center">

*Built with React Three Fiber, too many lerp alpha constants, and the unwavering belief*
*that hand tracking a webcam feed to control 20,000 particles in real-time*
*is a perfectly reasonable thing to ship in a v1.*

</div>
