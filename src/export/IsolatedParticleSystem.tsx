import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VERTEX_SHADER, FRAGMENT_SHADER } from './templates/shader-strings'
import type { CompiledEffectFn } from '../engine/types'

interface Props {
  compiledFn: CompiledEffectFn
  controls: Record<string, number>
  particleCount: number
  pointSize: number
  textPoints?: Float32Array | null
}

export function IsolatedParticleSystem({ compiledFn, controls, particleCount, pointSize, textPoints }: Props) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const { geometry, material } = useMemo(() => {
    const count = Math.min(particleCount, 20000)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3))
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3))
    const material = new THREE.ShaderMaterial({
      uniforms: { uPointSize: { value: pointSize } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry, material }
  }, [particleCount, pointSize])

  useFrame(({ clock, camera, gl }) => {
    const time = clock.getElapsedTime()
    const count = Math.min(particleCount, 20000)
    const addControl = (id: string) => controls[id] ?? 0

    // Three.js v0.183+ copies arrays in BufferAttribute — must read the actual backing arrays
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colAttr = geometry.getAttribute('customColor') as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array
    const col = colAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      try {
        compiledFn(
          i, count, target, color, time, THREE, addControl, () => {},
          textPoints ?? undefined,
          camera.position.x, camera.position.y, camera.position.z,
          0, 0, 0,
          0, 0, 0, 0, 0,
        )
      } catch { /* skip erroring particles */ }
      if (!isFinite(target.x)) target.set(0, 0, 0)
      const idx = i * 3
      pos[idx] = target.x; pos[idx + 1] = target.y; pos[idx + 2] = target.z
      col[idx] = color.r; col[idx + 1] = color.g; col[idx + 2] = color.b
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geometry.setDrawRange(0, count)
    // Scale point size relative to canvas height so the preview (260px) looks
    // proportionally the same as the main editor (~800px) or the actual export.
    const canvasHeight = gl.domElement.clientHeight
    const viewportScale = canvasHeight / 800
    material.uniforms['uPointSize']!.value = pointSize * gl.getPixelRatio() * viewportScale
  })

  return <points geometry={geometry} material={material} />
}
