# Creature Effects — Design Spec

**Date**: 2026-03-19
**Status**: Approved
**Scope**: 3 new particle effects + new "creature" category

## Overview

Three new effects inspired by an inverse kinematics tentacle reference — biological creatures made entirely of particles. Each effect simulates IK arm chains using per-particle math: the particle index `i` maps to an arm and joint position, forming organic tentacle structures rendered through the standard particle system (additive blending, point sprites).

No engine, compiler, shader, or renderer changes required.

## New Category: `creature`

Add `'creature'` to the `Effect['category']` type union in `src/engine/types.ts`. Display order in EffectBrowser and MobileEffectDropdown: organic, math, **creature**, text, abstract.

## Shared IK Architecture

All three effects share a core pattern:

1. **Arm/joint mapping**: `armIndex = floor(i / jointsPerArm)`, `jointIndex = i % jointsPerArm`. Arm and joint counts are tuned so that `arms × jointsPerArm ≈ particleCount` — all allocated particles are used. Any excess particles (due to rounding) are positioned at `(99999, 99999, 99999)` with black color to clip off-screen.
2. **Chain computation**: Each particle independently recomputes the chain from root up to its own joint index. Particle `i` at `jointIndex = 3` computes joints 0, 1, 2, 3 sequentially. This is O(jointIndex) per particle, not O(1). With high joint counts (300+), the last particles do significant work per frame — validated at target counts on desktop hardware.
3. **Center motion**: A Lissajous curve in 3D drives the organism's center point (except Anemone, which is stationary).
4. **Visual cohesion**: Particles are spaced closely along each arm. Additive blending creates natural glow "tentacles" without needing line primitives.
5. **Deterministic randomness**: Per-arm variation (length, phase, color offset) via `sin(armIndex * 127.1 + 311.7)` hash pattern.
6. **Audio integration**: All effects respond to `bass`, `mids`, `highs`, `energy`, `beat` when mic is active. All bands default to 0 — no conditionals needed.

## Effect 1: Medusa (Jellyfish)

### Shape
- Hemispherical bell (top) + long trailing tentacles (bottom)
- ~50 arms, ~300 joints each (50 × 300 = 15,000 — full particle utilization)
- Bell formed by shorter arms curving outward/upward; tentacles are longer arms hanging down

### Motion
- Center drifts with slow vertical sinusoid (gentle rise/fall)
- Bell contracts/expands with rhythmic pulse (heartbeat effect)
- Tentacles sway with phase-offset sine waves per joint — "ocean current" feel
- Overall movement: graceful, slow, hypnotic

### Colors
- Bioluminescent gradient: cyan → purple along each arm (hue 0.5 → 0.75)
- Lightness modulated by radial position and pulse phase
- Glow intensifies during bell contraction

### Controls
| id | label | min | max | default | purpose |
|----|-------|-----|-----|---------|---------|
| `pulse` | Pulse | 0.1 | 3.0 | 0.8 | Heartbeat frequency |
| `tentLen` | Tentacle Length | 0.3 | 2.0 | 1.0 | Arm length multiplier |
| `flow` | Flow | 0.0 | 3.0 | 1.2 | Sway intensity |
| `colorShift` | Color Shift | 0.0 | 1.0 | 0.0 | Hue offset |

### Audio Mapping
- `beat` → bell contraction spike
- `bass` → tentacle elongation
- `highs` → tip vibration amplitude

### Baseline Settings
- particleCount: 15000
- pointSize: 1.2
- autoRotateSpeed: 0.3
- Camera: slightly below, looking up into the bell

## Effect 2: Kraken

### Shape
- Dense nucleus + short muscular arms that coil into spirals
- ~60 arms, ~300 joints each (60 × 300 = 18,000 — full particle utilization)
- Thicker appearance (larger point size near roots), compact, powerful silhouette

### Motion
- Center orbits aggressively (fast 3D Lissajous with irrational frequency ratios)
- Arms coil/uncoil with dynamic spirals — tighter coils at tips
- Snappy, aggressive movement with occasional "whip crack" extensions
- Chaotic but controlled — predatory feel

### Colors
- Warm/aggressive palette: red → orange → magenta (hue 0.95 → 0.12 wrap-around)
- High saturation, brightness modulated by arm velocity
- Three color modes via dropdown:
  - **Lava**: red/orange/yellow
  - **Venom**: green/purple/black
  - **Abyss**: deep blue/cyan/white

