import { CREDITS_COMMENT } from '../templates/credits'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../templates/shader-strings'
import type { ExportPayload } from '../types'

/**
 * Generate a self-contained React/R3F component `.tsx` file from an ExportPayload.
 *
 * The output is a valid TypeScript React file that can be dropped directly into
 * any React + @react-three/fiber project. It includes:
 *   - Baked effect code and control defaults
 *   - Inline GLSL shaders
 *   - Inner ParticleCloud component with useMemo buffers + useFrame hot loop
 *   - Outer PrtclEffect component wrapping Canvas + optional OrbitControls
 */
export function generateReactComponent(payload: ExportPayload): string {
  const { effect, controls, cameraPosition, cameraTarget, settings } = payload
  const {
    particleCount,
    pointSize,
    height,
    backgroundColor,
    autoRotateSpeed,
    orbitControls,
  } = settings

  const [cx, cy, cz] = cameraPosition
  const [tx, ty, tz] = cameraTarget

  // Serialise baked control defaults as a TS object literal (indented 2 spaces)
  const controlsLines = Object.entries(controls)
    .map(([k, v]) => `  ${k}: ${v},`)
    .join('\n')
  const controlsObj = `{\n${controlsLines}\n}`

  // Escape effect code and shaders for embedding inside template-literal strings
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  const effectCodeEscaped = escape(effect.code)
  const vertexEscaped = escape(VERTEX_SHADER)
  const fragmentEscaped = escape(FRAGMENT_SHADER)

  // OrbitControls import line (conditional)
  const orbitImport = orbitControls
    ? `import { OrbitControls } from '@react-three/drei'`
    : ''

  // OrbitControls JSX inside Canvas (conditional)
  const orbitJsx = orbitControls
    ? `      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        target={[${tx}, ${ty}, ${tz}]}${autoRotateSpeed > 0 ? `
        autoRotate
        autoRotateSpeed={${autoRotateSpeed}}` : ''}
      />`
    : ''

  const heightCss = height.replace(/\s/g, '')

  return `${CREDITS_COMMENT}
/**
 * Usage:
 *   npm install @react-three/fiber @react-three/drei three
 *   npm install --save-dev @types/three
 *
 * Then import and render:
 *   import PrtclEffect from './PrtclEffect'
 *   <PrtclEffect />
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
${orbitImport}
import * as THREE from 'three'

/* ── Baked settings ───────────────────────────────────────────────────── */
const PARTICLE_COUNT = ${particleCount}
const POINT_SIZE     = ${pointSize}
const DEFAULT_CONTROLS = ${controlsObj}

/* ── Shaders ──────────────────────────────────────────────────────────── */
const VERTEX_SHADER = \`${vertexEscaped}\`

const FRAGMENT_SHADER = \`${fragmentEscaped}\`

/* ── Effect code ──────────────────────────────────────────────────────── */
const EFFECT_CODE = \`${effectCodeEscaped}\`

/* ── Props interface ──────────────────────────────────────────────────── */
interface PrtclEffectProps {
  count?: number
  pointSize?: number
  background?: string
  autoRotate?: boolean
  autoRotateSpeed?: number
  controls?: Record<string, number>
  style?: React.CSSProperties
}

/* ── Inner component (must live inside Canvas) ────────────────────────── */
function ParticleCloud({
  count = PARTICLE_COUNT,
  pointSize = POINT_SIZE,
  controls = DEFAULT_CONTROLS,
}: {
  count?: number
  pointSize?: number
  controls?: Record<string, number>
}) {
  const { camera } = useThree()

  const { geometry, material, positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const geometry  = new THREE.BufferGeometry()
    geometry.setAttribute('position',    new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.ShaderMaterial({
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: { uPointSize: { value: pointSize } },
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      transparent: true,
    })

    return { geometry, material, positions, colors }
  }, [count, pointSize])

  const effectFnRef = useRef<Function | null>(null)  // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  const targetRef   = useRef(new THREE.Vector3())
  const colorRef    = useRef(new THREE.Color())
  const clockRef    = useRef(new THREE.Clock())

  useMemo(() => {
    const addControl = (id: string, _label: string, _min: number, _max: number, _initial: number) =>
      controls[id] ?? 0
    const setInfo = () => {}
    effectFnRef.current = new Function(
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo',
      'textPoints', 'camX', 'camY', 'camZ',
      'pointerX', 'pointerY', 'pointerZ',
      'bass', 'mids', 'highs', 'energy', 'beat',
      EFFECT_CODE
    )
    void addControl  // silence unused warning — used inside baked effect via closure
    void setInfo
  }, [controls])

  useFrame(() => {
    const effectFn = effectFnRef.current
    if (!effectFn) return

    const time = clockRef.current.getElapsedTime()
    const camX = camera.position.x
    const camY = camera.position.y
    const camZ = camera.position.z
    const target = targetRef.current
    const color  = colorRef.current
    const addControl = (id: string, _label: string, _min: number, _max: number, _initial: number) =>
      controls[id] ?? 0
    const setInfo = () => {}

    for (let i = 0; i < count; i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)

      try {
        effectFn(
          i, count, target, color, time, THREE,
          addControl, setInfo,
          undefined, camX, camY, camZ,
          0, 0, 0,
          0, 0, 0, 0, 0
        )
      } catch (_) { /* swallow per-particle errors */ }

      if (!isFinite(target.x) || !isFinite(target.y) || !isFinite(target.z)) {
        target.set(0, 0, 0)
      }

      const idx = i * 3
      positions[idx]     = target.x
      positions[idx + 1] = target.y
      positions[idx + 2] = target.z
      colors[idx]        = color.r
      colors[idx + 1]    = color.g
      colors[idx + 2]    = color.b
    }

    geometry.attributes.position.needsUpdate    = true
    geometry.attributes.customColor.needsUpdate = true
  })

  return <points geometry={geometry} material={material} />
}

/* ── Exported component ───────────────────────────────────────────────── */
export default function PrtclEffect({
  count     = PARTICLE_COUNT,
  pointSize = POINT_SIZE,
  background = '${backgroundColor}',
  autoRotate = ${autoRotateSpeed > 0 ? 'true' : 'false'},
  autoRotateSpeed: rotateSpeed = ${autoRotateSpeed},
  controls = DEFAULT_CONTROLS,
  style,
}: PrtclEffectProps) {
  return (
    <div style={{ width: '100%', height: '${heightCss}', background, ...style }}>
      <Canvas
        camera={{ position: [${cx}, ${cy}, ${cz}], fov: 60, near: 0.01, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ParticleCloud count={count} pointSize={pointSize} controls={controls} />
${orbitJsx ? orbitJsx + '\n' : ''}      </Canvas>
    </div>
  )
}
`
}
