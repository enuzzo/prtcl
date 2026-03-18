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
    const { compiledFn, controls, pointSize, bassBand, midsBand, highsBand, energy, beat } = store

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
    if (material.uniforms['uPointSize']) {
      material.uniforms['uPointSize'].value = actualPointSize
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
          compiledFn(i, count, target, color, time, THREE, getControl, setInfo, undefined, camX, camY, camZ, pointerX, pointerY, pointerZ, bassBand, midsBand, highsBand, energy, beat)
        } catch {
          // Effect error on this particle — leave at origin
        }
      } else {
        // Disappearing particle — morph to a real particle's position in the new cloud
        // so it merges in naturally instead of collapsing to origin
        try {
          compiledFn(i % count, count, target, color, time, THREE, getControl, setInfo, undefined, camX, camY, camZ, pointerX, pointerY, pointerZ)
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

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, renderCount)

    // Throttled perf updates (store handles throttle internally)
    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(renderCount)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
