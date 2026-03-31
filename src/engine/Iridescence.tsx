import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Iridescence — Fluid holographic shader on a 3D sphere.
 * Domain-warping fragment shader with 3D position-aware warping
 * to eliminate pattern repetition. Asymmetric shadow for crescent moon effects.
 */

// ── Palette data ─────────────────────────────────────────────
type PhasePalette = {
  mode: 'phase'
  offset: readonly [number, number, number]
  scale: readonly [number, number, number]
  bg: number
  satMult: number
}
type RemapPalette = {
  mode: 'remap'
  colorA: readonly [number, number, number]
  colorB: readonly [number, number, number]
  colorC: readonly [number, number, number]
}
type IriPalette = PhasePalette | RemapPalette

const IRI_PALETTES: IriPalette[] = [
  /* 0 Holographic */ { mode: 'phase', offset: [0.0, 0.0, 0.0], scale: [1.0, 1.0, 1.0], bg: 1.0, satMult: 1.0 },
  /* 1 PRTCL       */ { mode: 'remap', colorA: [0.03, 0.02, 0.05], colorB: [1.0, 0.17, 0.84], colorC: [0.49, 1.0, 0.0] },
  /* 2 Sunset      */ { mode: 'remap', colorA: [0.05, 0.02, 0.08], colorB: [1.0, 0.3, 0.15], colorC: [1.0, 0.85, 0.2] },
  /* 3 Ocean       */ { mode: 'remap', colorA: [0.01, 0.03, 0.08], colorB: [0.0, 0.5, 0.8], colorC: [0.1, 1.0, 0.9] },
  /* 4 Neon        */ { mode: 'remap', colorA: [0.04, 0.0, 0.06], colorB: [0.6, 0.0, 1.0], colorC: [0.0, 1.0, 0.4] },
  /* 5 Grayscale   */ { mode: 'phase', offset: [0.0, 0.0, 0.0], scale: [1.0, 1.0, 1.0], bg: 0.0, satMult: 0.0 },
]

const fragmentShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uZoom;
  uniform float uComplexity;
  uniform float uMorphSpeed;
  uniform float uMorphIntensity;
  uniform float uSaturation;
  uniform vec2 uPointer;
  uniform float uPointerActive;

  // Shadow
  uniform float uShadow;       // 0 = no shadow, 2 = deep crescent
  uniform float uShadowAngle;  // rotates light around sphere (radians)

  // Phase mode
  uniform vec3 uColorOffset;
  uniform vec3 uColorScale;
  uniform float uBgBrightness;

  // Remap mode
  uniform float uRemap;
  uniform vec3 uRemapA;
  uniform vec3 uRemapB;
  uniform vec3 uRemapC;

  void main() {
    // Use 3D sphere position — break repetition with z-component
    vec2 uv = vPos.xy * uZoom;

    // Hash-based offset from 3D position — breaks tiling
    float h = fract(sin(dot(vPos.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    uv += h * 0.15;

    // Pointer distortion
    if (uPointerActive > 0.5) {
      vec2 diff = uv - uPointer * uZoom * 2.0;
      float dist = length(diff);
      uv += normalize(diff + 0.001) * 0.3 / (1.0 + dist * 4.0);
    }

    float time = uTime * uSpeed * 0.3;
    float morphTime = uTime * uMorphSpeed * 0.5;

    float d = -time * 0.5;
    float a = 0.0;

    // Domain warping with z-influence per iteration to break periodicity
    float zOff = vPos.z * 0.25;
    for (float i = 0.0; i < 8.0; ++i) {
      vec2 morphOffset = vec2(
        sin(morphTime + i * 1.3 + zOff),
        cos(morphTime - i * 1.1 - zOff * 0.7)
      ) * uMorphIntensity;
      a += cos(i - d - (uv.x + morphOffset.x + zOff * 0.3) * uComplexity);
      d += sin((uv.y + morphOffset.y + zOff * 0.2) * uComplexity + a);
    }
    d += time * 0.5;

    // Z-component variation in color
    d += vPos.z * 0.3;

    vec3 col;

    if (uRemap > 0.5) {
      vec3 raw = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
      raw = cos(raw * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
      float lum = dot(raw, vec3(0.299, 0.587, 0.114));

      col = lum < 0.5
        ? mix(uRemapA, uRemapB, lum * 2.0)
        : mix(uRemapB, uRemapC, (lum - 0.5) * 2.0);

      float remapLum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(remapLum), col, uSaturation);
    } else {
      col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
      col = cos((col + uColorOffset) * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
      col *= uColorScale;
      col = mix(col * col * 1.5, col, uBgBrightness);

      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, uSaturation);
    }

    // ── 3D shading ──────────────────────────────────────────
    vec3 N = normalize(vViewNormal);
    vec3 V = normalize(-vViewPos);

    // Fresnel rim darkening
    float fresnel = dot(N, V);
    float rimDark = smoothstep(0.0, 0.6, fresnel);

    // Asymmetric directional light — rotatable via uShadowAngle
    float ca = cos(uShadowAngle);
    float sa = sin(uShadowAngle);
    vec3 lightDir = normalize(vec3(ca * 0.7, 0.5, sa * 0.7));
    float NdotL = dot(N, lightDir);

    // Shadow wrap: uShadow controls how much of sphere is dark
    // 0 = fully lit, 1 = half shadow, 2 = deep crescent
    float shading = smoothstep(-0.2, max(0.01, 1.5 - uShadow), NdotL);
    shading = mix(1.0, shading, min(uShadow, 1.0)); // blend in shadow effect

    col *= rimDark * shading;

    // Subtle rim glow
    float rimGlow = pow(1.0 - fresnel, 4.0) * 0.12;
    col += rimGlow;

    gl_FragColor = vec4(col, 1.0);
  }
`

const vertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  void main() {
    vPos = position;
    vViewNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`

export function Iridescence() {
  const meshRef = useRef<THREE.Mesh>(null)

  const { geo, mat } = useMemo(() => {
    const g = new THREE.SphereGeometry(2.5, 128, 128)
    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.6 },
        uZoom: { value: 1.0 },
        uComplexity: { value: 0.7 },
        uMorphSpeed: { value: 0.83 },
        uMorphIntensity: { value: 0.7 },
        uSaturation: { value: 1.0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPointerActive: { value: 0.0 },
        uShadow: { value: 0.5 },
        uShadowAngle: { value: 0.0 },
        // Phase mode
        uColorOffset: { value: new THREE.Vector3(0, 0, 0) },
        uColorScale: { value: new THREE.Vector3(1, 1, 1) },
        uBgBrightness: { value: 1.0 },
        // Remap mode
        uRemap: { value: 0.0 },
        uRemapA: { value: new THREE.Vector3(0, 0, 0) },
        uRemapB: { value: new THREE.Vector3(1, 0, 1) },
        uRemapC: { value: new THREE.Vector3(0, 1, 0) },
      },
    })
    return { geo: g, mat: m }
  }, [])

  const smoothPointer = useRef(new THREE.Vector2(0, 0))
  const pointerActive = useRef(0)
  const mouseDown = useRef(false)

  // Track mouse button state — disable pointer distortion during orbit drag
  useEffect(() => {
    const down = () => { mouseDown.current = true }
    const up = () => { mouseDown.current = false }
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  useFrame(({ clock, pointer }) => {
    const store = useStore.getState()
    const controls = store.controls
    const cm: Record<string, number> = {}
    for (const c of controls) cm[c.id] = c.value

    // Zoom: clamp effective zoom to 0.4–1.7
    const baseZoom = cm['iriZoom'] ?? 1.0
    const cameraZoom = store.cameraZoom
    const rawZoom = baseZoom / Math.max(0.1, cameraZoom)
    const effectiveZoom = Math.max(0.4, Math.min(1.7, rawZoom))

    const u = mat.uniforms
    u['uTime']!.value = clock.elapsedTime
    u['uSpeed']!.value = cm['iriSpeed'] ?? 0.6
    u['uZoom']!.value = effectiveZoom
    u['uComplexity']!.value = cm['iriComplexity'] ?? 0.7
    u['uMorphSpeed']!.value = cm['iriMorphSpeed'] ?? 0.83
    u['uMorphIntensity']!.value = cm['iriMorphIntensity'] ?? 0.7
    u['uShadow']!.value = cm['iriShadow'] ?? 0.5
    u['uShadowAngle']!.value = cm['iriShadowAngle'] ?? 0.0

    // Palette
    const palIdx = Math.round(cm['iriPalette'] ?? 0)
    const pal = IRI_PALETTES[palIdx] ?? IRI_PALETTES[0]!

    if (pal.mode === 'remap') {
      u['uRemap']!.value = 1.0
      ;(u['uRemapA']!.value as THREE.Vector3).set(pal.colorA[0], pal.colorA[1], pal.colorA[2])
      ;(u['uRemapB']!.value as THREE.Vector3).set(pal.colorB[0], pal.colorB[1], pal.colorB[2])
      ;(u['uRemapC']!.value as THREE.Vector3).set(pal.colorC[0], pal.colorC[1], pal.colorC[2])
      u['uSaturation']!.value = cm['iriSaturation'] ?? 1.0
    } else {
      u['uRemap']!.value = 0.0
      ;(u['uColorOffset']!.value as THREE.Vector3).set(pal.offset[0], pal.offset[1], pal.offset[2])
      ;(u['uColorScale']!.value as THREE.Vector3).set(pal.scale[0], pal.scale[1], pal.scale[2])
      u['uBgBrightness']!.value = pal.bg
      u['uSaturation']!.value = (cm['iriSaturation'] ?? 1.0) * pal.satMult
    }

    // Pointer distortion — only on hover, disabled during orbit drag
    const isHovering = Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1 && !mouseDown.current
    const targetActive = isHovering ? 1.0 : 0.0
    pointerActive.current += (targetActive - pointerActive.current) * 0.12
    smoothPointer.current.lerp(pointer, 0.15) // faster lerp = less lag
    ;(u['uPointer']!.value as THREE.Vector2).copy(smoothPointer.current)
    u['uPointerActive']!.value = pointerActive.current
  })

  return (
    <mesh ref={meshRef} geometry={geo} material={mat} />
  )
}
