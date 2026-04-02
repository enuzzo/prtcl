import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3, Color, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import { createParticleShaderMaterial } from './ShaderMaterial'
import { AdaptiveQuality } from './adaptive-quality'
import { useStore } from '../store'
import type { CompiledEffectFn } from './types'

const MAX_PARTICLES = 30000
const MORPH_DURATION = 2.0 // seconds

// ── Hand disturb constants ─────────────────────────────
const DISTURB_RADIUS = 4.0    // world units — how far the hand "reaches"
const DISTURB_STRENGTH = 1.2  // max displacement per frame at center
const DISTURB_POS_LERP = 0.08 // how fast the 3D hand position tracks the real palm
const DISTURB_FADE_IN = 0.06  // how fast the force ramps up when hand appears
const DISTURB_FADE_OUT = 0.02 // how slowly the force fades when hand disappears
const AUDIO_ZERO = 0

// ── Hand disturb smoothed state (module-level, zero GC) ──
let _disturbX = 0, _disturbY = 0, _disturbZ = 0
let _disturbActive = 0 // 0..1 fade multiplier
let _disturbInitialized = false

/** Sine ease-in-out — the gentlest S-curve, like a breath */
function easeInOutSine(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return -(Math.cos(Math.PI * c) - 1) / 2
}

