# PRTCL

[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0F9D58?style=for-the-badge&logo=google)](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
[![License](https://img.shields.io/badge/License-MIT-7CFF00?style=for-the-badge)](./LICENSE)

GPU-accelerated particle effects you can drop into any website. Pick a preset, twist a few sliders, copy the snippet. Elementor, Webflow, Next.js, React, plain HTML — it doesn't care. Your friends will think you understand 4D stereographic projections. You don't. Neither do I. But the particles don't know that, and they look incredible anyway.

<div align="center">

<img src="docs/assets/prtcl-hero.png" alt="PRTCL editor — Fractal Frequency effect with 20,000 particles" width="800" style="border-radius:8px;" />

</div>

8 built-in presets. Real-time sliders. Smooth morph transitions between effects. Hand tracking via webcam. Adaptive quality so your GPU doesn't cry. Zero accounts, zero backend.

**[prtcl.es](https://prtcl.es)**

---

## Quick Start

```bash
git clone https://github.com/enuzzo/prtcl.git
cd prtcl && npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173). That's it.

```bash
npm run build        # Production build
npm run preview      # Preview build
npx vitest run       # Tests
npx tsc -b           # Type check
```

---

## How It Works

Effects are JS function bodies compiled at runtime via `new Function()`. Each one gets a particle index, a Vector3 target, a Color, elapsed time, and an `addControl()` function for declaring sliders. User code is sandboxed through static analysis, dry runs, and NaN guards before it touches the GPU.

The render loop pre-allocates everything and reads state via Zustand's `getState()` — zero React re-renders at 60fps. Adaptive quality scales between 5k–30k particles automatically.

Hand tracking uses MediaPipe Hands WASM (~4MB, lazy-loaded). Open palm controls camera orbit and zoom. All inputs smoothed. It works better than it has any right to.

---

## Credits

Inspired by [particles.casberry.in](https://particles.casberry.in/) by [CasberryIndia](https://github.com/CasberryIndia). Several presets adapted from community contributions.

| Effect | Credit |
|---|---|
| Hopf Fibration, Black Hole, Cumulonimbus Storm, 4D Clifford Torus | [CasberryIndia](https://github.com/CasberryIndia) |
| Fractal Frequency | Gabi |
| Nebula Organica, Starfield | PRTCL Team |

Built with [React Three Fiber](https://github.com/pmndrs/react-three-fiber), [Tweakpane](https://tweakpane.github.io/docs/), [MediaPipe Hands](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker), and the [vibemilk](https://github.com/enuzzo/vibemilk) acid-pop theme.

---

## License

[MIT](./LICENSE) — © 2026 [Netmilk Studio](https://netmilk.studio). Use it, fork it, embed it in your client's Webflow site and charge them for it.

---

<div align="center">

*Built with too many lerp alpha constants and the unwavering belief that hand tracking*
*20,000 particles in real-time is a perfectly reasonable thing to ship.*

</div>
