import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Paper Fleet — instanced arrow geometry orbiting a gravitational center.
 * Ported from Martin Schuhfuss's instanced geometry demo.
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

  // Orient into x/z plane, centered
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
  const count = Math.min(numInstances, 10000) // cap for performance

  // Create arrow geometry once
  const baseGeometry = useMemo(() => createArrowGeometry(), [])

  // Create instanced mesh ref
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Persistent arrow state (survives across frames)
  const arrowsRef = useRef<ArrowState[] | null>(null)
  const prevCountRef = useRef(0)

  // Material with vertex colors
  const material = useMemo(() => new THREE.MeshLambertMaterial({
    vertexColors: false,
    side: THREE.DoubleSide,
  }), [])

  // Dummy for matrix composition
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    const dt = Math.min(delta, 0.1) // cap timestep

    // Initialize or resize arrows array
    if (!arrowsRef.current || prevCountRef.current !== count) {
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

          const color = new THREE.Color()
          color.setHSL(rnd(0, 0.65, 0.2), 0.3, rnd(0.3, 0.7, 2))

          arrows.push({
            position,
            velocity,
            rotation: new THREE.Quaternion(),
            color,
          })
        }
      }

      arrowsRef.current = arrows
      prevCountRef.current = count

      // Set instance colors
      for (let i = 0; i < count; i++) {
        meshRef.current!.setColorAt(i, arrows[i]!.color)
      }
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }

    const arrows = arrowsRef.current!

    // Update simulation
    const mesh = meshRef.current!
    for (let i = 0; i < count; i++) {
      const arrow = arrows[i]!

      // Gravity toward origin
      _v3.copy(arrow.position)
        .multiplyScalar(-Math.PI / arrow.position.lengthSq())
      arrow.velocity.add(_v3)

      // Position from velocity
      _v3.copy(arrow.velocity).multiplyScalar(dt)
      arrow.position.add(_v3)

      // Rotation from velocity direction
      _v3.copy(arrow.velocity).normalize()
      arrow.rotation.setFromUnitVectors(ARROW_FORWARD, _v3)

      // Write to instance matrix
      dummy.position.copy(arrow.position)
      dummy.quaternion.copy(arrow.rotation)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true

    // Report stats
    const store = useStore.getState()
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