### Controls
| id | label | min | max | default | purpose |
|----|-------|-----|-----|---------|---------|
| `aggression` | Aggression | 0.1 | 3.0 | 1.0 | Speed/chaos of movement |
| `coil` | Coil | 0.0 | 2.0 | 1.0 | Spiral tightness |
| `arms` | Arms | 6 | 30 | 18 | Number of arms (step: 1) |
| `krakenColor` | Color Mode | — | — | 0 | Dropdown: Lava/Venom/Abyss |

### Audio Mapping
- `bass` → arm contraction (coil tighter)
- `energy` → global turbulence increase
- `beat` → whip snap (random arm extends rapidly)

### Baseline Settings
- particleCount: 18000
- pointSize: 0.8
- autoRotateSpeed: 0.8
- Camera: frontal, medium distance

## Effect 3: Anemone (Sea Anemone)

### Shape
- Fixed base (no center orbit) — rooted to a point
- Many thin, tall arms reaching upward like a sea anemone
- ~80 arms, ~250 joints each (80 × 250 = 20,000 — full particle utilization)
- Dense forest of gently swaying filaments

### Motion
- Slowest of the three — meditative, ambient
- Each arm sways independently with sine waves at different frequencies per arm
- Tips curl gently — more movement at top, nearly still at base
- Global breathing rhythm (slow scale oscillation)

### Colors
- Palette selectable via dropdown:
  - **Reef**: warm coral/turquoise/gold
  - **Neon**: electric pink/green/blue (acid-pop)
  - **Deep Sea**: dark blue/bioluminescent accents
  - **Blossom**: soft pink/white/lavender
- Gradient along each arm with slight inter-arm hue variation

### Controls
| id | label | min | max | default | purpose |
|----|-------|-----|-----|---------|---------|
| `density` | Density | 10 | 50 | 30 | Number of arms (step: 1) |
| `sway` | Sway | 0.0 | 3.0 | 1.0 | Oscillation amplitude |
| `current` | Current Speed | 0.0 | 2.0 | 0.5 | Wave propagation speed |
| `anemonePalette` | Palette | — | — | 0 | Dropdown: Reef/Neon/Deep Sea/Blossom |

### Audio Mapping
- `highs` → tip vibration
- `mids` → waves traveling from base to tip
- `bass` → global breathing amplitude

### Baseline Settings
- particleCount: 20000
- pointSize: 0.6
- autoRotateSpeed: 0.2
- Camera: slightly above, medium zoom

## File Structure

### New Files
- `src/effects/presets/medusa.ts`
- `src/effects/presets/kraken.ts`
- `src/effects/presets/anemone.ts`

### Modified Files
- `src/engine/types.ts` — add `'creature'` to category union
- `src/effects/presets/index.ts` — import and register in `ALL_PRESETS`
- `src/editor/EffectBrowser.tsx` — add `'creature'` to category order
- `src/editor/MobileEffectDropdown.tsx` — add `'creature'` to category order
- `src/editor/ControlPanel.tsx` — add `krakenColor` and `anemonePalette` to `DROPDOWN_CONTROLS` map
- `CLAUDE.md` — document new category and presets

## Implementation Notes

### Effect Interface Fields
Each preset file must provide all required `Effect` fields: `id`, `slug`, `name`, `description`, `author`, `category`, `tags`, `particleCount`, `pointSize`, `cameraDistance`, `autoRotateSpeed`, `createdAt`, `controls`, and `code`. Optional: `cameraPosition`, `cameraTarget`, `cameraZoom`.

Precise camera coordinates and control defaults will be determined during implementation via the Copy Params tuning workflow. The baseline settings above are starting points.

Each effect's code body must call `setInfo(name, description)` at `i === 0` per existing convention.

## Export Compatibility

All three effects use the standard particle renderer (`renderer: 'particles'`, default). Export works out-of-the-box for all three modes (Website Embed, React Component, iframe). No special handling needed.

## GLaDOS Descriptions

Each effect needs a sarcastic/witty description in the GLaDOS tone established by existing presets:

- **Medusa**: *"A translucent bell of light drifting through the void, trailing filaments that serve no biological purpose whatsoever. It's beautiful and completely pointless — like most of the ocean."*
- **Kraken**: *"Eighteen arms of pure aggression, coiling and striking at nothing. It has the temperament of a cornered octopus and the attention span of a caffeinated squirrel."*
- **Anemone**: *"Thirty tendrils swaying in a current that doesn't exist. It sits there. That's it. That's the whole effect. And yet you'll watch it for ten minutes."*

## Prerequisites (already applied)

These changes were made prior to this spec and are committed separately:

- **Point Size Cap**: Global slider max raised from 2.5 → 8.0 (`ControlPanel.tsx`, `ExportSettings.tsx`)
- **Clifford Torus Retuning**: Updated defaults (pointSize 8, scale 29.516, new camera position, recalibrated controls)
