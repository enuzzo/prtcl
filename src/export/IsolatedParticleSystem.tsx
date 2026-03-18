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
}

export function IsolatedParticleSystem({ compiledFn, controls, particleCount, pointSize }: Props) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const { geometry, material, positions, colors } = useMemo(() => {
    const count = Math.min(particleCount, 20000)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: { uPointSize: { value: pointSize } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry, material, positions, colors }
  }, [particleCount, pointSize])

  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime()
    const count = Math.min(particleCount, 20000)
    const addControl = (id: string) => controls[id] ?? 0

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      try {
        compiledFn(
          i, count, target, color, time, THREE, addControl, () => {},
          undefined,
          camera.position.x, camera.position.y, camera.position.z,
          0, 0, 0,
          0, 0, 0, 0, 0,
        )
      } catch { /* skip erroring particles */ }
      if (!isFinite(target.x)) target.set(0, 0, 0)
      const idx = i * 3
      positions[idx] = target.x; positions[idx + 1] = target.y; positions[idx + 2] = target.z
      colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b
    }

    geometry.attributes['position']!.needsUpdate = true
    geometry.attributes['customColor']!.needsUpdate = true
    geometry.setDrawRange(0, count)
    material.uniforms['uPointSize']!.value = pointSize
  })

  return <points geometry={geometry} material={material} />
}
