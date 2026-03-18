# PRTCL — Ideas for Next Sessions

> Left here by your friendly neighborhood AI after the March 18 night session.
> Some are obvious. Some are unhinged. All are implementable.

---

## 🎙️ Phase 1.11: Audio Reactivity

**The big one.** Effects that react to sound in real-time.

- **Microphone input** — Web Audio API `getUserMedia` + `AnalyserNode`. FFT frequency data drives effect parameters (bass → scale, mids → rotation speed, highs → color shift). Toggle button in TopBar next to hand tracking.
- **System audio / Spotify** — Chrome's `getDisplayMedia` with `audio: true` can capture tab audio. User shares Spotify tab → particles dance to music. No API keys needed.
- **Audio file upload** — drag & drop an MP3/WAV onto the canvas, it plays and drives the effects. Dead simple, maximum impact.
- **Beat detection** — simple onset detection (energy spike in low frequencies). Trigger spasm/flash on every beat. Fibonacci Crystal breathing on the downbeat would be insane.
- **Per-control audio binding** — in Tweakpane, each slider could have a "bind to audio" toggle. Map any frequency band to any parameter. Users build their own audio-visual mappings.

---

## 🔗 Shareable URLs (Deep Links)

Encode the current effect + all slider values in the URL hash. Someone tweaks an effect, copies the URL, sends it — the recipient sees the exact same thing. Zero backend needed.

`prtcl.es/create#effect=fibonacci-crystal&faceting=0.65&breath=1.6&cam=-80,50,20`

This is a 30-minute feature that makes the app 10x more shareable.

---

## 📸 Screenshot / GIF Export

One-click capture of the current viewport:
- **Screenshot** — `canvas.toDataURL()`, download as PNG. Add PRTCL watermark.
- **GIF** — record 3-5 seconds using a web worker + GIF encoder (gif.js). Perfect for social sharing.
- **Video** — `MediaRecorder` API on the canvas stream. Export as WebM/MP4.

The "Share" button becomes: Export Code | Screenshot | Record GIF

---

## 🎨 Background Color Picker

The `backgroundColor` is already in the store but there's no UI to change it. Add a color picker in the Global section of Tweakpane. Dark backgrounds for glowy effects, white for silhouette looks, custom brand colors for embedding.

---

## ⌨️ Keyboard Shortcuts

The store-based panel architecture makes this trivial:
- `[` / `]` — toggle left/right panels
- `F` — fullscreen
- `←` / `→` — previous/next effect
- `R` — reset all sliders to defaults
- `Space` — pause/resume animation
- `S` — screenshot

---

## 🔄 Effect Transitions: Crossfade Options

Currently morphs are always 2s easeInOutSine. What if the user could choose:
- **Morph** (current) — particles lerp between positions
- **Explode → Reform** — particles fly outward, then converge into new shape
- **Dissolve** — old particles fade out, new ones fade in (alpha, not position)
- **Instant** — no transition, hard cut

A dropdown in the Global section. Each transition type is ~20 lines of code in ParticleSystem.

---

## 🌐 Embed Preview

Before the full export system (Phase 2), a quick "Embed this" button that generates a `<iframe>` snippet pointing to `prtcl.es/embed#effect=...&params=...`. The embed route renders just the canvas — no UI, no panels. Instant website integration.

---

*— Claude, 2:30 AM, March 18, 2026*
*"I left you ideas instead of bugs. You're welcome."*