export function ParticleSystem() {
  const pointsRef = useRef<Points>(null)

  // Reusable objects — never allocate in the loop
  const target = useMemo(() => new Vector3(), [])
  const color = useMemo(() => new Color(), [])

  // Pre-allocate buffers
  const geometry = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3)
    const col = new Float32Array(MAX_PARTICLES * 3)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.setAttribute('customColor', new Float32BufferAttribute(col, 3))
    return geo
  }, [])

  const material = useMemo(() => createParticleShaderMaterial(4.0), [])

  const adaptiveQuality = useMemo(
    () => new AdaptiveQuality(useStore.getState().particleCount),
    [],
  )

  // Morph transition state — all refs, zero React overhead
  const prevFnRef = useRef<CompiledEffectFn | null>(null)
  const transitionStartRef = useRef(-1)
  const fromPositions = useRef<Float32Array | null>(null)
  const fromColors = useRef<Float32Array | null>(null)
  const fromPointSizeRef = useRef(4.0)
  const fromCountRef = useRef(0)

  useFrame((_state, delta) => {
    const store = useStore.getState()
    const { compiledFn, controls, pointSize } = store
    const textPoints = store.textPoints
    const textPts = store.selectedEffect?.category === 'text' ? (textPoints ?? undefined) : undefined

    if (!compiledFn) {
      geometry.setDrawRange(0, 0)
      return
    }

    // Detect effect change → start morph transition
    if (compiledFn !== prevFnRef.current) {
      if (prevFnRef.current !== null) {
        // Snapshot current positions and colors for morphing
        const posAttr = geometry.getAttribute('position') as Float32BufferAttribute
        const colAttr = geometry.getAttribute('customColor') as Float32BufferAttribute
        fromPositions.current = new Float32Array(posAttr.array)
        fromColors.current = new Float32Array(colAttr.array)
        fromPointSizeRef.current = material.uniforms['uPointSize']?.value ?? 4.0
        fromCountRef.current = adaptiveQuality.getParticleCount()
        transitionStartRef.current = _state.clock.elapsedTime
      }
      prevFnRef.current = compiledFn
    }

    // Update adaptive quality base count if settings changed
    adaptiveQuality.setBaseCount(store.particleCount)
    adaptiveQuality.update(delta)
    const count = adaptiveQuality.getParticleCount()

    // Calculate morph progress
    const morphing = transitionStartRef.current >= 0
    let morphT = 1
    if (morphing) {
      const elapsed = _state.clock.elapsedTime - transitionStartRef.current
      morphT = easeInOutSine(Math.min(elapsed / MORPH_DURATION, 1))
      if (morphT >= 1) {
        transitionStartRef.current = -1
        fromPositions.current = null
        fromColors.current = null
      }
    }

    // Point size lerp during morph
    const actualPointSize = morphing
      ? fromPointSizeRef.current + (pointSize - fromPointSizeRef.current) * morphT
      : pointSize
    // Multiply by pixelRatio so particles look the same size on Retina vs standard displays.
    // gl_PointSize is in framebuffer pixels; without this, particles appear 2x bigger on dpr=1.
    if (material.uniforms['uPointSize']) {
      material.uniforms['uPointSize'].value = actualPointSize * _state.gl.getPixelRatio()
    }

    // Build control lookup once per frame (not per particle)
    const controlMap: Record<string, number> = {}
    for (const c of controls) {
      controlMap[c.id] = c.value
    }
    const getControl = (id: string): number => controlMap[id] ?? 0

    // Stub setInfo — only used during dry-run / compilation
    const setInfo = () => {}

    const time = _state.clock.elapsedTime
    const camX = _state.camera.position.x
    const camY = _state.camera.position.y
    const camZ = _state.camera.position.z

    // Unproject pointer to world space (onto z=0 plane through camera target)
    // _state.pointer is R3F's normalized device coords (-1..1), updated automatically
    const pointer = _state.pointer
    const _ptrVec = target // reuse target temporarily
    _ptrVec.set(pointer.x, pointer.y, 0.5).unproject(_state.camera)
    const dir = _ptrVec.sub(_state.camera.position).normalize()
    const dist = -_state.camera.position.z / dir.z
    const pointerX = _state.camera.position.x + dir.x * dist
    const pointerY = _state.camera.position.y + dir.y * dist
    const pointerZ = 0

    // Get the actual backing arrays from the attributes (Three.js v0.183+ copies arrays)
    const posAttr = geometry.getAttribute('position') as Float32BufferAttribute
    const colAttr = geometry.getAttribute('customColor') as Float32BufferAttribute
    const positions = posAttr.array as Float32Array
    const colors = colAttr.array as Float32Array

    // During morph, render max of old and new counts so excess particles can fade out
    const renderCount = morphing
      ? Math.min(Math.max(count, fromCountRef.current), MAX_PARTICLES)
      : count

    const fromPos = fromPositions.current
    const fromCol = fromColors.current
    const fromCount = fromCountRef.current
    const invT = 1 - morphT

    for (let i = 0; i < renderCount; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)

      if (i < count) {
        // Particle within new effect range — compute destination
        try {
          compiledFn(i, count, target, color, time, THREE, getControl, setInfo, textPts, camX, camY, camZ, pointerX, pointerY, pointerZ, AUDIO_ZERO, AUDIO_ZERO, AUDIO_ZERO, AUDIO_ZERO, AUDIO_ZERO)
        } catch {
          // Effect error on this particle — leave at origin
        }
      } else {
        // Disappearing particle — morph to a real particle's position in the new cloud
        // so it merges in naturally instead of collapsing to origin
        try {
          compiledFn(i % count, count, target, color, time, THREE, getControl, setInfo, textPts, camX, camY, camZ, pointerX, pointerY, pointerZ)
        } catch {
          // fallback: stays at origin
        }
      }

      // NaN guard
      const toX = isFinite(target.x) ? target.x : 0
      const toY = isFinite(target.y) ? target.y : 0
      const toZ = isFinite(target.z) ? target.z : 0

      const idx = i * 3

      if (morphing && fromPos && fromCol) {
        // For appearing particles (beyond old count), sample a "from" position
        // from the existing cloud so they emerge naturally, not from origin
        const srcIdx = (i < fromCount ? i : (i % fromCount)) * 3

        positions[idx] = (fromPos[srcIdx] ?? 0) * invT + toX * morphT
        positions[idx + 1] = (fromPos[srcIdx + 1] ?? 0) * invT + toY * morphT
        positions[idx + 2] = (fromPos[srcIdx + 2] ?? 0) * invT + toZ * morphT
        colors[idx] = (fromCol[srcIdx] ?? 0) * invT + color.r * morphT
        colors[idx + 1] = (fromCol[srcIdx + 1] ?? 0) * invT + color.g * morphT
        colors[idx + 2] = (fromCol[srcIdx + 2] ?? 0) * invT + color.b * morphT
      } else {
        positions[idx] = toX
        positions[idx + 1] = toY
        positions[idx + 2] = toZ
        colors[idx] = color.r
        colors[idx + 1] = color.g
        colors[idx + 2] = color.b
      }
    }

    // ── Hand disturb: smoothed repulsion force from palm position ──
    if (store.trackingMode === 'disturb') {
      const handVisible = store.gesture === 'open_palm' && store.palmPosition != null

      if (handVisible) {
        // Map palm 2D → NDC (mirror X for natural screen-space mapping)
        const ndcX = (1 - store.palmPosition!.x) * 2 - 1
        const ndcY = -(store.palmPosition!.y * 2 - 1)

        // Unproject to world space on z=0 plane (same technique as pointer)
        target.set(ndcX, ndcY, 0.5).unproject(_state.camera)
        const ddir = target.sub(_state.camera.position).normalize()
        const ddist = -_state.camera.position.z / ddir.z
        const rawX = _state.camera.position.x + ddir.x * ddist
        const rawY = _state.camera.position.y + ddir.y * ddist
        const rawZ = _state.camera.position.z + ddir.z * ddist

        // Smooth the 3D position — no jitter, organic movement
        if (!_disturbInitialized) {
          _disturbX = rawX; _disturbY = rawY; _disturbZ = rawZ
          _disturbInitialized = true
        } else {
          _disturbX += (rawX - _disturbX) * DISTURB_POS_LERP
          _disturbY += (rawY - _disturbY) * DISTURB_POS_LERP
          _disturbZ += (rawZ - _disturbZ) * DISTURB_POS_LERP
        }

        // Fade in
        _disturbActive += (1 - _disturbActive) * DISTURB_FADE_IN
      } else {
        // Fade out gently
        _disturbActive *= (1 - DISTURB_FADE_OUT)
        if (_disturbActive < 0.001) {
          _disturbActive = 0
          _disturbInitialized = false
        }
      }

      // Apply force if there's any active strength
      if (_disturbActive > 0.001) {
        const effect = store.selectedEffect
        const mode = effect?.disturbMode ?? 'repel'
        const rad = (effect?.disturbRadius ?? DISTURB_RADIUS)
        const str = (effect?.disturbStrength ?? DISTURB_STRENGTH) * _disturbActive

        for (let i = 0; i < renderCount; i++) {
          const idx = i * 3
          const px = positions[idx]!, py = positions[idx + 1]!, pz = positions[idx + 2]!
          const dx = px - _disturbX
          const dy = py - _disturbY
          const dz = pz - _disturbZ
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (d >= rad || d < 0.001) continue

          const t = 1 - d / rad // 0 at edge, 1 at center
          const t3 = t * t * t  // cubic falloff

          if (mode === 'repel') {
            // Push radially outward from hand
            const f = t3 * str / d
            positions[idx] = px + dx * f
            positions[idx + 1] = py + dy * f
            positions[idx + 2] = pz + dz * f

          } else if (mode === 'attract') {
            // Pull radially toward hand
            const f = t3 * str / d
            positions[idx] = px - dx * f * 0.5
            positions[idx + 1] = py - dy * f * 0.5
            positions[idx + 2] = pz - dz * f * 0.5

          } else if (mode === 'swirl') {
            // Tangential force — particles orbit around the hand (Y-up cross product)
            const f = t3 * str
            const invD = 1 / d
            // Cross product of radial direction with up vector [0,1,0]
            const tx = -dz * invD
            const tz = dx * invD
            positions[idx] = px + tx * f
            positions[idx + 1] = py + dy * t3 * str * 0.1 / d // gentle vertical lift
            positions[idx + 2] = pz + tz * f

          } else if (mode === 'scatter') {
            // Chaotic displacement — pseudo-random per particle, coherent per frame
            const seed = i * 73856093
            const rx = ((seed & 0xFFFF) / 32768.0 - 1.0)
            const ry = (((seed >> 8) & 0xFFFF) / 32768.0 - 1.0)
            const rz = (((seed >> 16) & 0xFFFF) / 32768.0 - 1.0)
            const f = t3 * str * 0.6
            positions[idx] = px + rx * f
            positions[idx + 1] = py + ry * f
            positions[idx + 2] = pz + rz * f

          } else if (mode === 'vortex') {
            // Attract + swirl combined — particles spiral inward
            const f = t3 * str
            const invD = 1 / d
            // Tangential (swirl)
            const tx = -dz * invD
            const tz = dx * invD
            // Radial (attract)
            const ax = -dx * invD * 0.3
            const az = -dz * invD * 0.3
            positions[idx] = px + (tx + ax) * f
            positions[idx + 1] = py - dy * f * 0.15 * invD // gentle pull down
            positions[idx + 2] = pz + (tz + az) * f
          }
        }
      }
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, renderCount)

    // Throttled perf updates (store handles throttle internally)
    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(renderCount)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
