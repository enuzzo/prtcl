import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3, Color, BufferGeometry, Float32BufferAttribute, Points } from 'three'
import { createParticleShaderMaterial } from './ShaderMaterial'
import { AdaptiveQuality } from './adaptive-quality'
import { useStore } from '../store'

const MAX_PARTICLES = 30000

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

  useFrame((_state, delta) => {
    const store = useStore.getState()
    const { compiledFn, controls, pointSize } = store

    if (!compiledFn) {
      geometry.setDrawRange(0, 0)
      return
    }

    // Update adaptive quality base count if settings changed
    adaptiveQuality.setBaseCount(store.particleCount)
    adaptiveQuality.update(delta)
    const count = adaptiveQuality.getParticleCount()

    // Update point size uniform
    if (material.uniforms['uPointSize']) {
      material.uniforms['uPointSize'].value = pointSize
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

    // Get the actual backing arrays from the attributes (Three.js v0.183+ copies arrays)
    const posAttr = geometry.getAttribute('position') as Float32BufferAttribute
    const colAttr = geometry.getAttribute('customColor') as Float32BufferAttribute
    const positions = posAttr.array as Float32Array
    const colors = colAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)

      try {
        compiledFn(i, count, target, color, time, THREE, getControl, setInfo, undefined)
      } catch {
        // Effect error on this particle — leave at origin
      }

      // NaN guard
      const x = isFinite(target.x) ? target.x : 0
      const y = isFinite(target.y) ? target.y : 0
      const z = isFinite(target.z) ? target.z : 0

      const idx = i * 3
      positions[idx] = x
      positions[idx + 1] = y
      positions[idx + 2] = z

      colors[idx] = color.r
      colors[idx + 1] = color.g
      colors[idx + 2] = color.b
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, count)

    // Throttled perf updates (store handles throttle internally)
    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(count)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
