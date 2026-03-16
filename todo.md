# PRTCL — Remaining Work

## Phase 1: Core Engine (Current — nearly complete)

### Bug Fixes
- [x] Bug 2: Slider crash — ControlPanel useEffect rebuilt Tweakpane on every value change. Fixed: depend on `controlSchema` string instead of `controls` array reference.
- [ ] Bug 1: No particles visible on first load — likely resolved by Bug 2 fix. Needs manual QA in browser (`npm run dev` → open `/create`). If still broken, check: CSS canvas sizing, initial effect auto-select, `setDrawRange` logic, compiled function return values.

### Polish
- [ ] Code-split Three.js bundle (currently 1.3MB gzip 354KB — warning in build). Use `manualChunks` or dynamic import for R3F.
- [ ] Mobile responsive: collapse three-panel layout to tabs on small screens.
- [ ] Add loading state/spinner while first effect compiles.

---

## Phase 2: Export System

- [ ] Export modal UI (shadcn dialog)
- [ ] Full HTML export — standalone page with Three.js from CDN, orbit controls
- [ ] Embed Snippet export — transparent, no UI, `pointer-events: none`, fills parent container (the Elementor/Webflow use case)
- [ ] Code export — just the effect function body
- [ ] JSON Preset export — full `Effect` definition, re-importable into PRTCL
- [ ] All exports include `/* Made with PRTCL — prtcl.es */`
- [ ] Target < 15KB minified per snippet (before CDN import)
- [ ] Pin Three.js exports to v0.170.0 CDN URL

---

## Phase 3: Text-to-Particles

- [ ] Offscreen canvas text renderer
- [ ] Threshold + Poisson disk sampling → Float32Array of glyph positions
- [ ] Google Fonts dynamic loader (only when text feature active)
- [ ] 3 text effect presets (Text Dissolve, Text Wave, Text Morph)
- [ ] Text controls in right panel (font picker, size, text input)

---

## Phase 4: Polish & Launch Prep

- [ ] Landing page (static HTML, SEO-optimized, Vercel)
  - Messaging: free for Elementor, MIT, copy-paste, instant
  - Hero animation with live particle effect
  - SEO meta tags, Open Graph, structured data
- [ ] Gallery page (`/gallery`) — curated JSON presets in `public/gallery/`
- [ ] Fork system — duplicate and customize any preset
- [ ] Preset search/filter in sidebar
- [ ] Performance pass: 20k particles @ 60fps desktop, 5-8k @ 60fps mobile
- [ ] Adaptive quality tuning (current: reduces at >20ms delta, recovers after 60 good frames)

---

## Phase 5: Deploy

- [ ] Vercel deployment config
- [ ] Domain `prtcl.es` setup
- [ ] GitHub repo public (`enuzzo/prtcl`)
- [ ] README.md with screenshots, quick start, contribution guide
- [ ] MIT LICENSE file

---

## Ideas / Backlog

- [ ] More presets: Fire, Rain, Snow, DNA Helix, Fireworks, Wormhole
- [ ] Color palette presets (not just per-effect)
- [ ] Undo/redo for control changes
- [ ] Keyboard shortcuts (space=pause, r=reset, e=export)
- [ ] Fullscreen preview mode
- [ ] Non-particle Three.js effects (post-processing, mesh effects, instanced geometry)
- [ ] Embed preview in export modal (live iframe)
- [ ] Analytics (privacy-respecting, optional)
