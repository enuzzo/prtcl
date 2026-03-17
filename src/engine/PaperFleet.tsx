import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Paper Fleet — instanced arrow geometry orbiting a gravitational center.
 * Based on Martin Schuhfuss's instanced geometry demo.
 * Each arrow has persistent velocity and is attracted toward the origin.
 *
 * This is a "custom renderer" — it replaces the standard ParticleSystem
 * when the selected effect has renderer: 'custom'.
 */

const ARROW_FORWARD = new THREE.Vector3(0, 0, 1)
const UP = new THREE.Vector3(0, 1, 0)
const _v3 = new THREE.Vector3()

/** Simple random with range and power bias */
function rnd(min = 1, max = 0, pow = 1): number {
  if (max === 0 && min !== 0) { max = min; min = 0 }
  const r = pow === 1 ? Math.random() : Math.pow(Math.random(), pow)
  return (max - min) * r + min
}

/** Color schemes — each defines HSL ranges for arrow colors */
const COLOR_SCHEMES = [
  // 0: PRTCL Acid Pop — magenta + lime on black
  { name: 'PRTCL', fn: (_i: number) => {
    const c = new THREE.Color()
    const pick = Math.random()
    if (pick < 0.4) c.setHSL(0.89, 0.9, rnd(0.4, 0.7, 1))       // magenta/pink
    else if (pick < 0.7) c.setHSL(0.25, 1.0, rnd(0.3, 0.6, 1))   // lime/green
    else c.setHSL(rnd(0.85, 0.95), 0.7, rnd(0.3, 0.5, 1))        // purple accent
    return c
  }},
  // 1: Original — warm pastels (the classic from the demo)
  { name: 'Classic', fn: (_i: number) => {
    const c = new THREE.Color()
    c.setHSL(rnd(0, 0.65, 0.2), 0.3, rnd(0.3, 0.7, 2))
    return c
  }},
  // 2: Ocean — deep blues and teals
  { name: 'Ocean', fn: (_i: number) => {
    const c = new THREE.Color()
    c.setHSL(rnd(0.5, 0.65), rnd(0.4, 0.8), rnd(0.2, 0.6, 1.5))
    return c
  }},
  // 3: Sunset — oranges, reds, golds
  { name: 'Ember', fn: (_i: number) => {
    const c = new THREE.Color()
    c.setHSL(rnd(0.0, 0.12), rnd(0.7, 1.0), rnd(0.3, 0.6, 1.5))
    return c
  }},
  // 4: Monochrome — white/silver with subtle variation
  { name: 'Ghost', fn: (_i: number) => {
    const c = new THREE.Color()
    const v = rnd(0.3, 0.9, 2)
    c.setRGB(v, v * 0.97, v * 1.03)
    return c
  }},
]

/** Create the arrow (paper plane) geometry */
function createArrowGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape(
    [[-0.8, -1], [-0.03, 1], [-0.01, 1.017], [0.0, 1.0185],
     [0.01, 1.017], [0.03, 1], [0.8, -1], [0, -0.5]]
      .map(p => new THREE.Vector2(p[0], p[1]))
  )

  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    bevelSegments: 2,
  })

  const matrix = new THREE.Matrix4()
    .makeRotationX(Math.PI / 2)
    .setPosition(new THREE.Vector3(0, 0.15, 0))
  extruded.applyMatrix4(matrix)

  return extruded
}

/** Arrow state (persistent across frames) */
interface ArrowState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Quaternion
  color: THREE.Color
}

export function PaperFleet() {
  const numInstances = useStore((s) => s.particleCount)
  const count = Math.min(numInstances, 10000)

  const baseGeometry = useMemo(() => createArrowGeometry(), [])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const arrowsRef = useRef<ArrowState[] | null>(null)
  const prevCountRef = useRef(0)
  const prevSchemeRef = useRef(-1)

  const material = useMemo(() => new THREE.MeshLambertMaterial({
    vertexColors: false,
    side: THREE.DoubleSide,
  }), [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    const dt = Math.min(delta, 0.1)
    const store = useStore.getState()

    // Read color scheme from controls (set by effect code's addControl)
    const controls = store.controls
    const schemeControl = controls.find(c => c.id === 'colorScheme')
    const schemeIdx = schemeControl ? Math.round(schemeControl.value) : 0
    const scheme = COLOR_SCHEMES[schemeIdx % COLOR_SCHEMES.length]!

    // Initialize or resize arrows array
    const needsReinit = !arrowsRef.current || prevCountRef.current !== count
    const needsRecolor = schemeIdx !== prevSchemeRef.current

    if (needsReinit) {
      const arrows: ArrowState[] = []
      const existing = arrowsRef.current || []

      for (let i = 0; i < count; i++) {
        if (i < existing.length && existing[i]) {
          arrows.push(existing[i]!)
        } else {
          const position = new THREE.Vector3()
          position.setFromSphericalCoords(
            rnd(10, 300, 1.6),
            Math.PI / 2 + rnd(-0.1, 0.1),
            rnd(0, 2 * Math.PI)
          )

          const velocity = new THREE.Vector3()
          velocity.copy(position).cross(UP).normalize()
            .multiplyScalar(Math.PI * Math.PI)
            .add(new THREE.Vector3(rnd(5), rnd(4), rnd(3)))

          arrows.push({
            position,
            velocity,
            rotation: new THREE.Quaternion(),
            color: scheme.fn(i),
          })
        }
      }

      arrowsRef.current = arrows
      prevCountRef.current = count
    }

    // Recolor all arrows when scheme changes
    if (needsRecolor || needsReinit) {
      const arrows = arrowsRef.current!
      for (let i = 0; i < count; i++) {
        arrows[i]!.color = scheme.fn(i)
        meshRef.current!.setColorAt(i, arrows[i]!.color)
      }
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
      prevSchemeRef.current = schemeIdx
    }

    const arrows = arrowsRef.current!
    const mesh = meshRef.current!

    // Update simulation
    for (let i = 0; i < count; i++) {
      const arrow = arrows[i]!

      _v3.copy(arrow.position)
        .multiplyScalar(-Math.PI / arrow.position.lengthSq())
      arrow.velocity.add(_v3)

      _v3.copy(arrow.velocity).multiplyScalar(dt)
      arrow.position.add(_v3)

      _v3.copy(arrow.velocity).normalize()
      arrow.rotation.setFromUnitVectors(ARROW_FORWARD, _v3)

      dummy.position.copy(arrow.position)
      dummy.quaternion.copy(arrow.rotation)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true

    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(count)
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[-0.5, 1, 1.5]} intensity={0.7} />
      <instancedMesh
        ref={meshRef}
        args={[baseGeometry, material, count]}
        frustumCulled={false}
      />
    </>
  )
}
